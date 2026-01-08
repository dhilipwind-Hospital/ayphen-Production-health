import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 */
router.get(
  '/',
  authenticate,
  errorHandler(NotificationController.getMyNotifications)
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/unread-count',
  authenticate,
  errorHandler(NotificationController.getUnreadCount)
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/read',
  authenticate,
  errorHandler(NotificationController.markAsRead)
);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/mark-all-read',
  authenticate,
  errorHandler(NotificationController.markAllAsRead)
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  errorHandler(NotificationController.deleteNotification)
);

/**
 * @swagger
 * /notifications/announcement:
 *   post:
 *     summary: Send system announcement (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/announcement',
  authenticate,
  authorize(['admin', 'super_admin']),
  errorHandler(NotificationController.sendAnnouncement)
);

export default router;
