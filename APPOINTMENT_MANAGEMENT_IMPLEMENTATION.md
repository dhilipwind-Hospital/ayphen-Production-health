# Appointment Management - Complete Implementation Plan

## Overview
Implementing 5 critical appointment management features with complete backend & frontend integration.

---

## 1. DATABASE SCHEMA UPDATES

### 1.1 Extend Appointment Model

**Add to Appointment entity** (`backend/src/models/Appointment.ts`):
```typescript
@Entity('appointments')
export class Appointment {
  // Existing fields...
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  // NEW FIELDS
  @Column({
    type: 'enum',
    enum: ['in-person', 'telemedicine', 'home-visit'],
    default: 'in-person'
  })
  mode!: 'in-person' | 'telemedicine' | 'home-visit'; // ← NEW

  @Column({
    type: 'enum',
    enum: ['standard', 'emergency'],
    default: 'standard'
  })
  appointmentType!: 'standard' | 'emergency'; // ← NEW

  @Column({ nullable: true })
  telemedicineLink?: string; // ← NEW (Zoom/Google Meet link)

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  })
  status!: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';

  @Column({ nullable: true })
  cancellationReason?: string; // ← NEW

  @Column({ nullable: true })
  cancellationDate?: Date; // ← NEW

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancellationCharge?: number; // ← NEW (Cancellation fee)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 1.2 Create Doctor Availability Model

**New entity** (`backend/src/models/DoctorAvailability.ts`):
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('doctor_availability')
@Index(['doctorId', 'date', 'organizationId'])
export class DoctorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ type: 'date' })
  date!: Date; // e.g., 2025-12-01

  @Column({ type: 'time' })
  startTime!: string; // e.g., 09:00:00

  @Column({ type: 'time' })
  endTime!: string; // e.g., 17:00:00

  @Column({ type: 'int', default: 30 })
  slotDurationMinutes!: number; // Duration of each appointment slot

  @Column({ type: 'int', nullable: true })
  maxPatientsPerDay?: number; // Limit patients per day

  @Column({
    type: 'enum',
    enum: ['available', 'on-leave', 'holiday', 'blocked'],
    default: 'available'
  })
  status!: 'available' | 'on-leave' | 'holiday' | 'blocked';

  @Column({ nullable: true })
  reason?: string; // Reason for leave/holiday

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean; // Repeats every week

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 1.3 Create Appointment Feedback Model

**New entity** (`backend/src/models/AppointmentFeedback.ts`):
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Appointment } from './Appointment';
import { User } from './User';

@Entity('appointment_feedback')
export class AppointmentFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  // Ratings (1-5 stars)
  @Column({ type: 'int', default: 0 })
  doctorRating!: number; // 1-5 stars for doctor

  @Column({ type: 'int', default: 0 })
  facilityRating!: number; // 1-5 stars for facility/cleanliness

  @Column({ type: 'int', default: 0 })
  staffRating!: number; // 1-5 stars for staff behavior

  @Column({ type: 'int', default: 0 })
  overallRating!: number; // 1-5 stars overall

  // Comments
  @Column({ type: 'text', nullable: true })
  doctorComment?: string; // What patient liked/disliked about doctor

  @Column({ type: 'text', nullable: true })
  facilityComment?: string; // Feedback on facility

  @Column({ type: 'text', nullable: true })
  overallComment?: string; // General feedback

  // Recommendation
  @Column({ type: 'boolean', default: false })
  wouldRecommend!: boolean; // Would recommend this doctor?

  // Follow-up needed?
  @Column({ type: 'boolean', default: false })
  followUpNeeded!: boolean;

  @Column({ type: 'text', nullable: true })
  followUpReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

---

## 2. DOCTOR AVAILABILITY SYSTEM

### 2.1 Backend Controller

**Create** `backend/src/controllers/doctorAvailability.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { User } from '../models/User';
import dayjs from 'dayjs';

export class DoctorAvailabilityController {
  // Get available slots for a doctor on a specific date
  static getAvailableSlots = async (req: Request, res: Response) => {
    try {
      const { doctorId, date } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const availabilityRepo = AppDataSource.getRepository(DoctorAvailability);
      const appointmentRepo = AppDataSource.getRepository('Appointment');

      // Get doctor's availability for the date
      const availability = await availabilityRepo.findOne({
        where: { doctorId, date, organizationId: tenantId }
      });

      if (!availability) {
        return res.json({ slots: [] });
      }

      if (availability.status !== 'available') {
        return res.json({ slots: [] });
      }

      // Generate time slots
      const slots = [];
      const startTime = dayjs(`${date} ${availability.startTime}`, 'YYYY-MM-DD HH:mm:ss');
      const endTime = dayjs(`${date} ${availability.endTime}`, 'YYYY-MM-DD HH:mm:ss');

      let currentTime = startTime;

      while (currentTime.isBefore(endTime)) {
        const slotStart = currentTime.toISOString();
        const slotEnd = currentTime.add(availability.slotDurationMinutes, 'minutes').toISOString();

        // Check if slot is already booked
        const booked = await appointmentRepo.findOne({
          where: {
            doctorId,
            startTime: slotStart,
            organizationId: tenantId,
            status: ['confirmed', 'in-progress'] // Not cancelled
          }
        });

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: !booked,
          booked: !!booked
        });

        currentTime = currentTime.add(availability.slotDurationMinutes, 'minutes');
      }

      return res.json({ slots });
    } catch (error) {
      console.error('Error getting available slots:', error);
      return res.status(500).json({ message: 'Failed to fetch available slots' });
    }
  };

  // Set doctor availability (admin or doctor)
  static setAvailability = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const { date, startTime, endTime, slotDurationMinutes, status, reason, isRecurring } = req.body;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const availabilityRepo = AppDataSource.getRepository(DoctorAvailability);

      // Check if availability already exists
      let availability = await availabilityRepo.findOne({
        where: { doctorId, date, organizationId: tenantId }
      });

      if (!availability) {
        availability = availabilityRepo.create({
          doctorId,
          date,
          organizationId: tenantId
        });
      }

      // Update availability
      availability.startTime = startTime;
      availability.endTime = endTime;
      availability.slotDurationMinutes = slotDurationMinutes || 30;
      availability.status = status || 'available';
      availability.reason = reason;
      availability.isRecurring = isRecurring || false;

      await availabilityRepo.save(availability);

      // If recurring, create for next 12 weeks
      if (isRecurring) {
        let nextDate = dayjs(date).add(1, 'week');
        for (let i = 0; i < 12; i++) {
          const nextAvail = availabilityRepo.create({
            doctorId,
            date: nextDate.toDate(),
            startTime,
            endTime,
            slotDurationMinutes,
            status,
            reason,
            organizationId: tenantId
          });
          await availabilityRepo.save(nextAvail);
          nextDate = nextDate.add(1, 'week');
        }
      }

      return res.json({ success: true, availability });
    } catch (error) {
      console.error('Error setting availability:', error);
      return res.status(500).json({ message: 'Failed to set availability' });
    }
  };

  // Get doctor's availability schedule (next 30 days)
  static getDoctorSchedule = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const availabilityRepo = AppDataSource.getRepository(DoctorAvailability);

      const today = dayjs().toDate();
      const thirtyDaysLater = dayjs().add(30, 'days').toDate();

      const schedule = await availabilityRepo.find({
        where: {
          doctorId,
          organizationId: tenantId,
          date: Between(today, thirtyDaysLater)
        },
        order: { date: 'ASC' }
      });

      return res.json({ schedule });
    } catch (error) {
      console.error('Error getting doctor schedule:', error);
      return res.status(500).json({ message: 'Failed to fetch schedule' });
    }
  };

  // Get all available doctors for a specific date/time (for patient booking)
  static getAvailableDoctors = async (req: Request, res: Response) => {
    try {
      const { date, startTime, departmentId } = req.query;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const availabilityRepo = AppDataSource.getRepository(DoctorAvailability);
      const userRepo = AppDataSource.getRepository(User);

      // Get all available slots for the date
      const availabilities = await availabilityRepo.find({
        where: {
          date,
          status: 'available',
          organizationId: tenantId
        },
        relations: ['doctor']
      });

      // Filter by department if provided
      let doctors = availabilities.map(a => a.doctor);
      if (departmentId) {
        doctors = doctors.filter(d => d.departmentId === departmentId);
      }

      // Remove duplicates
      const uniqueDoctors = [...new Map(doctors.map(d => [d.id, d])).values()];

      return res.json({ doctors: uniqueDoctors });
    } catch (error) {
      console.error('Error getting available doctors:', error);
      return res.status(500).json({ message: 'Failed to fetch available doctors' });
    }
  };
}
```

### 2.2 Routes

**Add to** `backend/src/routes/doctor.routes.ts` (or create new):

```typescript
router.get('/availability/:doctorId/:date', authenticate, tenantContext, DoctorAvailabilityController.getAvailableSlots);
router.get('/doctors/available', authenticate, tenantContext, DoctorAvailabilityController.getAvailableDoctors);
router.post('/availability/:doctorId', authenticate, DoctorAvailabilityController.setAvailability);
router.get('/schedule/:doctorId', authenticate, tenantContext, DoctorAvailabilityController.getDoctorSchedule);
```

---

## 3. APPOINTMENT CANCELLATION & RESCHEDULING

### 3.1 Backend Controller Extension

**Update** `backend/src/controllers/appointment.controller.ts`:

```typescript
// Cancel appointment
static cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, cancellationCharge } = req.body;
    const user = (req as any).user;
    const tenantId = (req as any).tenant?.id || user?.organization_id;

    const appointmentRepo = AppDataSource.getRepository(Appointment);

    // Get appointment
    const appointment = await appointmentRepo.findOne({
      where: { id, organizationId: tenantId }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment can be cancelled
    const appointmentTime = dayjs(appointment.startTime);
    const now = dayjs();
    const hoursBefore = appointmentTime.diff(now, 'hours');

    // Patient can cancel up to 24 hours before
    // Admin can cancel anytime
    if (user.role === 'patient' && hoursBefore < 24) {
      return res.status(400).json({
        message: 'Cannot cancel appointment within 24 hours of appointment time',
        hoursRemaining: hoursBefore
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancellationDate = new Date();
    appointment.cancellationCharge = cancellationCharge || 0;

    await appointmentRepo.save(appointment);

    // Send cancellation email to patient
    const patientRepo = AppDataSource.getRepository(User);
    const patient = await patientRepo.findOne({ where: { id: appointment.patientId } });

    if (patient) {
      // Send email (implement based on your email service)
      // await EmailService.sendCancellationEmail(patient.email, appointment);
    }

    return res.json({ success: true, message: 'Appointment cancelled', appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ message: 'Failed to cancel appointment' });
  }
};

// Reschedule appointment
static rescheduleAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newStartTime, newEndTime } = req.body;
    const user = (req as any).user;
    const tenantId = (req as any).tenant?.id || user?.organization_id;

    const appointmentRepo = AppDataSource.getRepository(Appointment);

    // Get original appointment
    const appointment = await appointmentRepo.findOne({
      where: { id, organizationId: tenantId }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if patient can reschedule (24 hours before)
    const appointmentTime = dayjs(appointment.startTime);
    const now = dayjs();
    const hoursBefore = appointmentTime.diff(now, 'hours');

    if (user.role === 'patient' && hoursBefore < 24) {
      return res.status(400).json({
        message: 'Cannot reschedule appointment within 24 hours of appointment time'
      });
    }

    // Check if new slot is available
    const conflict = await appointmentRepo.findOne({
      where: {
        doctorId: appointment.doctorId,
        startTime: newStartTime,
        organizationId: tenantId,
        status: ['confirmed', 'in-progress']
      }
    });

    if (conflict) {
      return res.status(400).json({ message: 'Doctor is not available at this time' });
    }

    // Update appointment
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;

    await appointmentRepo.save(appointment);

    // Send rescheduling email
    const patientRepo = AppDataSource.getRepository(User);
    const patient = await patientRepo.findOne({ where: { id: appointment.patientId } });

    if (patient) {
      // Send email
      // await EmailService.sendRescheduleEmail(patient.email, appointment);
    }

    return res.json({ success: true, message: 'Appointment rescheduled', appointment });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return res.status(500).json({ message: 'Failed to reschedule appointment' });
  }
};
```

---

## 4. TELEMEDICINE MODE

### 4.1 Backend Integration

**Update appointment creation to support telemedicine:**

```typescript
static createAppointment = async (req: Request, res: Response) => {
  try {
    const {
      doctorId,
      patientId,
      serviceId,
      startTime,
      endTime,
      mode = 'in-person',  // NEW: 'in-person' | 'telemedicine' | 'home-visit'
      appointmentType = 'standard'  // NEW: 'standard' | 'emergency'
    } = req.body;

    const tenantId = (req as any).tenant?.id;

    const appointmentRepo = AppDataSource.getRepository(Appointment);

    // Create appointment
    const appointment = appointmentRepo.create({
      doctorId,
      patientId,
      serviceId,
      startTime,
      endTime,
      mode,  // Save mode
      appointmentType,  // Save type
      organizationId: tenantId,
      status: 'pending'
    });

    const saved = await appointmentRepo.save(appointment);

    // If telemedicine, generate meeting link
    if (mode === 'telemedicine') {
      const link = await generateTelemedicineLink(saved.id, appointmentId);
      saved.telemedicineLink = link;
      await appointmentRepo.save(saved);
    }

    return res.status(201).json({ success: true, appointment: saved });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ message: 'Failed to create appointment' });
  }
};

// Generate telemedicine link (Zoom/Google Meet)
async function generateTelemedicineLink(appointmentId: string, meetingId: string) {
  // Example using Zoom
  // In production, use Zoom SDK to create meeting
  return `https://zoom.us/wc/join/${meetingId}`;

  // Or Google Meet:
  // return `https://meet.google.com/abc-defg-hij`;
}
```

---

## 5. EMERGENCY SAME-DAY APPOINTMENTS

### 5.1 Backend Controller

```typescript
static createEmergencyAppointment = async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      doctorId,
      reason,
      priority = 'urgent'  // 'urgent' | 'critical'
    } = req.body;
    const user = (req as any).user;
    const tenantId = (req as any).tenant?.id || user?.organization_id;

    const appointmentRepo = AppDataSource.getRepository(Appointment);
    const queueRepo = AppDataSource.getRepository(QueueItem);

    // Create emergency appointment for TODAY, ASAP
    const now = dayjs();
    const startTime = now.add(30, 'minutes'); // 30 min from now
    const endTime = startTime.add(30, 'minutes');

    const appointment = appointmentRepo.create({
      doctorId,
      patientId,
      startTime: startTime.toDate(),
      endTime: endTime.toDate(),
      organizationId: tenantId,
      appointmentType: 'emergency',
      mode: 'in-person',
      status: 'confirmed',  // Auto-confirm emergency
      reason: reason
    });

    const saved = await appointmentRepo.save(appointment);

    // Add to queue with HIGH priority
    const queueItem = queueRepo.create({
      visitId: `emergency-${saved.id}`,
      appointmentId: saved.id,
      stage: 'doctor',  // Skip triage for emergency
      status: 'waiting',
      priority: priority,  // 'urgent' or 'critical'
      organizationId: tenantId,
      tokenNumber: generateTokenNumber()
    });

    await queueRepo.save(queueItem);

    // Notify doctor immediately
    // await notifyDoctor(doctorId, 'Emergency appointment', tenantId);

    return res.status(201).json({
      success: true,
      message: 'Emergency appointment created',
      appointment: saved,
      queuePosition: 1  // Emergency goes to front
    });
  } catch (error) {
    console.error('Error creating emergency appointment:', error);
    return res.status(500).json({ message: 'Failed to create emergency appointment' });
  }
};
```

---

## 6. PATIENT FEEDBACK & RATINGS

### 6.1 Backend Controller

**Create** `backend/src/controllers/appointmentFeedback.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AppointmentFeedback } from '../models/AppointmentFeedback';
import { Appointment } from '../models/Appointment';

export class AppointmentFeedbackController {
  // Submit feedback for appointment
  static submitFeedback = async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const {
        doctorRating,
        facilityRating,
        staffRating,
        overallRating,
        doctorComment,
        facilityComment,
        overallComment,
        wouldRecommend,
        followUpNeeded,
        followUpReason
      } = req.body;

      const patientId = (req as any).user?.id;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Get appointment
      const appointmentRepo = AppDataSource.getRepository(Appointment);
      const appointment = await appointmentRepo.findOne({
        where: { id: appointmentId, organizationId: tenantId }
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if appointment is completed
      if (appointment.status !== 'completed') {
        return res.status(400).json({ message: 'Can only rate completed appointments' });
      }

      // Check if feedback already exists
      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);
      let feedback = await feedbackRepo.findOne({
        where: { appointmentId, patientId, organizationId: tenantId }
      });

      if (!feedback) {
        feedback = feedbackRepo.create({
          appointmentId,
          patientId,
          doctorId: appointment.doctorId,
          organizationId: tenantId
        });
      }

      // Update feedback
      feedback.doctorRating = doctorRating || 0;
      feedback.facilityRating = facilityRating || 0;
      feedback.staffRating = staffRating || 0;
      feedback.overallRating = overallRating || 0;
      feedback.doctorComment = doctorComment;
      feedback.facilityComment = facilityComment;
      feedback.overallComment = overallComment;
      feedback.wouldRecommend = wouldRecommend || false;
      feedback.followUpNeeded = followUpNeeded || false;
      feedback.followUpReason = followUpReason;

      await feedbackRepo.save(feedback);

      return res.json({ success: true, message: 'Feedback submitted', feedback });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({ message: 'Failed to submit feedback' });
    }
  };

  // Get doctor ratings
  static getDoctorRatings = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);

      const feedbacks = await feedbackRepo.find({
        where: { doctorId, organizationId: tenantId }
      });

      // Calculate average ratings
      const avgRating = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length
        : 0;

      const avgDoctorRating = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.doctorRating, 0) / feedbacks.length
        : 0;

      const recommendCount = feedbacks.filter(f => f.wouldRecommend).length;
      const recommendPercentage = feedbacks.length > 0
        ? (recommendCount / feedbacks.length) * 100
        : 0;

      return res.json({
        doctorId,
        totalFeedbacks: feedbacks.length,
        averageRating: parseFloat(avgRating.toFixed(2)),
        averageDoctorRating: parseFloat(avgDoctorRating.toFixed(2)),
        wouldRecommendPercentage: parseFloat(recommendPercentage.toFixed(2)),
        recentFeedbacks: feedbacks.slice(-5).reverse()  // Last 5 feedbacks
      });
    } catch (error) {
      console.error('Error getting doctor ratings:', error);
      return res.status(500).json({ message: 'Failed to fetch ratings' });
    }
  };

  // Get appointment feedback
  static getAppointmentFeedback = async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);

      const feedback = await feedbackRepo.findOne({
        where: { appointmentId, organizationId: tenantId }
      });

      if (!feedback) {
        return res.status(404).json({ message: 'No feedback found for this appointment' });
      }

      return res.json({ feedback });
    } catch (error) {
      console.error('Error getting feedback:', error);
      return res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  };

  // Get all doctor feedbacks with statistics
  static getDoctorFeedbackStatistics = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(AppointmentFeedback);

      const feedbacks = await feedbackRepo.find({
        where: { doctorId, organizationId: tenantId },
        order: { createdAt: 'DESC' }
      });

      // Calculate statistics
      const stats = {
        totalFeedbacks: feedbacks.length,
        averageRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        ratingBreakdown: {
          fiveStar: feedbacks.filter(f => f.overallRating === 5).length,
          fourStar: feedbacks.filter(f => f.overallRating === 4).length,
          threeStar: feedbacks.filter(f => f.overallRating === 3).length,
          twoStar: feedbacks.filter(f => f.overallRating === 2).length,
          oneStar: feedbacks.filter(f => f.overallRating === 1).length
        },
        wouldRecommendPercentage: feedbacks.length > 0
          ? parseFloat(((feedbacks.filter(f => f.wouldRecommend).length / feedbacks.length) * 100).toFixed(2))
          : 0,
        followUpNeededCount: feedbacks.filter(f => f.followUpNeeded).length,
        averageDoctorRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.doctorRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        averageFacilityRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.facilityRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        averageStaffRating: feedbacks.length > 0
          ? parseFloat((feedbacks.reduce((sum, f) => sum + f.staffRating, 0) / feedbacks.length).toFixed(2))
          : 0,
        recentFeedbacks: feedbacks.slice(0, 10)  // Last 10
      };

      return res.json(stats);
    } catch (error) {
      console.error('Error getting feedback statistics:', error);
      return res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  };
}
```

### 6.2 Routes

```typescript
router.post('/feedback/:appointmentId', authenticate, tenantContext, AppointmentFeedbackController.submitFeedback);
router.get('/feedback/:appointmentId', authenticate, tenantContext, AppointmentFeedbackController.getAppointmentFeedback);
router.get('/doctor/:doctorId/ratings', authenticate, tenantContext, AppointmentFeedbackController.getDoctorRatings);
router.get('/doctor/:doctorId/feedback-statistics', authenticate, tenantContext, AppointmentFeedbackController.getDoctorFeedbackStatistics);
```

---

## 7. FRONTEND IMPLEMENTATION SUMMARY

### Key Frontend Pages/Components

1. **Doctor Availability Setup** (`/doctor/availability-setup`)
   - Calendar view
   - Set working hours
   - Mark leaves/holidays
   - Set recurring availability

2. **Enhanced Appointment Booking** (`/appointments/new`)
   - Show available doctors by date
   - Show available slots
   - Select telemedicine or in-person
   - Emergency appointment option

3. **My Appointments** (`/appointments`)
   - Cancel/reschedule buttons
   - Show appointment mode (in-person/telemedicine)
   - Display telemedicine link for virtual appointments
   - Feedback button for completed appointments

4. **Appointment Feedback** (`/appointments/:id/feedback`)
   - 5-star rating system
   - Comment fields
   - Recommendation checkbox
   - Follow-up flag

5. **Doctor Profile** (`/doctor/:id`)
   - Display average rating
   - Show number of ratings
   - Show recommend percentage
   - Display recent feedback

---

## 8. MIGRATION SCRIPT

**Create migration** to add new columns:

```sql
-- Add new columns to appointments table
ALTER TABLE appointments ADD COLUMN mode VARCHAR(20) DEFAULT 'in-person';
ALTER TABLE appointments ADD COLUMN appointmentType VARCHAR(20) DEFAULT 'standard';
ALTER TABLE appointments ADD COLUMN telemedicineLink VARCHAR(255);
ALTER TABLE appointments ADD COLUMN cancellationReason TEXT;
ALTER TABLE appointments ADD COLUMN cancellationDate TIMESTAMP;
ALTER TABLE appointments ADD COLUMN cancellationCharge DECIMAL(10,2);

-- Add new status options
ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show');

-- Create doctor_availability table
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  slotDurationMinutes INT DEFAULT 30,
  maxPatientsPerDay INT,
  status VARCHAR(20) DEFAULT 'available',
  reason TEXT,
  isRecurring BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(doctor_id, date, organization_id),
  INDEX(organization_id, doctor_id, date)
);

-- Create appointment_feedback table
CREATE TABLE appointment_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  patient_id UUID NOT NULL REFERENCES users(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  doctorRating INT DEFAULT 0,
  facilityRating INT DEFAULT 0,
  staffRating INT DEFAULT 0,
  overallRating INT DEFAULT 0,
  doctorComment TEXT,
  facilityComment TEXT,
  overallComment TEXT,
  wouldRecommend BOOLEAN DEFAULT FALSE,
  followUpNeeded BOOLEAN DEFAULT FALSE,
  followUpReason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(appointment_id, patient_id),
  INDEX(doctor_id, organization_id)
);
```

---

## 9. API ENDPOINTS SUMMARY

### Doctor Availability
```
GET  /api/doctors/availability/:doctorId/:date      - Get available slots
GET  /api/doctors/available?date=&departmentId=     - Get available doctors
POST /api/doctors/availability/:doctorId             - Set availability
GET  /api/doctors/schedule/:doctorId                 - Get doctor schedule
```

### Appointment Management
```
POST   /api/appointments                              - Create appointment
GET    /api/appointments                              - List appointments
GET    /api/appointments/:id                          - Get appointment details
PATCH  /api/appointments/:id/cancel                   - Cancel appointment
PATCH  /api/appointments/:id/reschedule               - Reschedule appointment
POST   /api/appointments/emergency                    - Create emergency appointment
PATCH  /api/appointments/:id/complete                 - Mark as completed
```

### Feedback
```
POST /api/appointments/:appointmentId/feedback       - Submit feedback
GET  /api/appointments/:appointmentId/feedback       - Get feedback
GET  /api/doctors/:doctorId/ratings                  - Get doctor ratings
GET  /api/doctors/:doctorId/feedback-statistics      - Get detailed statistics
```

---

## 10. IMPLEMENTATION TIMELINE

| Phase | Features | Duration |
|-------|----------|----------|
| **Phase 1** | Doctor availability + appointment cancellation/reschedule | 5 days |
| **Phase 2** | Telemedicine mode + emergency appointments | 4 days |
| **Phase 3** | Patient feedback & ratings system | 3 days |
| **Phase 4** | Frontend UI & integration | 5 days |
| **Phase 5** | Testing & deployment | 3 days |

**Total: ~3 weeks**

---

## 11. TESTING CHECKLIST

- [ ] Doctor can set availability
- [ ] Patient can see available slots
- [ ] Patient can book appointment
- [ ] Patient can cancel within 24 hours
- [ ] Patient cannot cancel within 24 hours
- [ ] Patient can reschedule within 24 hours
- [ ] Admin can cancel/reschedule anytime
- [ ] Telemedicine link generated and sent
- [ ] Emergency appointment bypasses normal booking
- [ ] Emergency appointment marked as high priority
- [ ] Patient can submit feedback for completed appointments
- [ ] Doctor ratings calculated correctly
- [ ] Recommendation percentage calculated correctly
- [ ] Follow-up alerts generated correctly
