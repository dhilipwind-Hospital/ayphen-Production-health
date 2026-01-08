import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchase-order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Get all purchase orders
router.get(
  '/',
  authenticate,
  errorHandler(PurchaseOrderController.getPurchaseOrders)
);

// Get purchase order by ID
router.get(
  '/:id',
  authenticate,
  errorHandler(PurchaseOrderController.getPurchaseOrder)
);

// Create purchase order
router.post(
  '/',
  authenticate,
  errorHandler(PurchaseOrderController.createPurchaseOrder)
);

// Update order status
router.put(
  '/:id/status',
  authenticate,
  errorHandler(PurchaseOrderController.updateOrderStatus)
);

// Receive purchase order
router.post(
  '/:id/receive',
  authenticate,
  errorHandler(PurchaseOrderController.receivePurchaseOrder)
);

// Auto-generate purchase orders
router.post(
  '/auto-generate',
  authenticate,
  errorHandler(PurchaseOrderController.generateAutoOrders)
);

export default router;
