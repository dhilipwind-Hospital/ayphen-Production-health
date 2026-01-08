import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

router.post('/', authenticate, errorHandler(FeedbackController.submitFeedback));
router.get('/', authenticate, errorHandler(FeedbackController.getAllFeedback));
router.get('/my-feedback', authenticate, errorHandler(FeedbackController.getUserFeedback));
router.get('/statistics', authenticate, errorHandler(FeedbackController.getStatistics));
router.get('/:id', authenticate, errorHandler(FeedbackController.getFeedback));
router.post('/:id/respond', authenticate, errorHandler(FeedbackController.respondToFeedback));
router.put('/:id/status', authenticate, errorHandler(FeedbackController.updateStatus));

export default router;
