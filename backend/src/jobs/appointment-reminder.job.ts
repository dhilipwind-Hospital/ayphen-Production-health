import cron from 'node-cron';
import { AppDataSource } from '../config/database';
import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { EmailService } from '../services/email.service';

/**
 * Appointment Reminder Job
 * Runs daily at 9:00 AM to send reminders for appointments scheduled for tomorrow
 */
export function initializeAppointmentReminderJob() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running appointment reminder job...');
    
    try {
      const appointmentRepository = AppDataSource.getRepository(Appointment);
      
      // Calculate tomorrow's date range
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      
      // Find all appointments for tomorrow
      const appointments = await appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.patient', 'patient')
        .leftJoinAndSelect('appointment.doctor', 'doctor')
        .where('appointment.startTime >= :start', { start: tomorrow })
        .andWhere('appointment.startTime < :end', { end: dayAfterTomorrow })
        .andWhere('appointment.status IN (:...statuses)', { 
          statuses: ['confirmed', 'pending'] 
        })
        .getMany();
      
      console.log(`📧 Found ${appointments.length} appointments for tomorrow`);
      
      // Send reminder emails
      let sentCount = 0;
      let failedCount = 0;
      
      for (const appointment of appointments) {
        try {
          const patient = appointment.patient as User;
          const doctor = appointment.doctor as User;
          
          if (patient && doctor && patient.email) {
            await EmailService.sendAppointmentReminderEmail(
              patient.email,
              `${patient.firstName} ${patient.lastName}`,
              `${doctor.firstName} ${doctor.lastName}`,
              appointment.startTime.toLocaleString()
            );
            sentCount++;
            console.log(`✅ Reminder sent to ${patient.email}`);
          }
        } catch (error) {
          failedCount++;
          console.error(`❌ Failed to send reminder for appointment ${appointment.id}:`, error);
        }
      }
      
      console.log(`✅ Appointment reminder job completed: ${sentCount} sent, ${failedCount} failed`);
    } catch (error) {
      console.error('❌ Error in appointment reminder job:', error);
    }
  });
  
  console.log('✅ Appointment reminder job initialized (runs daily at 9:00 AM)');
}
