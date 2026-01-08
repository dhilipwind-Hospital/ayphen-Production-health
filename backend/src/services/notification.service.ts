import { NotificationController } from '../controllers/notification.controller';
import { NotificationType, NotificationPriority } from '../models/Notification';
import { EmailService } from './email.service';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

/**
 * Notification Service - Helper functions to trigger notifications from other parts of the app
 * Now includes email notifications!
 */
export class NotificationService {
  // Appointment notifications
  static async notifyNewAppointment(doctorId: string, appointmentId: string, patientName: string, appointmentTime: string) {
    await NotificationController.createNotification(
      doctorId,
      NotificationType.APPOINTMENT_NEW,
      'New Appointment',
      `New appointment with ${patientName} scheduled for ${appointmentTime}`,
      {
        priority: NotificationPriority.HIGH,
        metadata: { appointmentId },
        actionUrl: `/appointments`,
        actionLabel: 'View Appointment'
      }
    );
  }

  static async notifyAppointmentConfirmed(patientId: string, appointmentTime: string, doctorName: string, department?: string) {
    // Send in-app notification
    await NotificationController.createNotification(
      patientId,
      NotificationType.APPOINTMENT_CONFIRMED,
      'Appointment Confirmed',
      `Your appointment with Dr. ${doctorName} on ${appointmentTime} has been confirmed`,
      {
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/portal`,
        actionLabel: 'View Details'
      }
    );

    // Send email notification
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: patientId } });
      
      if (user && user.email) {
        await EmailService.sendAppointmentConfirmationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          doctorName,
          appointmentTime,
          department || 'General'
        );
      }
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
    }
  }

  static async notifyAppointmentCancelled(userId: string, appointmentTime: string, reason?: string) {
    await NotificationController.createNotification(
      userId,
      NotificationType.APPOINTMENT_CANCELLED,
      'Appointment Cancelled',
      `Your appointment on ${appointmentTime} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      {
        priority: NotificationPriority.HIGH,
        actionUrl: `/appointments/book`,
        actionLabel: 'Book New Appointment'
      }
    );
  }

  static async notifyAppointmentRescheduled(userId: string, oldTime: string, newTime: string) {
    await NotificationController.createNotification(
      userId,
      NotificationType.APPOINTMENT_RESCHEDULED,
      'Appointment Rescheduled',
      `Your appointment has been rescheduled from ${oldTime} to ${newTime}`,
      {
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/portal`,
        actionLabel: 'View Details'
      }
    );
  }

  static async notifyAppointmentReminder(patientId: string, appointmentTime: string, doctorName: string) {
    await NotificationController.createNotification(
      patientId,
      NotificationType.APPOINTMENT_REMINDER,
      'Appointment Reminder',
      `Reminder: You have an appointment with Dr. ${doctorName} tomorrow at ${appointmentTime}`,
      {
        priority: NotificationPriority.HIGH,
        actionUrl: `/portal`,
        actionLabel: 'View Details'
      }
    );
  }

  // Emergency notifications
  static async notifyNewEmergency(staffIds: string[], patientName: string, location?: string) {
    await NotificationController.broadcastNotification(
      staffIds,
      NotificationType.EMERGENCY_NEW,
      '🚨 New Emergency Request',
      `Emergency request from ${patientName}${location ? ` at ${location}` : ''}`,
      {
        priority: NotificationPriority.URGENT,
        actionUrl: `/admin/emergency-dashboard`,
        actionLabel: 'View Emergency'
      }
    );
  }

  static async notifyEmergencyAssigned(userId: string, patientName: string) {
    await NotificationController.createNotification(
      userId,
      NotificationType.EMERGENCY_ASSIGNED,
      'Emergency Assigned to You',
      `You have been assigned to handle emergency request from ${patientName}`,
      {
        priority: NotificationPriority.URGENT,
        actionUrl: `/admin/emergency-dashboard`,
        actionLabel: 'View Details'
      }
    );
  }

  // Callback notifications
  static async notifyNewCallback(staffIds: string[], patientName: string, phone: string) {
    await NotificationController.broadcastNotification(
      staffIds,
      NotificationType.CALLBACK_NEW,
      'New Callback Request',
      `Callback requested by ${patientName} (${phone})`,
      {
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/admin/callback-queue`,
        actionLabel: 'View Queue'
      }
    );
  }

  static async notifyCallbackAssigned(userId: string, patientName: string) {
    await NotificationController.createNotification(
      userId,
      NotificationType.CALLBACK_ASSIGNED,
      'Callback Assigned to You',
      `You have been assigned to call back ${patientName}`,
      {
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/admin/callback-queue`,
        actionLabel: 'View Details'
      }
    );
  }

  // Prescription notifications
  static async notifyPrescriptionReady(patientId: string, prescriptionId: string) {
    await NotificationController.createNotification(
      patientId,
      NotificationType.PRESCRIPTION_READY,
      'Prescription Ready',
      'Your prescription is ready for pickup at the pharmacy',
      {
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/portal`,
        actionLabel: 'View Details'
      }
    );
  }

  static async notifyNewPrescription(patientId: string, doctorName: string) {
    await NotificationController.createNotification(
      patientId,
      NotificationType.PRESCRIPTION_NEW,
      'New Prescription',
      `Dr. ${doctorName} has prescribed new medication for you`,
      {
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/portal/records`,
        actionLabel: 'View Prescription'
      }
    );
  }

  // Test result notifications
  static async notifyTestResultReady(patientId: string, testName: string) {
    await NotificationController.createNotification(
      patientId,
      NotificationType.TEST_RESULT_READY,
      'Test Results Available',
      `Your ${testName} results are now available`,
      {
        priority: NotificationPriority.HIGH,
        actionUrl: `/portal/records`,
        actionLabel: 'View Results'
      }
    );
  }
}
