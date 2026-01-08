import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { v4 as uuid } from 'uuid';

interface Reminder {
  id: string;
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  reminderType: 'SMS' | 'Email' | 'WhatsApp';
  reminderTiming: '24h' | '2h' | '30m'; // hours before appointment
  status: 'Pending' | 'Sent' | 'Failed';
  sentAt?: string;
  createdAt: string;
}

const router = Router();
const reminders: Reminder[] = [];

const isAdminOrReceptionist = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST],
});

// Get reminder statistics (must be before other GET routes)
router.get('/stats', authenticate, isAdminOrReceptionist, (_req: Request, res: Response) => {
  const total = reminders.length;
  const sent = reminders.filter(r => r.status === 'Sent').length;
  const pending = reminders.filter(r => r.status === 'Pending').length;
  const failed = reminders.filter(r => r.status === 'Failed').length;
  
  const byType = {
    SMS: reminders.filter(r => r.reminderType === 'SMS').length,
    Email: reminders.filter(r => r.reminderType === 'Email').length,
    WhatsApp: reminders.filter(r => r.reminderType === 'WhatsApp').length,
  };

  res.json({
    success: true,
    data: {
      total,
      sent,
      pending,
      failed,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      byType,
    },
  });
});

// Get all reminders
router.get('/', authenticate, isAdminOrReceptionist, (_req: Request, res: Response) => {
  res.json({ success: true, data: reminders });
});

// Get pending reminders (to be sent)
router.get('/pending', authenticate, isAdminOrReceptionist, (_req: Request, res: Response) => {
  const pending = reminders.filter(r => r.status === 'Pending');
  res.json({ success: true, data: pending });
});

// Create reminder for appointment
router.post('/', authenticate, isAdminOrReceptionist, (req: Request, res: Response) => {
  try {
    const {
      appointmentId,
      patientName,
      patientPhone,
      patientEmail,
      appointmentDate,
      appointmentTime,
      doctorName,
      reminderType,
      reminderTiming,
    } = req.body;

    if (!appointmentId || !patientName || !patientEmail) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const reminder: Reminder = {
      id: uuid(),
      appointmentId,
      patientName,
      patientPhone: patientPhone || '',
      patientEmail,
      appointmentDate,
      appointmentTime,
      doctorName,
      reminderType: reminderType || 'Email',
      reminderTiming: reminderTiming || '24h',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    reminders.push(reminder);
    res.status(201).json({ success: true, data: reminder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send reminder (simulate sending)
router.post('/:id/send', authenticate, isAdminOrReceptionist, (req: Request, res: Response) => {
  try {
    const idx = reminders.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });

    const reminder = reminders[idx];
    
    // Simulate sending based on type
    let sentMessage = '';
    if (reminder.reminderType === 'SMS') {
      sentMessage = `SMS sent to ${reminder.patientPhone}: "Reminder: Your appointment with ${reminder.doctorName} is on ${reminder.appointmentDate} at ${reminder.appointmentTime}"`;
    } else if (reminder.reminderType === 'Email') {
      sentMessage = `Email sent to ${reminder.patientEmail}: Appointment Reminder - ${reminder.appointmentDate} ${reminder.appointmentTime}`;
    } else if (reminder.reminderType === 'WhatsApp') {
      sentMessage = `WhatsApp sent to ${reminder.patientPhone}: "Reminder: Your appointment with ${reminder.doctorName} is on ${reminder.appointmentDate} at ${reminder.appointmentTime}"`;
    }

    reminder.status = 'Sent';
    reminder.sentAt = new Date().toISOString();
    reminders[idx] = reminder;

    res.json({ success: true, data: reminder, message: sentMessage });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update reminder settings
router.put('/:id', authenticate, isAdminOrReceptionist, (req: Request, res: Response) => {
  try {
    const idx = reminders.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });

    reminders[idx] = { ...reminders[idx], ...req.body };
    res.json({ success: true, data: reminders[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, isAdminOrReceptionist, (req: Request, res: Response) => {
  try {
    const idx = reminders.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Reminder not found' });

    const removed = reminders.splice(idx, 1)[0];
    res.json({ success: true, data: removed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
