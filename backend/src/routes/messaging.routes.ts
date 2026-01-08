import { Router } from 'express';
import { MessagingController } from '../controllers/messaging.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

router.post('/', authenticate, errorHandler(MessagingController.sendMessage));
router.get('/conversations', authenticate, errorHandler(MessagingController.getConversations));
router.get('/unread/count', authenticate, errorHandler(MessagingController.getUnreadCount));
router.get('/:otherUserId', authenticate, errorHandler(MessagingController.getMessages));
router.put('/:id/read', authenticate, errorHandler(MessagingController.markAsRead));
router.delete('/:id', authenticate, errorHandler(MessagingController.deleteMessage));

export default router;
