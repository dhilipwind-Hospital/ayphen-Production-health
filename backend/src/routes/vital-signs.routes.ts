import { Router } from 'express';
import { VitalSignsController } from '../controllers/vital-signs.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Record vital signs
router.post(
  '/',
  authenticate,
  errorHandler(VitalSignsController.recordVitalSigns)
);

// Get vital signs
router.get(
  '/:id',
  authenticate,
  errorHandler(VitalSignsController.getVitalSigns)
);

// Get patient vital signs
router.get(
  '/patient/:id',
  authenticate,
  errorHandler(VitalSignsController.getPatientVitalSigns)
);

// Get vital signs trends
router.get(
  '/patient/:id/trends',
  authenticate,
  errorHandler(VitalSignsController.getVitalSignsTrends)
);

export default router;
