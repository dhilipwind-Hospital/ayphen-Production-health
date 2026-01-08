import { Router } from 'express';
import { CallbackController } from '../controllers/callback.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /callback/queue:
 *   get:
 *     summary: Get callback requests queue
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/queue',
  authenticate,
  authorize(['admin', 'super_admin', 'receptionist', 'nurse']),
  errorHandler(CallbackController.getQueue)
);

/**
 * @swagger
 * /callback/statistics:
 *   get:
 *     summary: Get callback statistics
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/statistics',
  authenticate,
  authorize(['admin', 'super_admin', 'receptionist', 'nurse']),
  errorHandler(CallbackController.getStatistics)
);

/**
 * @swagger
 * /callback/{id}:
 *   get:
 *     summary: Get single callback request
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin', 'receptionist', 'nurse']),
  errorHandler(CallbackController.getRequest)
);

/**
 * @swagger
 * /callback/{id}/assign:
 *   patch:
 *     summary: Assign callback request to staff
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/assign',
  authenticate,
  authorize(['admin', 'super_admin', 'receptionist', 'nurse']),
  errorHandler(CallbackController.assignRequest)
);

/**
 * @swagger
 * /callback/{id}/status:
 *   patch:
 *     summary: Update callback request status
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin', 'super_admin', 'receptionist', 'nurse']),
  errorHandler(CallbackController.updateStatus)
);

/**
 * @swagger
 * /callback/{id}/notes:
 *   post:
 *     summary: Add notes to callback request
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/notes',
  authenticate,
  authorize(['admin', 'super_admin', 'receptionist', 'nurse']),
  errorHandler(CallbackController.addNotes)
);

/**
 * @swagger
 * /callback/{id}:
 *   delete:
 *     summary: Delete callback request
 *     tags: [Callback]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  errorHandler(CallbackController.deleteRequest)
);

export default router;
