import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Generate alerts
router.post(
  '/alerts/generate',
  authenticate,
  errorHandler(InventoryController.generateAlerts)
);

// Get alerts
router.get(
  '/alerts',
  authenticate,
  errorHandler(InventoryController.getAlerts)
);

// Acknowledge alert
router.put(
  '/alerts/:id/acknowledge',
  authenticate,
  errorHandler(InventoryController.acknowledgeAlert)
);

// Get stock movements
router.get(
  '/movements',
  authenticate,
  errorHandler(InventoryController.getStockMovements)
);

// Record stock movement
router.post(
  '/movements',
  authenticate,
  errorHandler(InventoryController.recordMovement)
);

// Get dashboard
router.get(
  '/dashboard',
  authenticate,
  errorHandler(InventoryController.getDashboard)
);

// Get expiry report
router.get(
  '/expiry-report',
  authenticate,
  errorHandler(InventoryController.getExpiryReport)
);

// Get reorder report
router.get(
  '/reorder-report',
  authenticate,
  errorHandler(InventoryController.getReorderReport)
);

export default router;
