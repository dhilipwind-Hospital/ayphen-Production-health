import { Router } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.get('/plans', InsuranceController.listPlans);
router.post('/plans/recommend', InsuranceController.recommendPlans);
router.post('/plans/compare', InsuranceController.comparePlans);
router.post('/calculator/premium', InsuranceController.calculatePremium);
router.post('/plans/family-calc', InsuranceController.familyCalc);

// Patient endpoints (auth required)
router.post('/plans/purchase', authenticate as any, InsuranceController.purchase);
router.get('/users/me/claims', authenticate as any, InsuranceController.listMyClaims);
router.get('/users/me/dashboard', authenticate as any, InsuranceController.myDashboard);

export default router;
