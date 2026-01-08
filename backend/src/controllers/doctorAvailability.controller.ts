import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { Appointment } from '../models/Appointment';
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
      const appointmentRepo = AppDataSource.getRepository(Appointment);

      // Get doctor's availability for the date
      const availability = await availabilityRepo.findOne({
        where: { doctorId, date: new Date(date), organizationId: tenantId }
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
            startTime: new Date(slotStart),
            organizationId: tenantId,
            status: ['confirmed', 'in_progress'] as any
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
        where: { doctorId, date: new Date(date), organizationId: tenantId }
      });

      if (!availability) {
        availability = availabilityRepo.create({
          doctorId,
          date: new Date(date),
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
          const existingAvail = await availabilityRepo.findOne({
            where: { doctorId, date: nextDate.toDate(), organizationId: tenantId }
          });

          if (!existingAvail) {
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
          }
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
          organizationId: tenantId
        },
        order: { date: 'ASC' }
      });

      // Filter for next 30 days
      const filteredSchedule = schedule.filter(s => {
        const schDate = new Date(s.date);
        return schDate >= today && schDate <= thirtyDaysLater;
      });

      return res.json({ schedule: filteredSchedule });
    } catch (error) {
      console.error('Error getting doctor schedule:', error);
      return res.status(500).json({ message: 'Failed to fetch schedule' });
    }
  };

  // Get all available doctors for a specific date (for patient booking)
  static getAvailableDoctors = async (req: Request, res: Response) => {
    try {
      const { date, departmentId } = req.query;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const availabilityRepo = AppDataSource.getRepository(DoctorAvailability);

      // Get all available slots for the date
      const availabilities = await availabilityRepo.find({
        where: {
          date: new Date(date as string),
          status: 'available',
          organizationId: tenantId
        },
        relations: ['doctor']
      });

      // Filter by department if provided
      let doctors = availabilities.map(a => a.doctor);
      if (departmentId) {
        doctors = doctors.filter(d => (d as any).departmentId === departmentId);
      }

      // Remove duplicates
      const uniqueDoctors = [...new Map(doctors.map(d => [d.id, d])).values()];

      return res.json({
        doctors: uniqueDoctors.map(d => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          specialization: (d as any).specialization
        }))
      });
    } catch (error) {
      console.error('Error getting available doctors:', error);
      return res.status(500).json({ message: 'Failed to fetch available doctors' });
    }
  };
}
