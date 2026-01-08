import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { User } from '../models/User';
import { Prescription } from '../models/pharmacy/Prescription';
import { LabOrder } from '../models/LabOrder';
import { createTenantRepository } from '../repositories/TenantRepository';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/medical-records');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

// Get all medical records for a patient
export const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const { patientId, type, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const medicalRecordRepo = AppDataSource.getRepository(MedicalRecord);

    // Build query
    const queryBuilder = medicalRecordRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('record.doctor', 'doctor')
      .where('record.organizationId = :orgId', { orgId });

    // Filter by patient
    if (patientId) {
      queryBuilder.andWhere('record.patient_id = :patientId', { patientId });
    } else if (user.role === 'patient') {
      // If patient is logged in, show only their records
      queryBuilder.andWhere('record.patient_id = :userId', { userId: user.id });
    }

    // Filter by type
    if (type && type !== 'all') {
      queryBuilder.andWhere('record.type = :type', { type });
    }

    // Filter by date range
    if (startDate) {
      queryBuilder.andWhere('record.recordDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('record.recordDate <= :endDate', { endDate });
    }

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(record.title ILIKE :search OR record.description ILIKE :search OR record.diagnosis ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    // Order by date
    queryBuilder.orderBy('record.recordDate', 'DESC');

    const [records, total] = await queryBuilder.getManyAndCount();

    return res.json({
      data: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return res.status(500).json({ message: 'Failed to fetch medical records' });
  }
};

// Get single medical record
export const getMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(MedicalRecord),
      orgId
    );

    const record = await tenantRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor']
    });

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check permissions
    if (user.role === 'patient' && record.patient.id !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(record);
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return res.status(500).json({ message: 'Failed to fetch medical record' });
  }
};

// Create medical record
export const createMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, type, title, description, diagnosis, treatment, medications, recordDate } = req.body;
    const file = (req as any).file;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const userTenantRepo = createTenantRepository(
      AppDataSource.getRepository(User),
      orgId
    );

    // Validate patient exists
    const patient = await userTenantRepo.findOne({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Validate doctor if provided
    let doctor;
    if (doctorId) {
      doctor = await userTenantRepo.findOne({ where: { id: doctorId } });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
    } else if (user.role === 'doctor') {
      doctor = user;
    }

    // Create record using tenant repository
    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(MedicalRecord),
      orgId
    );

    const record = tenantRepo.create({
      patient,
      doctor,
      type: type || RecordType.CONSULTATION,
      title,
      description,
      diagnosis,
      treatment,
      medications,
      recordDate: recordDate || new Date(),
      fileUrl: file ? `/uploads/medical-records/${file.filename}` : undefined
    });

    await tenantRepo.save(record);

    return res.status(201).json(record);
  } catch (error) {
    console.error('Error creating medical record:', error);
    return res.status(500).json({ message: 'Failed to create medical record' });
  }
};

// Update medical record
export const updateMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, title, description, diagnosis, treatment, medications, recordDate } = req.body;
    const file = (req as any).file;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(MedicalRecord),
      orgId
    );

    const record = await tenantRepo.findOne({ where: { id } });
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Update fields
    if (type) record.type = type;
    if (title) record.title = title;
    if (description !== undefined) record.description = description;
    if (diagnosis !== undefined) record.diagnosis = diagnosis;
    if (treatment !== undefined) record.treatment = treatment;
    if (medications !== undefined) record.medications = medications;
    if (recordDate) record.recordDate = recordDate;
    if (file) record.fileUrl = `/uploads/medical-records/${file.filename}`;

    await tenantRepo.save(record);

    return res.json(record);
  } catch (error) {
    console.error('Error updating medical record:', error);
    return res.status(500).json({ message: 'Failed to update medical record' });
  }
};

// Delete medical record
export const deleteMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(MedicalRecord),
      orgId
    );

    const record = await tenantRepo.findOne({ where: { id } });
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Delete file if exists
    if (record.fileUrl) {
      const filePath = path.join(__dirname, '../..', record.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await AppDataSource.getRepository(MedicalRecord).remove(record);

    return res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    return res.status(500).json({ message: 'Failed to delete medical record' });
  }
};

// Download medical record file
export const downloadMedicalRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const tenantRepo = createTenantRepository(
      AppDataSource.getRepository(MedicalRecord),
      orgId
    );

    const record = await tenantRepo.findOne({
      where: { id },
      relations: ['patient']
    });

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check permissions
    if (user.role === 'patient' && record.patient.id !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!record.fileUrl) {
      return res.status(404).json({ message: 'No file attached to this record' });
    }

    const filePath = path.join(__dirname, '../..', record.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    return res.download(filePath);
  } catch (error) {
    console.error('Error downloading medical record:', error);
    return res.status(500).json({ message: 'Failed to download medical record' });
  }
};

// Get aggregated medical records (prescriptions + lab results + records)
export const getAggregatedRecords = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query;
    const user = (req as any).user;
    const orgId = (req as any).tenant?.id || user?.organization_id;

    if (!orgId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const targetPatientId = patientId || (user.role === 'patient' ? user.id : null);

    if (!targetPatientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Create tenant repositories
    const medicalRecordTenantRepo = createTenantRepository(
      AppDataSource.getRepository(MedicalRecord),
      orgId
    );

    const prescriptionTenantRepo = createTenantRepository(
      AppDataSource.getRepository(Prescription),
      orgId
    );

    const labOrderTenantRepo = createTenantRepository(
      AppDataSource.getRepository(LabOrder),
      orgId
    );

    // Get medical records
    const medicalRecords = await medicalRecordTenantRepo.find({
      where: { patient: { id: targetPatientId as string } },
      relations: ['patient', 'doctor'],
      order: { recordDate: 'DESC' },
      take: 50
    });

    // Get prescriptions
    const prescriptions = await prescriptionTenantRepo.find({
      where: { patient: { id: targetPatientId as string } },
      relations: ['patient', 'doctor'],
      order: { createdAt: 'DESC' },
      take: 50
    });

    // Get lab orders
    const labOrders = await labOrderTenantRepo.find({
      where: { patient: { id: targetPatientId as string } },
      relations: ['patient', 'doctor', 'items'],
      order: { createdAt: 'DESC' },
      take: 50
    });

    // Combine and format
    const aggregated = [
      ...medicalRecords.map((r: MedicalRecord) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        date: r.recordDate,
        doctor: r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'N/A',
        patient: r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : 'N/A',
        hasFile: !!r.fileUrl,
        source: 'medical_record'
      })),
      ...prescriptions.map((p: any) => ({
        id: p.id,
        type: 'prescription',
        title: 'Prescription',
        date: p.createdAt,
        doctor: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : 'N/A',
        patient: p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : 'N/A',
        status: p.status,
        hasFile: false,
        source: 'prescription'
      })),
      ...labOrders.map((l: any) => ({
        id: l.id,
        type: 'lab_report',
        title: `Lab Order ${l.orderNumber}`,
        date: l.createdAt,
        doctor: l.doctor ? `Dr. ${l.doctor.firstName} ${l.doctor.lastName}` : 'N/A',
        patient: l.patient ? `${l.patient.firstName} ${l.patient.lastName}` : 'N/A',
        hasFile: false,
        source: 'lab_order'
      }))
    ];

    // Sort by date
    aggregated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({ data: aggregated });
  } catch (error) {
    console.error('Error fetching aggregated records:', error);
    return res.status(500).json({ message: 'Failed to fetch aggregated records' });
  }
};
