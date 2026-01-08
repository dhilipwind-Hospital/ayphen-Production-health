import { Router } from 'express';
import { SupplierController } from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Get all suppliers
router.get(
  '/',
  authenticate,
  errorHandler(SupplierController.getSuppliers)
);

// Get supplier by ID
router.get(
  '/:id',
  authenticate,
  errorHandler(SupplierController.getSupplier)
);

// Create supplier
router.post(
  '/',
  authenticate,
  errorHandler(SupplierController.createSupplier)
);

// Update supplier
router.put(
  '/:id',
  authenticate,
  errorHandler(SupplierController.updateSupplier)
);

// Delete supplier
router.delete(
  '/:id',
  authenticate,
  errorHandler(SupplierController.deleteSupplier)
);

// Get supplier orders
router.get(
  '/:id/orders',
  authenticate,
  errorHandler(SupplierController.getSupplierOrders)
);

export default router;
