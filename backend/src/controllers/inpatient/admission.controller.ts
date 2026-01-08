import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Admission, AdmissionStatus } from '../../models/inpatient/Admission';
import { Bed, BedStatus } from '../../models/inpatient/Bed';
import { User } from '../../models/User';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class AdmissionController {
  // Generate unique admission number
  private static async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const admissionRepository = AppDataSource.getRepository(Admission);
    
    // Get count of admissions this year
    const count = await admissionRepository
      .createQueryBuilder('admission')
      .where('EXTRACT(YEAR FROM admission.createdAt) = :year', { year })
      .getCount();
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return `ADM-${year}-${sequence}`;
  }

  // Create new admission
  static createAdmission = async (req: Request, res: Response) => {
    try {
      const {
        patientId,
        admittingDoctorId,
        bedId,
        admissionReason,
        admissionDiagnosis,
        allergies,
        specialInstructions,
        isEmergency
      } = req.body;

      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Validate required fields
      if (!patientId || !admittingDoctorId || !bedId || !admissionReason) {
        return res.status(400).json({
          success: false,
          message: 'Patient, doctor, bed, and admission reason are required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);
      const bedRepository = AppDataSource.getRepository(Bed);
      const userRepository = AppDataSource.getRepository(User);

      // Verify patient exists (with tenant filtering)
      const patient = await userRepository.findOne({ 
        where: { id: patientId, role: 'patient', organizationId: tenantId } 
      });
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // CRITICAL: Verify doctor exists within organization
      const doctor = await userRepository.findOne({
        where: { id: admittingDoctorId, role: 'doctor', organizationId: tenantId }
      });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // CRITICAL: Verify bed exists and is available within organization
      const bed = await bedRepository.findOne({
        where: { id: bedId, organizationId: tenantId },
        relations: ['currentAdmission']
      });
      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }
      if (bed.status !== BedStatus.AVAILABLE || bed.currentAdmission) {
        return res.status(400).json({
          success: false,
          message: 'Bed is not available'
        });
      }

      // Generate admission number
      const admissionNumber = await this.generateAdmissionNumber();

      // Create admission
      const admission = admissionRepository.create({
        admissionNumber,
        patientId,
        admittingDoctorId,
        bedId,
        organizationId: tenantId,
        admissionDateTime: new Date(),
        admissionReason,
        admissionDiagnosis,
        allergies,
        specialInstructions,
        isEmergency: isEmergency || false,
        status: AdmissionStatus.ADMITTED
      });

      await admissionRepository.save(admission);

      // Update bed status
      bed.status = BedStatus.OCCUPIED;
      await bedRepository.save(bed);

      // Send admission notification email
      try {
        const { EmailService } = await import('../../services/email.service');
        EmailService.sendNotificationEmail(
          patient.email,
          'Hospital Admission Confirmation',
          `You have been admitted to the hospital. Admission Number: ${admissionNumber}. Your assigned bed is ${bed.bedNumber}.`,
          'info'
        ).catch(err => console.error('Failed to send admission email:', err));
      } catch (emailError) {
        console.error('Email service error:', emailError);
      }

      // CRITICAL: Fetch complete admission with relations, filtered by organization
      const savedAdmission = await admissionRepository.findOne({
        where: { id: admission.id, organizationId: tenantId },
        relations: ['patient', 'admittingDoctor', 'bed', 'bed.room', 'bed.room.ward']
      });

      return res.status(201).json({
        success: true,
        message: 'Patient admitted successfully',
        admission: savedAdmission
      });
    } catch (error) {
      console.error('Error creating admission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create admission'
      });
    }
  };

  // Get all admissions
  static getAllAdmissions = async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organization_id using queryBuilder
      const queryBuilder = admissionRepository
        .createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.admittingDoctor', 'doctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.organization_id = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC');

      if (status) {
        queryBuilder.andWhere('admission.status = :status', { status });
      }

      const admissions = await queryBuilder.getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching admissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admissions'
      });
    }
  };

  // Get current admissions (active patients)
  static getCurrentAdmissions = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organization_id using queryBuilder
      const admissions = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.admittingDoctor', 'admittingDoctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.status = :status', { status: AdmissionStatus.ADMITTED })
        .andWhere('admission.organization_id = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC')
        .getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching current admissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch current admissions'
      });
    }
  };

  // Get admission by ID
  static getAdmissionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organization_id using queryBuilder
      const admission = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.admittingDoctor', 'admittingDoctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .leftJoinAndSelect('admission.nursingNotes', 'nursingNotes')
        .leftJoinAndSelect('admission.doctorNotes', 'doctorNotes')
        .leftJoinAndSelect('admission.vitalSigns', 'vitalSigns')
        .leftJoinAndSelect('admission.medications', 'medications')
        .leftJoinAndSelect('admission.dischargeSummary', 'dischargeSummary')
        .where('admission.id = :id', { id })
        .andWhere('admission.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      return res.json({
        success: true,
        admission
      });
    } catch (error) {
      console.error('Error fetching admission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admission'
      });
    }
  };

  // Get patient admissions
  static getPatientAdmissions = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organization_id using queryBuilder
      const admissions = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.admittingDoctor', 'admittingDoctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.patientId = :patientId', { patientId })
        .andWhere('admission.organization_id = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC')
        .getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching patient admissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patient admissions'
      });
    }
  };

  // Get doctor's patients
  static getDoctorPatients = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organization_id using queryBuilder
      const admissions = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.admittingDoctorId = :doctorId', { doctorId })
        .andWhere('admission.status = :status', { status: AdmissionStatus.ADMITTED })
        .andWhere('admission.organization_id = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC')
        .getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch doctor patients'
      });
    }
  };

  // Transfer patient to different bed
  static transferPatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newBedId, reason } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      if (!newBedId) {
        return res.status(400).json({
          success: false,
          message: 'New bed ID is required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);
      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Get current admission filtered by organization
      const admission = await admissionRepository.findOne({
        where: { id, organizationId: tenantId },
        relations: ['bed']
      });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // CRITICAL: Verify new bed is available within organization
      const newBed = await bedRepository.findOne({
        where: { id: newBedId, organizationId: tenantId },
        relations: ['currentAdmission']
      });
      if (!newBed) {
        return res.status(404).json({
          success: false,
          message: 'New bed not found'
        });
      }
      if (newBed.status !== BedStatus.AVAILABLE || newBed.currentAdmission) {
        return res.status(400).json({
          success: false,
          message: 'New bed is not available'
        });
      }

      // Free old bed
      const oldBed = admission.bed;
      oldBed.status = BedStatus.AVAILABLE;
      await bedRepository.save(oldBed);

      // Assign new bed
      admission.bedId = newBedId;
      newBed.status = BedStatus.OCCUPIED;
      await bedRepository.save(newBed);
      await admissionRepository.save(admission);

      return res.json({
        success: true,
        message: 'Patient transferred successfully',
        admission
      });
    } catch (error) {
      console.error('Error transferring patient:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to transfer patient'
      });
    }
  };

  // Discharge patient
  static dischargePatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);
      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Get admission filtered by organization
      const admission = await admissionRepository.findOne({
        where: { id, organizationId: tenantId },
        relations: ['bed', 'patient', 'dischargeSummary']
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      if (admission.status === AdmissionStatus.DISCHARGED) {
        return res.status(400).json({
          success: false,
          message: 'Patient already discharged'
        });
      }

      // Check if discharge summary exists
      if (!admission.dischargeSummary) {
        return res.status(400).json({
          success: false,
          message: 'Discharge summary required before discharge'
        });
      }

      // Update admission
      admission.status = AdmissionStatus.DISCHARGED;
      admission.dischargeDateTime = new Date();
      await admissionRepository.save(admission);

      // Free bed
      const bed = admission.bed;
      bed.status = BedStatus.CLEANING;
      await bedRepository.save(bed);

      return res.json({
        success: true,
        message: 'Patient discharged successfully',
        admission
      });
    } catch (error) {
      console.error('Error discharging patient:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to discharge patient'
      });
    }
  };
}
