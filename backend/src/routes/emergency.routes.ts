import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /emergency/dashboard:
 *   get:
 *     summary: Get emergency requests dashboard (admin/staff only)
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, in_progress, resolved, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, critical, high, medium, low]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Emergency requests list
 */
router.get(
  '/dashboard',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.getDashboard)
);

/**
 * @swagger
 * /emergency/statistics:
 *   get:
 *     summary: Get emergency statistics
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/statistics',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.getStatistics)
);

/**
 * @swagger
 * /emergency/{id}:
 *   get:
 *     summary: Get single emergency request
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.getRequest)
);

/**
 * @swagger
 * /emergency/{id}/assign:
 *   patch:
 *     summary: Assign emergency request to staff
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/assign',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.assignRequest)
);

/**
 * @swagger
 * /emergency/{id}/status:
 *   patch:
 *     summary: Update emergency request status
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.updateStatus)
);

/**
 * @swagger
 * /emergency/{id}/priority:
 *   patch:
 *     summary: Update emergency request priority
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/priority',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.updatePriority)
);

/**
 * @swagger
 * /emergency/{id}/notes:
 *   post:
 *     summary: Add notes to emergency request
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/notes',
  authenticate,
  authorize(['admin', 'super_admin', 'doctor', 'nurse']),
  errorHandler(EmergencyController.addNotes)
);

/**
 * @swagger
 * /emergency/{id}:
 *   delete:
 *     summary: Delete emergency request
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  errorHandler(EmergencyController.deleteRequest)
);

export default router;
