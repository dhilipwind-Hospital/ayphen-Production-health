import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isDoctor } from '../middleware/rbac.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { ReferralController } from '../controllers/referral.controller';

const router = Router();

// Admin-only for now
router.post('/referrals', authenticate, isAdmin, errorHandler(ReferralController.createReferral));
router.get('/patients/:patientId/referrals', authenticate, isAdmin, errorHandler(ReferralController.listPatientReferrals));

// Doctor: create referral for a patient they can access per FR-001
router.post('/patients/:patientId/referrals/doctor', authenticate, isDoctor, errorHandler(ReferralController.doctorCreateReferral));
// Doctor: list referrals for a patient (FR-001/treated-patient enforced)
router.get('/patients/:patientId/referrals/doctor', authenticate, isDoctor, errorHandler(ReferralController.doctorListReferrals));

export default router;
