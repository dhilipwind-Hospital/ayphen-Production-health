import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionsByDoctor,
  getPrescriptionsByPatient,
  getPharmacyPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
  updatePrescription,
  cancelPrescription
} from '../controllers/prescription.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = Router();

// Create a new prescription (doctors only)
router.post('/', authenticate, checkRole(['doctor']), createPrescription);

// Get prescriptions by doctor
router.get('/doctor/:doctorId', authenticate, checkRole(['doctor', 'admin']), getPrescriptionsByDoctor);

// Get prescriptions by patient
router.get('/patient/:patientId', authenticate, getPrescriptionsByPatient);

// Get prescriptions for pharmacy
router.get('/pharmacy', authenticate, checkRole(['pharmacist', 'admin']), getPharmacyPrescriptions);

// Get a single prescription by ID
router.get('/:id', authenticate, getPrescriptionById);

// Update prescription status (for pharmacy dispensing)
router.put('/:id/status', authenticate, checkRole(['pharmacist', 'admin']), updatePrescriptionStatus);

// Update prescription (for doctors to edit pending prescriptions)
router.put('/:id', authenticate, checkRole(['doctor', 'admin']), updatePrescription);

// Cancel a prescription
router.put('/:id/cancel', authenticate, checkRole(['doctor', 'admin']), cancelPrescription);

export default router;
