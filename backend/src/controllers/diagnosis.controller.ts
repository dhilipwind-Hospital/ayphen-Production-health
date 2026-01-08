import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Diagnosis, DiagnosisType, DiagnosisStatus } from '../models/Diagnosis';
import { User } from '../models/User';
import { ConsultationNote } from '../models/ConsultationNote';
import { createTenantRepository } from '../repositories/TenantRepository';

// Common ICD-10 codes for quick selection
const COMMON_DIAGNOSES = [
  { code: 'I10', name: 'Essential (primary) hypertension' },
  { code: 'E11', name: 'Type 2 diabetes mellitus' },
  { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified' },
  { code: 'M79.3', name: 'Myalgia' },
  { code: 'R51', name: 'Headache' },
  { code: 'K21.9', name: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'J45.9', name: 'Asthma, unspecified' },
  { code: 'M25.50', name: 'Pain in unspecified joint' },
  { code: 'R50.9', name: 'Fever, unspecified' },
  { code: 'J02.9', name: 'Acute pharyngitis, unspecified' }
];

export class DiagnosisController {
  // Add diagnosis
  static addDiagnosis = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const {
        consultationId,
        patientId,
        icd10Code,
        diagnosisName,
        diagnosisType,
        status,
        severity,
        onsetDate,
        isChronic,
        notes
      } = req.body;

      if (!patientId || !diagnosisName) {
        return res.status(400).json({ message: 'Patient ID and diagnosis name are required' });
      }

      const diagnosisRepo = AppDataSource.getRepository(Diagnosis);
      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id: patientId, organizationId: tenantId }
      });
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const doctor = await userRepo.findOne({ where: { id: userId } });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const diagnosis = diagnosisRepo.create({
        patient,
        diagnosedBy: doctor,
        icd10Code,
        diagnosisName,
        diagnosisType: diagnosisType || DiagnosisType.PRIMARY,
        status: status || DiagnosisStatus.PROVISIONAL,
        severity,
        onsetDate: onsetDate ? new Date(onsetDate) : undefined,
        isChronic: isChronic || false,
        notes
      });

      // Link to consultation if provided
      if (consultationId) {
        const consultationRepo = AppDataSource.getRepository(ConsultationNote);
        const consultation = await consultationRepo.findOne({ where: { id: consultationId } });
        if (consultation) {
          diagnosis.consultation = consultation;
        }
      }

      await diagnosisRepo.save(diagnosis);

      return res.status(201).json({
        message: 'Diagnosis added successfully',
        data: diagnosis
      });
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      return res.status(500).json({ message: 'Error adding diagnosis' });
    }
  };

  // Get diagnosis by ID
  static getDiagnosis = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const diagnosisRepo = AppDataSource.getRepository(Diagnosis);
      // CRITICAL: Filter by organization_id
      const diagnosis = await diagnosisRepo.createQueryBuilder('diagnosis')
        .leftJoinAndSelect('diagnosis.patient', 'patient')
        .leftJoinAndSelect('diagnosis.diagnosedBy', 'diagnosedBy')
        .leftJoinAndSelect('diagnosis.consultation', 'consultation')
        .where('diagnosis.id = :id', { id })
        .andWhere('diagnosis.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!diagnosis) {
        return res.status(404).json({ message: 'Diagnosis not found' });
      }

      return res.json({ data: diagnosis });
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      return res.status(500).json({ message: 'Error fetching diagnosis' });
    }
  };

  // Update diagnosis
  static updateDiagnosis = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;
      const updateData = req.body;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const diagnosisRepo = AppDataSource.getRepository(Diagnosis);
      // CRITICAL: Filter by organization_id
      const diagnosis = await diagnosisRepo.findOne({
        where: { id, organizationId: tenantId },
        relations: ['diagnosedBy']
      });

      if (!diagnosis) {
        return res.status(404).json({ message: 'Diagnosis not found' });
      }

      // Only the doctor who diagnosed or admin can update
      const userRole = (req as any).user?.role;
      const isDoctor = diagnosis.diagnosedBy.id === userId;
      const isAdmin = ['admin', 'super_admin'].includes(userRole);

      if (!isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to update this diagnosis' });
      }

      Object.assign(diagnosis, updateData);
      await diagnosisRepo.save(diagnosis);

      return res.json({
        message: 'Diagnosis updated successfully',
        data: diagnosis
      });
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      return res.status(500).json({ message: 'Error updating diagnosis' });
    }
  };

  // Get patient diagnoses
  static getPatientDiagnoses = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, isChronic } = req.query;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const diagnosisRepo = AppDataSource.getRepository(Diagnosis);
      const queryBuilder = diagnosisRepo.createQueryBuilder('diagnosis')
        .leftJoinAndSelect('diagnosis.diagnosedBy', 'doctor')
        .leftJoinAndSelect('diagnosis.consultation', 'consultation')
        .where('diagnosis.patientId = :patientId', { patientId: id })
        // CRITICAL: Filter by organization_id
        .andWhere('diagnosis.organization_id = :tenantId', { tenantId })
        .orderBy('diagnosis.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('diagnosis.status = :status', { status });
      }

      if (isChronic === 'true') {
        queryBuilder.andWhere('diagnosis.isChronic = :isChronic', { isChronic: true });
      }

      const diagnoses = await queryBuilder.getMany();

      return res.json({
        data: diagnoses,
        total: diagnoses.length
      });
    } catch (error) {
      console.error('Error fetching patient diagnoses:', error);
      return res.status(500).json({ message: 'Error fetching diagnoses' });
    }
  };

  // Search ICD-10 codes
  static searchICD10 = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const searchTerm = q.toLowerCase();

      // Search in common diagnoses
      const results = COMMON_DIAGNOSES.filter(diagnosis =>
        diagnosis.code.toLowerCase().includes(searchTerm) ||
        diagnosis.name.toLowerCase().includes(searchTerm)
      );

      return res.json({
        data: results,
        total: results.length
      });
    } catch (error) {
      console.error('Error searching ICD-10:', error);
      return res.status(500).json({ message: 'Error searching ICD-10 codes' });
    }
  };

  // Get common diagnoses
  static getCommonDiagnoses = async (req: Request, res: Response) => {
    try {
      return res.json({
        data: COMMON_DIAGNOSES,
        total: COMMON_DIAGNOSES.length
      });
    } catch (error) {
      console.error('Error fetching common diagnoses:', error);
      return res.status(500).json({ message: 'Error fetching common diagnoses' });
    }
  };
}
