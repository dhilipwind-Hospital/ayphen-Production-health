import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ConsultationNote } from '../models/ConsultationNote';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class ConsultationController {
  // Create consultation note
  static createConsultation = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const {
        appointmentId,
        patientId,
        chiefComplaint,
        historyPresentIllness,
        pastMedicalHistory,
        currentMedications,
        physicalExamination,
        assessment,
        plan,
        doctorNotes,
        followUpDate,
        followUpInstructions
      } = req.body;

      if (!appointmentId || !patientId) {
        return res.status(400).json({ message: 'Appointment ID and Patient ID are required' });
      }

      const consultationRepo = AppDataSource.getRepository(ConsultationNote);
      const appointmentRepo = AppDataSource.getRepository(Appointment);
      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter appointment by organization_id
      const appointment = await appointmentRepo.findOne({
        where: { id: appointmentId, organizationId: tenantId }
      });
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id: patientId, organizationId: tenantId }
      });
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // CRITICAL: Filter doctor by organization_id
      const doctor = await userRepo.findOne({
        where: { id: userId, organizationId: tenantId }
      });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const consultation = consultationRepo.create({
        appointment,
        patient,
        doctor,
        organizationId: tenantId,
        chiefComplaint,
        historyPresentIllness,
        pastMedicalHistory,
        currentMedications,
        physicalExamination,
        assessment,
        plan,
        doctorNotes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        followUpInstructions
      });

      await consultationRepo.save(consultation);

      return res.status(201).json({
        message: 'Consultation note created successfully',
        data: consultation
      });
    } catch (error) {
      console.error('Error creating consultation:', error);
      return res.status(500).json({ message: 'Error creating consultation note' });
    }
  };

  // Get consultation by ID
  static getConsultation = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const consultationRepo = AppDataSource.getRepository(ConsultationNote);

      // CRITICAL: Filter by organization_id using queryBuilder
      const consultation = await consultationRepo.createQueryBuilder('consultation')
        .leftJoinAndSelect('consultation.appointment', 'appointment')
        .leftJoinAndSelect('consultation.patient', 'patient')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .leftJoinAndSelect('consultation.signedBy', 'signedBy')
        .where('consultation.id = :id', { id })
        .andWhere('consultation.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      // Check authorization
      const isDoctor = consultation.doctor.id === userId;
      const isPatient = consultation.patient.id === userId;
      const isAdmin = ['admin', 'super_admin'].includes(userRole);

      if (!isDoctor && !isPatient && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this consultation' });
      }

      return res.json({ data: consultation });
    } catch (error) {
      console.error('Error fetching consultation:', error);
      return res.status(500).json({ message: 'Error fetching consultation' });
    }
  };

  // Update consultation note
  static updateConsultation = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const updateData = req.body;

      const consultationRepo = AppDataSource.getRepository(ConsultationNote);

      // CRITICAL: Filter by organization_id using queryBuilder
      const consultation = await consultationRepo.createQueryBuilder('consultation')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .where('consultation.id = :id', { id })
        .andWhere('consultation.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      // Only the doctor who created it can update
      if (consultation.doctor.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this consultation' });
      }

      // Cannot update if already signed
      if (consultation.isSigned) {
        return res.status(400).json({ message: 'Cannot update signed consultation note' });
      }

      // Update fields
      Object.assign(consultation, updateData);

      await consultationRepo.save(consultation);

      return res.json({
        message: 'Consultation note updated successfully',
        data: consultation
      });
    } catch (error) {
      console.error('Error updating consultation:', error);
      return res.status(500).json({ message: 'Error updating consultation note' });
    }
  };

  // Get patient consultations
  static getPatientConsultations = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Check authorization
      const isPatient = id === userId;
      const isDoctor = userRole === 'doctor';
      const isAdmin = ['admin', 'super_admin'].includes(userRole);

      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const consultationRepo = AppDataSource.getRepository(ConsultationNote);

      // CRITICAL: Filter by organization_id using queryBuilder
      const consultations = await consultationRepo.createQueryBuilder('consultation')
        .leftJoinAndSelect('consultation.appointment', 'appointment')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .leftJoinAndSelect('consultation.signedBy', 'signedBy')
        .where('consultation.patientId = :patientId', { patientId: id })
        .andWhere('consultation.organization_id = :tenantId', { tenantId })
        .orderBy('consultation.createdAt', 'DESC')
        .getMany();

      return res.json({
        data: consultations,
        total: consultations.length
      });
    } catch (error) {
      console.error('Error fetching patient consultations:', error);
      return res.status(500).json({ message: 'Error fetching consultations' });
    }
  };

  // Sign consultation note
  static signConsultation = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const consultationRepo = AppDataSource.getRepository(ConsultationNote);
      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter by organization_id using queryBuilder
      const consultation = await consultationRepo.createQueryBuilder('consultation')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .where('consultation.id = :id', { id })
        .andWhere('consultation.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      // Only the doctor who created it can sign
      if (consultation.doctor.id !== userId) {
        return res.status(403).json({ message: 'Not authorized to sign this consultation' });
      }

      // Already signed
      if (consultation.isSigned) {
        return res.status(400).json({ message: 'Consultation already signed' });
      }

      // CRITICAL: Filter doctor by organization_id
      const doctor = await userRepo.findOne({
        where: { id: userId, organizationId: tenantId }
      });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      consultation.isSigned = true;
      consultation.signedAt = new Date();
      consultation.signedBy = doctor;

      await consultationRepo.save(consultation);

      return res.json({
        message: 'Consultation note signed successfully',
        data: consultation
      });
    } catch (error) {
      console.error('Error signing consultation:', error);
      return res.status(500).json({ message: 'Error signing consultation note' });
    }
  };

  // Get consultation PDF (placeholder)
  static getConsultationPDF = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const consultationRepo = AppDataSource.getRepository(ConsultationNote);

      // CRITICAL: Filter by organization_id using queryBuilder
      const consultation = await consultationRepo.createQueryBuilder('consultation')
        .leftJoinAndSelect('consultation.appointment', 'appointment')
        .leftJoinAndSelect('consultation.patient', 'patient')
        .leftJoinAndSelect('consultation.doctor', 'doctor')
        .leftJoinAndSelect('consultation.signedBy', 'signedBy')
        .where('consultation.id = :id', { id })
        .andWhere('consultation.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      // TODO: Implement PDF generation
      return res.json({
        message: 'PDF generation not yet implemented',
        data: consultation
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      return res.status(500).json({ message: 'Error generating PDF' });
    }
  };
}
