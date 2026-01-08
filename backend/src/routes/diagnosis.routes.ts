import { Router } from 'express';
import { DiagnosisController } from '../controllers/diagnosis.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Add diagnosis
router.post(
  '/',
  authenticate,
  errorHandler(DiagnosisController.addDiagnosis)
);

// Get diagnosis
router.get(
  '/:id',
  authenticate,
  errorHandler(DiagnosisController.getDiagnosis)
);

// Update diagnosis
router.put(
  '/:id',
  authenticate,
  errorHandler(DiagnosisController.updateDiagnosis)
);

// Get patient diagnoses
router.get(
  '/patient/:id',
  authenticate,
  errorHandler(DiagnosisController.getPatientDiagnoses)
);

// Search ICD-10 codes
router.get(
  '/icd10/search',
  authenticate,
  errorHandler(DiagnosisController.searchICD10)
);

// Get common diagnoses
router.get(
  '/common/list',
  authenticate,
  errorHandler(DiagnosisController.getCommonDiagnoses)
);

export default router;
