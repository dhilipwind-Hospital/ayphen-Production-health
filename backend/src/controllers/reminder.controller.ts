import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Reminder, ReminderType, ReminderStatus } from '../models/Reminder';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { LessThan } from 'typeorm';
import { createTenantRepository } from '../repositories/TenantRepository';

export class ReminderController {
  // Create reminder
  static createReminder = async (req: Request, res: Response) => {
    try {
      const { userId, type, title, message, scheduledFor, appointmentId, medicationName, sendEmail, sendSms, sendNotification } = req.body;

      if (!userId || !type || !title || !message || !scheduledFor) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      const reminderRepo = AppDataSource.getRepository(Reminder);
      const userRepo = AppDataSource.getRepository(User);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const reminder = reminderRepo.create({
        user,
        type,
        title,
        message,
        scheduledFor: new Date(scheduledFor),
        medicationName,
        sendEmail: sendEmail || false,
        sendSms: sendSms || false,
        sendNotification: sendNotification !== false
      });

      if (appointmentId) {
        const appointmentRepo = AppDataSource.getRepository(Appointment);
        const appointment = await appointmentRepo.findOne({ where: { id: appointmentId } });
        if (appointment) {
          reminder.appointment = appointment;
        }
      }

      await reminderRepo.save(reminder);

      return res.status(201).json({
        message: 'Reminder created successfully',
        data: reminder
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
      return res.status(500).json({ message: 'Error creating reminder' });
    }
  };

  // Get user reminders
  static getUserReminders = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { status, type } = req.query;

      const reminderRepo = AppDataSource.getRepository(Reminder);

      const queryBuilder = reminderRepo.createQueryBuilder('reminder')
        .leftJoinAndSelect('reminder.appointment', 'appointment')
        .where('reminder.userId = :userId', { userId })
        .orderBy('reminder.scheduledFor', 'ASC');

      if (status) {
        queryBuilder.andWhere('reminder.status = :status', { status });
      }

      if (type) {
        queryBuilder.andWhere('reminder.type = :type', { type });
      }

      const reminders = await queryBuilder.getMany();

      return res.json({
        data: reminders,
        total: reminders.length
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return res.status(500).json({ message: 'Error fetching reminders' });
    }
  };

  // Get pending reminders (for scheduler)
  static getPendingReminders = async (req: Request, res: Response) => {
    try {
      const reminderRepo = AppDataSource.getRepository(Reminder);

      const now = new Date();
      const reminders = await reminderRepo.find({
        where: {
          status: ReminderStatus.PENDING,
          scheduledFor: LessThan(now)
        },
        relations: ['user', 'appointment']
      });

      return res.json({
        data: reminders,
        total: reminders.length
      });
    } catch (error) {
      console.error('Error fetching pending reminders:', error);
      return res.status(500).json({ message: 'Error fetching pending reminders' });
    }
  };

  // Update reminder status
  static updateReminderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const reminderRepo = AppDataSource.getRepository(Reminder);

      const reminder = await reminderRepo.findOne({ where: { id } });
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      reminder.status = status;
      if (status === ReminderStatus.SENT) {
        reminder.sentAt = new Date();
      }

      await reminderRepo.save(reminder);

      return res.json({
        message: 'Reminder status updated',
        data: reminder
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      return res.status(500).json({ message: 'Error updating reminder' });
    }
  };

  // Delete reminder
  static deleteReminder = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const reminderRepo = AppDataSource.getRepository(Reminder);

      const reminder = await reminderRepo.findOne({
        where: { id },
        relations: ['user']
      });

      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }

      if (reminder.user.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await reminderRepo.remove(reminder);

      return res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return res.status(500).json({ message: 'Error deleting reminder' });
    }
  };

  // Auto-create appointment reminders
  static createAppointmentReminders = async (req: Request, res: Response) => {
    try {
      const appointmentRepo = AppDataSource.getRepository(Appointment);
      const reminderRepo = AppDataSource.getRepository(Reminder);

      // Get upcoming appointments (next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const appointments = await appointmentRepo
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.patient', 'patient')
        .leftJoinAndSelect('appointment.doctor', 'doctor')
        .where('appointment.startTime BETWEEN :now AND :nextWeek', { now, nextWeek })
        .andWhere('appointment.status = :status', { status: 'confirmed' })
        .getMany();

      const remindersCreated = [];

      for (const appointment of appointments) {
        // Check if reminder already exists
        const existingReminder = await reminderRepo.findOne({
          where: {
            appointment: { id: appointment.id },
            type: ReminderType.APPOINTMENT
          }
        });

        if (!existingReminder && appointment.patient) {
          // Create reminder for 24 hours before appointment
          const reminderTime = new Date(appointment.startTime.getTime() - 24 * 60 * 60 * 1000);

          const reminder = reminderRepo.create({
            user: appointment.patient,
            type: ReminderType.APPOINTMENT,
            title: 'Appointment Reminder',
            message: `You have an appointment with Dr. ${appointment.doctor?.firstName} ${appointment.doctor?.lastName} tomorrow at ${appointment.startTime.toLocaleTimeString()}.`,
            scheduledFor: reminderTime,
            appointment,
            sendNotification: true,
            sendEmail: true
          });

          await reminderRepo.save(reminder);
          remindersCreated.push(reminder);
        }
      }

      return res.json({
        message: `Created ${remindersCreated.length} appointment reminders`,
        data: remindersCreated
      });
    } catch (error) {
      console.error('Error creating appointment reminders:', error);
      return res.status(500).json({ message: 'Error creating appointment reminders' });
    }
  };
}
