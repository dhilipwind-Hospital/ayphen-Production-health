import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get('/dashboard-stats', AnalyticsController.getDashboardStats);

// Get department performance
router.get('/department-performance', AnalyticsController.getDepartmentPerformance);

// Get recent activity
router.get('/recent-activity', AnalyticsController.getRecentActivity);

export default router;
