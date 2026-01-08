import { Router } from 'express';
import {
  getMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
  downloadMedicalRecord,
  getAggregatedRecords,
  upload
} from '../controllers/medicalRecords.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all medical records (with filters)
router.get('/', getMedicalRecords);

// Get aggregated records (medical records + prescriptions + lab results)
router.get('/aggregated', getAggregatedRecords);

// Get single medical record
router.get('/:id', getMedicalRecord);

// Create medical record (with optional file upload)
router.post('/', upload.single('file'), createMedicalRecord);

// Update medical record (with optional file upload)
router.put('/:id', upload.single('file'), updateMedicalRecord);

// Delete medical record
router.delete('/:id', deleteMedicalRecord);

// Download medical record file
router.get('/:id/download', downloadMedicalRecord);

export default router;
