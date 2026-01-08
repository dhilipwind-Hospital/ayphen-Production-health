import { Router } from 'express';
import { AllergyController } from '../controllers/allergy.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Add allergy
router.post(
  '/',
  authenticate,
  errorHandler(AllergyController.addAllergy)
);

// Get allergy
router.get(
  '/:id',
  authenticate,
  errorHandler(AllergyController.getAllergy)
);

// Update allergy
router.put(
  '/:id',
  authenticate,
  errorHandler(AllergyController.updateAllergy)
);

// Get patient allergies
router.get(
  '/patient/:id',
  authenticate,
  errorHandler(AllergyController.getPatientAllergies)
);

// Verify allergy
router.post(
  '/:id/verify',
  authenticate,
  errorHandler(AllergyController.verifyAllergy)
);

// Check drug allergies
router.post(
  '/check-drug',
  authenticate,
  errorHandler(AllergyController.checkDrugAllergies)
);

export default router;
