import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

router.post('/', authenticate, errorHandler(ReminderController.createReminder));
router.get('/', authenticate, errorHandler(ReminderController.getUserReminders));
router.get('/pending', authenticate, errorHandler(ReminderController.getPendingReminders));
router.post('/appointments/auto', authenticate, errorHandler(ReminderController.createAppointmentReminders));
router.put('/:id/status', authenticate, errorHandler(ReminderController.updateReminderStatus));
router.delete('/:id', authenticate, errorHandler(ReminderController.deleteReminder));

export default router;
