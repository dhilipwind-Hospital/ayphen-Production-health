import { Request, Response } from 'express';
import { Between, MoreThanOrEqual, LessThanOrEqual, In, Not } from 'typeorm';
import { AvailabilitySlot, DayOfWeek } from '../models/AvailabilitySlot';
import { AppDataSource } from '../config/database';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Service } from '../models/Service';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/create-appointment.dto';
import { NotFoundException, BadRequestException, ConflictException } from '../exceptions/http.exception';
import { AppointmentHistory } from '../models/AppointmentHistory';
import { createTenantRepository } from '../repositories/TenantRepository';

interface PaginationOptions {
  page: number;
  limit: number;
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Utility: append appointment history entries
const addHistory = async (
  appointmentId: string,
  action: 'created' | 'rescheduled' | 'cancelled' | 'confirmed' | 'notes_updated' | 'service_assigned' | 'follow_up_created',
  details?: string,
  changedBy?: string
) => {
  try {
    const repo = AppDataSource.getRepository(AppointmentHistory);
    const h = repo.create({ appointmentId, action, details, changedBy });
    await repo.save(h);
  } catch {
    // best-effort; ignore history failures
  }
};

export class AppointmentController {
  // Doctor: list my appointments
  static listDoctorAppointments = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const {
      status,
      startDate,
      endDate,
      page = '1',
      limit = '10',
      search = ''
    } = req.query as any;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const repo = AppDataSource.getRepository(Appointment);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
    const qb = repo.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('doctor.id = :userId', { userId })
      .orderBy('appointment.startTime', 'DESC')
      .skip(skip)
      .take(limitNum);

    // CRITICAL: Filter by organization_id for multi-tenancy isolation
    if (tenantId) {
      qb.andWhere('appointment.organization_id = :tenantId', { tenantId });
    }

    if (status) qb.andWhere('appointment.status = :status', { status });
    if (startDate && endDate) {
      qb.andWhere('appointment.startTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });
    }
    if (search) {
      qb.andWhere('(service.name ILIKE :search OR patient.firstName ILIKE :search OR patient.lastName ILIKE :search)', {
        search: `%${String(search)}%`
      });
    }

    try {
      const [items, total] = await qb.getManyAndCount();
      return res.json({
        data: items,
        meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
      });
    } catch (e) {
      console.error('Doctor list appointments error:', e);
      return res.status(500).json({ message: 'Error fetching appointments' });
    }
  };

  // Doctor: update notes for my appointment
  static doctorUpdateNotes = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { notes } = req.body || {};
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      const repo = AppDataSource.getRepository(Appointment);
      // CRITICAL: Prioritize authenticated user's organization over tenant context
      const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
      const appt = await repo.createQueryBuilder('a')
        .leftJoinAndSelect('a.doctor', 'doctor')
        .where('a.id = :id', { id })
        .andWhere('doctor.id = :userId', { userId })
        .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .getOne();
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });
      (appt as any).notes = notes ?? '';
      await repo.save(appt);
      return res.json({ id: appt.id, notes: (appt as any).notes });
    } catch (e) {
      console.error('Doctor update notes error:', e);
      return res.status(500).json({ message: 'Failed to update notes' });
    }
  };

  // Doctor: create an appointment for a patient (follow-up)
  static doctorCreateAppointment = async (req: Request, res: Response) => {
    const doctorId = (req as any).user?.id;
    const { patientId, serviceId, startTime, endTime, notes, reason } = req.body || {};
    if (!doctorId) return res.status(401).json({ message: 'Authentication required' });
    if (!patientId || !serviceId || !startTime) {
      return res.status(400).json({ message: 'patientId, serviceId and startTime are required' });
    }
    try {
      const apptRepo = AppDataSource.getRepository(Appointment);
      const userRepo = AppDataSource.getRepository(User);
      const svcRepo = AppDataSource.getRepository(Service);
      // CRITICAL: Prioritize authenticated user's organization over tenant context
      const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;

      const patient = await userRepo.findOne({ where: { id: patientId, organizationId: tenantId } as any });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const service = await svcRepo.findOne({ where: { id: serviceId, organizationId: tenantId } as any });
      if (!service) return res.status(404).json({ message: 'Service not found' });
      const doctor = await userRepo.findOne({ where: { id: doctorId, organizationId: tenantId } as any });
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

      // Enforce: follow-ups must be within the doctor's own department
      if (((service as any).departmentId || (service as any)?.department?.id) !== (doctor as any).departmentId) {
        return res.status(403).json({
          message: 'Follow-ups must be booked within your department. To schedule in another department, create a referral and have that department book the appointment.'
        });
      }

      const start = new Date(startTime);
      const durationMin = (service as any)?.averageDuration ?? 30;
      const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMin * 60000);

      // Overlap checks (doctor and patient) for PENDING/CONFIRMED
      const statuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
      const doctorConflict = await apptRepo.createQueryBuilder('a')
        .leftJoin('a.doctor', 'doctor')
        .where('doctor.id = :doctorId', { doctorId })
        .andWhere('a.status IN (:...statuses)', { statuses })
        .andWhere('a.startTime < :end AND a.endTime > :start', { start, end })
        .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .getOne();
      if (doctorConflict) {
        return res.status(409).json({ message: 'Doctor is not available at the selected time', conflictingAppointment: doctorConflict.id });
      }
      const patientConflict = await apptRepo.createQueryBuilder('a')
        .leftJoin('a.patient', 'patient')
        .where('patient.id = :patientId', { patientId })
        .andWhere('a.status IN (:...statuses)', { statuses })
        .andWhere('a.startTime < :end AND a.endTime > :start', { start, end })
        .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .getOne();
      if (patientConflict) {
        return res.status(409).json({ message: 'Patient already has an appointment at the selected time', conflictingAppointment: patientConflict.id });
      }

      const appointment = new Appointment();
      (appointment as any).patient = patient;
      (appointment as any).doctor = doctor;
      (appointment as any).service = service as any;
      (appointment as any).startTime = start;
      (appointment as any).endTime = end;
      (appointment as any).status = AppointmentStatus.PENDING;
      (appointment as any).notes = notes;
      (appointment as any).reason = reason;
      if (tenantId) (appointment as any).organizationId = tenantId;

      const saved = await apptRepo.save(appointment);
      const withRels = await apptRepo.findOne({ where: { id: saved.id }, relations: ['patient','doctor','service'] });
      await addHistory(saved.id, 'follow_up_created', `Doctor ${doctorId} created follow-up for patient ${patientId}` , String(doctorId));
      return res.status(201).json(withRels);
    } catch (e) {
      console.error('Doctor create appointment error:', e);
      return res.status(500).json({ message: 'Failed to create appointment' });
    }
  };
  // Admin: get appointment by ID (no patient ownership restriction)
  static adminGetAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const appointmentRepository = AppDataSource.getRepository(Appointment);
    try {
      // CRITICAL: Prioritize authenticated user's organization over tenant context
      const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
      const appt = await appointmentRepository.findOne({ where: { id, organizationId: tenantId } as any, relations: ['service', 'doctor', 'patient'] });
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });
      return res.json(appt);
    } catch (e) {
      console.error('Admin get appointment error:', e);
      return res.status(500).json({ message: 'Error fetching appointment' });
    }
  };

  // Admin: cancel appointment by ID
  static adminCancelAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const appointmentRepository = AppDataSource.getRepository(Appointment);
    try {
      // CRITICAL: Prioritize authenticated user's organization over tenant context
      const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
      const appt = await appointmentRepository.findOne({ where: { id, organizationId: tenantId } as any });
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });
      appt.status = AppointmentStatus.CANCELLED;
      await appointmentRepository.save(appt);
      return res.json({ message: 'Appointment cancelled successfully' });
    } catch (e) {
      console.error('Admin cancel appointment error:', e);
      return res.status(500).json({ message: 'Error cancelling appointment' });
    }
  };

  // Admin: confirm appointment by ID
  static adminConfirmAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const apptRepo = AppDataSource.getRepository(Appointment);
    try {
      // CRITICAL: Prioritize authenticated user's organization over tenant context
      const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
      const appt = await apptRepo.findOne({ where: { id, organizationId: tenantId } as any, relations: ['service','doctor','patient'] });
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });
      if (!appt.doctor) return res.status(400).json({ message: 'Cannot confirm without an assigned doctor' });
      if (!appt.service) return res.status(400).json({ message: 'Appointment has no service assigned' });

      if (appt.status === AppointmentStatus.CANCELLED) {
        return res.status(400).json({ message: 'Cannot confirm a cancelled appointment' });
      }

      // Overlap checks (excluding this appointment)
      const statuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
      const conflictForDoctor = await apptRepo.createQueryBuilder('a')
        .leftJoin('a.doctor','doctor')
        .where('doctor.id = :doctorId', { doctorId: (appt as any).doctor.id })
        .andWhere('a.id != :id', { id })
        .andWhere('a.status IN (:...statuses)', { statuses })
        .andWhere('a.startTime < :end AND a.endTime > :start', { start: appt.startTime, end: appt.endTime })
        .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .getOne();
      if (conflictForDoctor) {
        return res.status(409).json({ message: 'Doctor is not available at the selected time', conflictingAppointment: conflictForDoctor.id });
      }
      const conflictForPatient = await apptRepo.createQueryBuilder('a')
        .leftJoin('a.patient','patient')
        .where('patient.id = :patientId', { patientId: (appt as any).patient.id })
        .andWhere('a.id != :id', { id })
        .andWhere('a.status IN (:...statuses)', { statuses })
        .andWhere('a.startTime < :end AND a.endTime > :start', { start: appt.startTime, end: appt.endTime })
        .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .getOne();
      if (conflictForPatient) {
        return res.status(409).json({ message: 'Patient already has an appointment at the selected time', conflictingAppointment: conflictForPatient.id });
      }

      appt.status = AppointmentStatus.CONFIRMED;
      await apptRepo.save(appt);
      const withRels = await apptRepo.findOne({ where: { id: appt.id }, relations: ['patient','doctor','service'] });
      await addHistory(appt.id, 'confirmed', `Appointment confirmed by admin`, undefined);
      return res.json(withRels);
    } catch (e) {
      console.error('Admin confirm appointment error:', e);
      return res.status(500).json({ message: 'Error confirming appointment' });
    }
  };
  // Admin: list all appointments with filters
  static listAllAppointments = async (req: Request, res: Response) => {
    const {
      status,
      startDate,
      endDate,
      page = '1',
      limit = '10',
      search = '',
      departmentId,
      serviceId,
      doctorId,
      patientId,
    } = req.query as any;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const appointmentRepository = AppDataSource.getRepository(Appointment);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
    const qb = appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('service.department', 'department')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .orderBy('appointment.startTime', 'DESC')
      .skip(skip)
      .take(limitNum);

    if (tenantId) {
      qb.andWhere('appointment.organization_id = :tenantId', { tenantId });
    } else {
      // If no tenant context, return empty result to prevent data leakage
      return res.json({ data: [], meta: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 } });
    }

    if (status) qb.andWhere('appointment.status = :status', { status });
    if (startDate && endDate) {
      qb.andWhere('appointment.startTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });
    }
    if (serviceId) qb.andWhere('service.id = :serviceId', { serviceId });
    if (doctorId) qb.andWhere('doctor.id = :doctorId', { doctorId });
    if (patientId) qb.andWhere('patient.id = :patientId', { patientId });
    if (departmentId) qb.andWhere('department.id = :departmentId', { departmentId });
    if (search) {
      qb.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search OR doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search OR patient.firstName ILIKE :search OR patient.lastName ILIKE :search)',
        { search: `%${String(search)}%` }
      );
    }

    try {
      const [items, total] = await qb.getManyAndCount();
      return res.json({
        data: items,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (e) {
      console.error('Error fetching all appointments (admin):', e);
      return res.status(500).json({ message: 'Error fetching appointments' });
    }
  };
  // Book a new appointment
  static bookAppointment = async (req: Request, res: Response) => {
    const createAppointmentDto: CreateAppointmentDto = req.body;
    const { serviceId, doctorId, startTime, endTime, notes, reason, preferences } = createAppointmentDto as any;
    const userId = (req as any).user?.id; // Assuming user is authenticated

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const appointmentRepository = AppDataSource.getRepository(Appointment);
    const userRepository = AppDataSource.getRepository(User);
    const serviceRepository = AppDataSource.getRepository(Service);
    const slotRepository = AppDataSource.getRepository(AvailabilitySlot);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;

    try {
      // Validate service exists (get department for auto-assign)
      const service = await serviceRepository.findOne({ where: { id: serviceId as any, organizationId: tenantId } as any, relations: ['department'] });
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Validate or auto-assign doctor
      let doctor: User | undefined;
      if (doctorId) {
        doctor = await userRepository.findOne({ where: { id: doctorId as any, role: UserRole.DOCTOR, organizationId: tenantId } as any }) as User | undefined;
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        // Department consistency enforcement for manual selection
        const serviceDeptId = (service as any)?.department?.id;
        const doctorDeptId = (doctor as any)?.departmentId;
        if (serviceDeptId && doctorDeptId && String(serviceDeptId) !== String(doctorDeptId)) {
          return res.status(400).json({ message: 'Selected doctor must belong to the same department as the chosen service' });
        }
      } else {
        // Auto-assign path: find candidates in the service's department, apply preferences
        const deptId = (service as any)?.department?.id;
        const allDoctors = await userRepository.createQueryBuilder('u')
          .leftJoinAndSelect('u.department', 'department')
          .where('u.role = :role', { role: UserRole.DOCTOR })
          .andWhere(tenantId ? 'u.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .andWhere('u.isActive = true')
          .getMany();

        // filter by department first; if none match, fall back to all doctors
        let candidates = (deptId ? allDoctors.filter(d => (d as any).departmentId === deptId) : allDoctors);
        if (candidates.length === 0) candidates = allDoctors;

        // seniority preference (stored under preferences.seniority)
        const prefSeniority = preferences?.doctorPreference?.seniority as string | undefined;
        const urgency = (preferences?.urgency as string | undefined) || 'routine';
        const seniorRanks = ['chief','senior'];
        const getSeniority = (d: any) => String(d?.preferences?.seniority || '').toLowerCase();

        const applySeniority = (list: User[], want: string[] | undefined): User[] => {
          if (!want || want.length === 0) return list;
          const filtered = list.filter(d => want.includes(getSeniority(d)));
          return filtered.length ? filtered : list; // fallback to original if none
        };

        if (prefSeniority && prefSeniority !== 'any') {
          candidates = applySeniority(candidates, [prefSeniority]);
        } else if (urgency === 'urgent') {
          candidates = applySeniority(candidates, seniorRanks);
        }

        // Prefer doctors with availability covering the requested time
        const requestDate = new Date(startTime);
        const hh = String(requestDate.getHours()).padStart(2,'0');
        const mm = String(requestDate.getMinutes()).padStart(2,'0');
        const timeHM = `${hh}:${mm}`;
        const dowMap: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
        const reqDay = dowMap[requestDate.getDay()];

        const availableCandidates: User[] = [];
        for (const d of candidates) {
          const slot = await slotRepository.createQueryBuilder('s')
            .leftJoin('s.doctor','doc')
            .where('doc.id = :id', { id: (d as any).id })
            .andWhere('s.dayOfWeek = :dow', { dow: reqDay })
            .andWhere('s.isActive = true')
            .andWhere('s.startTime <= :t AND s.endTime >= :t', { t: timeHM })
            .getOne();
          if (slot) availableCandidates.push(d);
        }
        if (availableCandidates.length) candidates = availableCandidates;

        // Check conflicts and pick least loaded
        const start = new Date(startTime);
        const end = new Date(endTime);
        const statuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

        const scored: Array<{ d: User; conflicts: number }> = [];
        for (const d of candidates) {
          const count = await appointmentRepository.createQueryBuilder('a')
            .leftJoin('a.doctor', 'doctor')
            .where('doctor.id = :doctorId', { doctorId: (d as any).id })
            .andWhere('a.status IN (:...statuses)', { statuses })
            .andWhere('a.startTime < :end AND a.endTime > :start', { start, end })
            .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
            .getCount();
          scored.push({ d, conflicts: count });
        }
        // pick conflict-free with least conflicts; if all conflict, leave undefined (pending)
        const free = scored.filter(s => s.conflicts === 0).sort((a, b) => {
          // tie-breaker by seniority ranking then createdAt
          const rankOrder = (x: User) => {
            const s = getSeniority(x);
            return s === 'chief' ? 1 : s === 'senior' ? 2 : s === 'consultant' ? 3 : 4;
          };
          return rankOrder(a.d) - rankOrder(b.d);
        });
        if (free.length) doctor = free[0].d;
        // If still none, compute suggested nearest availability across candidates
        var suggestion: { doctorId: string; startTime: string; endTime: string } | undefined;
        if (!doctor && candidates.length) {
          const allSlots = await slotRepository.createQueryBuilder('s')
            .leftJoinAndSelect('s.doctor','doc')
            .where('doc.id IN (:...ids)', { ids: candidates.map((c: any) => c.id) })
            .andWhere('s.isActive = true')
            .getMany();
          // compute next occurrence within next 14 days
          const ref = new Date(startTime);
          const options: Array<{ d: User; start: Date; end: Date }> = [];
          const slotToNextDate = (refDate: Date, slot: AvailabilitySlot) => {
            const dayIndex = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY].indexOf(slot.dayOfWeek);
            const refDOW = refDate.getDay();
            let addDays = (dayIndex - refDOW + 7) % 7;
            let base = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
            base.setDate(base.getDate() + addDays);
            const [sh, sm] = String(slot.startTime).split(':').map(n=>parseInt(n,10));
            const [eh, em] = String(slot.endTime).split(':').map(n=>parseInt(n,10));
            const sdt = new Date(base);
            sdt.setHours(sh, sm||0, 0, 0);
            const edt = new Date(base);
            edt.setHours(eh, em||0, 0, 0);
            if (sdt < refDate) {
              // move to next week
              sdt.setDate(sdt.getDate() + 7);
              edt.setDate(edt.getDate() + 7);
            }
            return { start: sdt, end: edt };
          };
          for (const s of allSlots) {
            const { start: sdt, end: edt } = slotToNextDate(ref, s);
            // check conflicts for that doctor
            const overlaps = await appointmentRepository.createQueryBuilder('a')
              .leftJoin('a.doctor','doc')
              .where('doc.id = :id', { id: (s as any).doctor.id })
              .andWhere('a.status IN (:...statuses)', { statuses })
              .andWhere('a.startTime < :end AND a.endTime > :start', { start: sdt, end: edt })
              .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
              .getCount();
            if (overlaps === 0) {
              const cand = candidates.find((c: any) => c.id === (s as any).doctor.id);
              if (cand) options.push({ d: cand, start: sdt, end: edt });
            }
          }
          options.sort((a,b) => a.start.getTime() - b.start.getTime());
          if (options.length) {
            suggestion = { doctorId: (options[0].d as any).id, startTime: options[0].start.toISOString(), endTime: options[0].end.toISOString() };
          }
        }
      }

      // Get patient - user is already authenticated, just verify they exist
      const patient = await userRepository.findOne({ where: { id: userId as any } as any });
      if (!patient) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Ensure patient has organization context for multi-tenancy
      if (!patient.organizationId && tenantId) {
        patient.organizationId = tenantId;
        // Persist the organization context for the patient
        await userRepository.save(patient);
      }

      // Check for time slot availability
      const existingAppointment = await appointmentRepository.findOne({
        where: [
          // Check for doctor's availability if doctor is specified or auto-assigned
          doctor ? {
            doctor: { id: (doctor as any).id },
            startTime: LessThanOrEqual(new Date(endTime)),
            endTime: MoreThanOrEqual(new Date(startTime)),
            status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            organizationId: tenantId
          } as any : undefined,
          // Also check for patient's availability
          {
            patient: { id: userId },
            startTime: LessThanOrEqual(new Date(endTime)),
            endTime: MoreThanOrEqual(new Date(startTime)),
            status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            organizationId: tenantId
          },
        ].filter(Boolean) as any,
      });

      if (existingAppointment) {
        return res.status(409).json({
          message: 'Time slot is not available',
          conflictingAppointment: existingAppointment.id,
        });
      }

      // Create new appointment
      const appointment = new Appointment();
      appointment.patient = patient;
      appointment.service = service;
      appointment.doctor = doctor;
      appointment.startTime = new Date(startTime);
      appointment.endTime = new Date(endTime);
      appointment.status = doctor && !existingAppointment ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING;
      appointment.notes = notes;
      appointment.reason = reason;
      if (tenantId) (appointment as any).organizationId = tenantId;

      await appointmentRepository.save(appointment);

      // Send appointment confirmation email
      try {
        const patient = await userRepository.findOne({ where: { id: userId } });
        if (patient && doctor) {
          const { EmailService } = await import('../services/email.service');
          EmailService.sendAppointmentConfirmationEmail(
            patient.email,
            `${patient.firstName} ${patient.lastName}`,
            `${doctor.firstName} ${doctor.lastName}`,
            new Date(startTime).toLocaleString(),
            service.department?.name || 'General'
          ).catch(err => console.error('Failed to send appointment confirmation email:', err));
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
      }

      // Return the created appointment with related data
      const savedAppointment = await appointmentRepository.findOne({
        where: { id: appointment.id },
        relations: ['patient', 'doctor', 'service'],
      });
      const response: any = savedAppointment;
      // If pending and we computed a suggestion, attach it to help frontend offer alternate time
      if (response?.status === AppointmentStatus.PENDING && typeof suggestion !== 'undefined') {
        response.suggestion = suggestion;
      }
      await addHistory(appointment.id, 'created', `Booked service ${service.id} from ${new Date(startTime).toISOString()} to ${new Date(endTime).toISOString()}`, String(userId));
      return res.status(201).json(response);
    } catch (error) {
      console.error('Error creating appointment:', error);
      return res.status(500).json({ message: 'Error creating appointment' });
    }
  };

  // List user's appointments with pagination
  static listUserAppointments = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { 
      status, 
      startDate, 
      endDate, 
      page = '1', 
      limit = '10',
      search = ''
    } = req.query;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const appointmentRepository = AppDataSource.getRepository(Appointment);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
    const queryBuilder = appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('appointment.patient_id = :userId', { userId })
      .andWhere(tenantId ? 'appointment.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
      .orderBy('appointment.startTime', 'DESC')
      .skip(skip)
      .take(limitNum);

    // Apply filters
    if (status) {
      queryBuilder.andWhere('appointment.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'appointment.startTime BETWEEN :startDate AND :endDate',
        { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
      );
    }

    if (search) {
      queryBuilder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search OR doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    try {
      const [appointments, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limitNum);

      return res.json({
        data: appointments,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw new Error('Error fetching appointments');
    }
  };

  // Get appointment details
  static getAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const appointmentRepository = AppDataSource.getRepository(Appointment);

    try {
      // Fetch appointment with relations
      // CRITICAL: Prioritize authenticated user's organization over tenant context
      const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
      const appointment = await appointmentRepository.findOne({
        where: { id, organizationId: tenantId } as any,
        relations: ['service', 'doctor', 'patient'],
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check authorization: patient can see their own, doctor can see their assigned, admin can see all
      const isPatient = (appointment as any).patient?.id === userId;
      const isDoctor = (appointment as any).doctor?.id === userId;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to view this appointment' });
      }

      return res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return res.status(500).json({ message: 'Error fetching appointment' });
    }
  };

  // Update an appointment (patient-owned)
  static updateAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    const { startTime, endTime, notes, reason, doctorId } = req.body || {};
    const apptRepo = AppDataSource.getRepository(Appointment);
    const userRepo = AppDataSource.getRepository(User);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organization_id || (req as any).tenant?.id;
    try {
      const appt = await apptRepo.findOne({ where: { id, organizationId: tenantId } as any, relations: ['patient','doctor','service'] });
      if (!appt || (appt as any).patient?.id !== userId) return res.status(404).json({ message: 'Appointment not found' });

      // Optional: change doctor if provided
      if (doctorId) {
        const doc = await userRepo.findOne({ where: { id: doctorId } });
        if (!doc) return res.status(404).json({ message: 'Doctor not found' });
        (appt as any).doctor = doc as any;
      }
      // Update times if provided and check conflicts
      const oldStart = appt.startTime;
      const oldEnd = appt.endTime;
      const oldNotes = (appt as any).notes || '';
      const newStart = startTime ? new Date(startTime) : appt.startTime;
      const newEnd = endTime ? new Date(endTime) : appt.endTime;

      const statuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
      // Doctor conflicts
      if ((appt as any).doctor?.id) {
        const dConflict = await apptRepo.createQueryBuilder('a')
          .leftJoin('a.doctor','doctor')
          .where('doctor.id = :doctorId', { doctorId: (appt as any).doctor.id })
          .andWhere('a.id != :id', { id })
          .andWhere('a.status IN (:...statuses)', { statuses })
          .andWhere('a.startTime < :end AND a.endTime > :start', { start: newStart, end: newEnd })
          .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .getOne();
        if (dConflict) return res.status(409).json({ message: 'Doctor is not available at the selected time', conflictingAppointment: dConflict.id });
      }
      // Patient conflicts
      const pConflict = await apptRepo.createQueryBuilder('a')
        .leftJoin('a.patient','patient')
        .where('patient.id = :patientId', { patientId: userId })
        .andWhere('a.id != :id', { id })
        .andWhere('a.status IN (:...statuses)', { statuses })
        .andWhere('a.startTime < :end AND a.endTime > :start', { start: newStart, end: newEnd })
        .andWhere(tenantId ? 'a.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .getOne();
      if (pConflict) return res.status(409).json({ message: 'Time slot is not available', conflictingAppointment: pConflict.id });

      appt.startTime = newStart;
      appt.endTime = newEnd;
      if (typeof notes !== 'undefined') (appt as any).notes = notes;
      if (typeof reason !== 'undefined') (appt as any).reason = reason;
      await apptRepo.save(appt);
      const withRels = await apptRepo.findOne({ where: { id }, relations: ['patient','doctor','service'] });
      // History
      if (oldStart.getTime() !== newStart.getTime() || oldEnd.getTime() !== newEnd.getTime()) {
        await addHistory(id, 'rescheduled', `From ${oldStart.toISOString()}-${oldEnd.toISOString()} to ${newStart.toISOString()}-${newEnd.toISOString()}`, String(userId));
      }
      if (((appt as any).notes || '') !== oldNotes) {
        await addHistory(id, 'notes_updated', `Notes updated`, String(userId));
      }
      return res.json(withRels);
    } catch (e) {
      console.error('Update appointment error:', e);
      return res.status(500).json({ message: 'Error updating appointment' });
    }
  };

  // Cancel an appointment (patient-owned)
  static cancelAppointment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    const apptRepo = AppDataSource.getRepository(Appointment);
    try {
      const appt = await apptRepo.findOne({ where: { id }, relations: ['patient'] });
      if (!appt || (appt as any).patient?.id !== userId) return res.status(404).json({ message: 'Appointment not found' });
      appt.status = AppointmentStatus.CANCELLED;
      await apptRepo.save(appt);
      await addHistory(id, 'cancelled', 'Cancelled by patient', String(userId));
      return res.status(204).send();
    } catch (e) {
      console.error('Cancel appointment error:', e);
      return res.status(500).json({ message: 'Error cancelling appointment' });
    }
  };

  // Cancel with reason (stores into notes and logs history)
  static cancelAppointmentWithReason = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { reason } = req.body || {};
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    const apptRepo = AppDataSource.getRepository(Appointment);
    try {
      const appt = await apptRepo.findOne({ where: { id }, relations: ['patient'] });
      if (!appt || (appt as any).patient?.id !== userId) return res.status(404).json({ message: 'Appointment not found' });
      appt.status = AppointmentStatus.CANCELLED;
      (appt as any).cancellationReason = reason;
      (appt as any).cancelledAt = new Date();
      (appt as any).cancelledBy = { id: userId };
      const stamp = new Date().toISOString();
      const prefix = (appt as any).notes ? (appt as any).notes + '\n' : '';
      (appt as any).notes = `${prefix}Cancel reason (${stamp}): ${String(reason || '').trim() || 'N/A'}`;
      await apptRepo.save(appt);
      await addHistory(id, 'cancelled', `Reason: ${String(reason || '').trim() || 'N/A'}`, String(userId));
      return res.status(204).send();
    } catch (e) {
      console.error('Cancel appointment (with reason) error:', e);
      return res.status(500).json({ message: 'Error cancelling appointment' });
    }
  };

  // Reschedule appointment
  static rescheduleAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startTime, endTime, reason } = req.body;
      const userId = (req as any).user?.id;

      if (!startTime || !endTime) {
        return res.status(400).json({ message: 'startTime and endTime are required' });
      }

      const repo = AppDataSource.getRepository(Appointment);
      const appointment = await repo.findOne({
        where: { id },
        relations: ['patient', 'doctor', 'service']
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check permission
      const userRole = (req as any).user?.role;
      const isPatient = appointment.patient.id === userId;
      const isDoctor = appointment.doctor?.id === userId;
      const isAdmin = ['admin', 'super_admin'].includes(userRole);

      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
      }

      // Create new appointment with new time
      const newAppointment = repo.create({
        patient: appointment.patient,
        doctor: appointment.doctor,
        service: appointment.service,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: AppointmentStatus.PENDING,
        notes: appointment.notes,
        reason: appointment.reason,
        rescheduledFrom: appointment.id
      });

      await repo.save(newAppointment);

      // Mark old appointment as cancelled
      appointment.status = AppointmentStatus.CANCELLED;
      (appointment as any).cancellationReason = `Rescheduled: ${reason || 'Patient request'}`;
      (appointment as any).cancelledAt = new Date();
      (appointment as any).rescheduledTo = newAppointment.id;
      await repo.save(appointment);

      await addHistory(appointment.id, 'rescheduled', `Rescheduled to ${startTime}`, userId);
      await addHistory(newAppointment.id, 'created', 'Created from reschedule', userId);

      return res.json({
        message: 'Appointment rescheduled successfully',
        data: newAppointment
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return res.status(500).json({ message: 'Error rescheduling appointment' });
    }
  };

  // Mark as completed (doctor only)
  static completeAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { consultationNotes } = req.body;
      const userId = (req as any).user?.id;

      const repo = AppDataSource.getRepository(Appointment);
      const appointment = await repo.findOne({
        where: { id },
        relations: ['doctor']
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Only doctor can mark as completed
      if (appointment.doctor?.id !== userId) {
        return res.status(403).json({ message: 'Only the assigned doctor can complete this appointment' });
      }

      appointment.status = AppointmentStatus.COMPLETED;
      (appointment as any).completedAt = new Date();
      if (consultationNotes) {
        (appointment as any).consultationNotes = consultationNotes;
      }

      await repo.save(appointment);
      await addHistory(id, 'notes_updated', 'Appointment completed', userId);

      return res.json({
        message: 'Appointment marked as completed',
        data: appointment
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      return res.status(500).json({ message: 'Error completing appointment' });
    }
  };

  // Mark as no-show (doctor only)
  static markNoShow = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const repo = AppDataSource.getRepository(Appointment);
      const appointment = await repo.findOne({
        where: { id },
        relations: ['doctor']
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Only doctor can mark as no-show
      if (appointment.doctor?.id !== userId) {
        return res.status(403).json({ message: 'Only the assigned doctor can mark no-show' });
      }

      appointment.status = AppointmentStatus.NOSHOW;
      await repo.save(appointment);
      await addHistory(id, 'notes_updated', 'Marked as no-show', userId);

      return res.json({
        message: 'Appointment marked as no-show',
        data: appointment
      });
    } catch (error) {
      console.error('Error marking no-show:', error);
      return res.status(500).json({ message: 'Error marking no-show' });
    }
  };

  // Add consultation notes (doctor only)
  static addConsultationNotes = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = (req as any).user?.id;

      if (!notes) {
        return res.status(400).json({ message: 'Notes are required' });
      }

      const repo = AppDataSource.getRepository(Appointment);
      const appointment = await repo.findOne({
        where: { id },
        relations: ['doctor']
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Only doctor can add consultation notes
      if (appointment.doctor?.id !== userId) {
        return res.status(403).json({ message: 'Only the assigned doctor can add consultation notes' });
      }

      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] ${notes}`;
      (appointment as any).consultationNotes = (appointment as any).consultationNotes
        ? `${(appointment as any).consultationNotes}\n${newNote}`
        : newNote;

      await repo.save(appointment);
      await addHistory(id, 'notes_updated', 'Consultation notes added', userId);

      return res.json({
        message: 'Consultation notes added successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Error adding consultation notes:', error);
      return res.status(500).json({ message: 'Error adding consultation notes' });
    }
  };

  // List appointment history (patient-owned)
  static listHistory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const role = (req as any).user?.role as string | undefined;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    try {
      // Ensure access: patient owner, assigned doctor, or admin
      const appt = await AppDataSource.getRepository(Appointment)
        .findOne({ where: { id } as any, relations: ['patient','doctor'] });
      if (!appt) return res.status(404).json({ message: 'Appointment not found' });

      const isPatientOwner = (appt as any).patient?.id === userId;
      const isAssignedDoctor = (appt as any).doctor?.id === userId;
      const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
      if (!isPatientOwner && !isAssignedDoctor && !isAdmin) {
        // Hide existence to unauthorized users to avoid information leakage
        return res.status(404).json({ message: 'Appointment not found' });
      }
      const items = await AppDataSource.getRepository(AppointmentHistory)
        .createQueryBuilder('h')
        .where('h.appointment_id = :id', { id })
        .orderBy('h.created_at','ASC')
        .getMany();
      return res.json({ data: items });
    } catch (e) {
      console.error('List appointment history error:', e);
      return res.status(500).json({ message: 'Error fetching history' });
    }
  };

  // Admin: Backfill departments by assigning a default service to appointments missing one
  static adminBackfillDepartments = async (req: Request, res: Response) => {
    const { departmentId, departmentName } = req.body || {};
    const apptRepo = AppDataSource.getRepository(Appointment);
    const svcRepo = AppDataSource.getRepository(Service);
    // Lazy import to avoid circular imports in some setups
    const deptRepo = AppDataSource.getRepository(require('../models/Department').Department);

    try {
      // Resolve department
      let dept = departmentId ? await deptRepo.findOne({ where: { id: departmentId } }) : undefined;
      if (!dept && departmentName) {
        dept = await deptRepo.createQueryBuilder('d')
          .where('LOWER(d.name) = :n', { n: String(departmentName).toLowerCase() })
          .getOne();
      }
      if (!dept) {
        return res.status(400).json({ message: 'departmentId or a valid departmentName is required' });
      }

      // Ensure default service exists under this department
      let service = await svcRepo.findOne({ where: { department: { id: (dept as any).id }, name: 'General Consultation' } as any, relations: ['department'] });
      if (!service) {
        const s = new Service() as any;
        s.name = 'General Consultation';
        s.description = 'Default service for department appointments';
        s.status = 'active';
        s.averageDuration = 30;
        s.department = dept as any;
        s.departmentId = (dept as any).id;
        const saved = await svcRepo.save(s);
        service = await svcRepo.findOne({ where: { id: saved.id }, relations: ['department'] }) as any;
      }

      // Find appointments missing service
      const list = await apptRepo.createQueryBuilder('a')
        .leftJoinAndSelect('a.service', 'service')
        .where('a.serviceId IS NULL')
        .getMany();

      for (const a of list) {
        (a as any).service = service as any;
      }
      if (list.length) {
        await apptRepo.save(list);
      }

      return res.json({ updated: list.length, department: { id: (dept as any).id, name: (dept as any).name }, service: { id: (service as any).id, name: (service as any).name } });
    } catch (e) {
      console.error('Admin backfill departments error:', e);
      return res.status(500).json({ message: 'Error backfilling appointments' });
    }
  };

  // Cancel appointment
  static cancelAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, cancellationCharge } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const appointmentRepo = AppDataSource.getRepository(Appointment);

      // Get appointment
      const appointment = await appointmentRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if appointment can be cancelled
      const now = new Date();
      const appointmentTime = new Date(appointment.startTime);
      const hoursBefore = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Patient can cancel up to 24 hours before
      // Admin can cancel anytime
      if (user.role === UserRole.PATIENT && hoursBefore < 24) {
        return res.status(400).json({
          message: 'Cannot cancel appointment within 24 hours of appointment time',
          hoursRemaining: Math.ceil(hoursBefore)
        });
      }

      // Update appointment
      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancellationReason = reason;
      appointment.cancelledAt = new Date();
      appointment.cancellationDate = new Date();
      appointment.cancellationCharge = cancellationCharge || 0;
      appointment.cancelledBy = user;

      await appointmentRepo.save(appointment);

      // Add history
      await addHistory(id, 'cancelled', `Cancelled: ${reason}`, user.id);

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

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const appointmentRepo = AppDataSource.getRepository(Appointment);

      // Get original appointment
      const appointment = await appointmentRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check if patient can reschedule (24 hours before)
      const now = new Date();
      const appointmentTime = new Date(appointment.startTime);
      const hoursBefore = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (user.role === UserRole.PATIENT && hoursBefore < 24) {
        return res.status(400).json({
          message: 'Cannot reschedule appointment within 24 hours of appointment time'
        });
      }

      // Check if new slot is available (doctor not double-booked)
      const conflict = await appointmentRepo.findOne({
        where: {
          doctorId: appointment.doctorId,
          startTime: new Date(newStartTime),
          organizationId: tenantId,
          status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS])
        }
      });

      if (conflict) {
        return res.status(400).json({ message: 'Doctor is not available at this time' });
      }

      // Store original appointment ID for reference
      const originalId = appointment.id;

      // Update appointment
      appointment.startTime = new Date(newStartTime);
      appointment.endTime = new Date(newEndTime);

      const updated = await appointmentRepo.save(appointment);

      // Add history
      await addHistory(originalId, 'rescheduled', `Rescheduled from ${appointment.startTime} to ${newStartTime}`, user.id);

      return res.json({ success: true, message: 'Appointment rescheduled', appointment: updated });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return res.status(500).json({ message: 'Failed to reschedule appointment' });
    }
  };

  // Create emergency appointment
  static createEmergencyAppointment = async (req: Request, res: Response) => {
    try {
      const {
        patientId,
        doctorId,
        serviceId,
        reason,
        priority = 'urgent'
      } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const appointmentRepo = AppDataSource.getRepository(Appointment);

      // Create emergency appointment for TODAY, ASAP
      const now = new Date();
      const startTime = new Date(now.getTime() + 30 * 60000); // 30 min from now
      const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 min duration

      const appointment = appointmentRepo.create({
        doctorId,
        patientId,
        organizationId: tenantId,
        startTime,
        endTime,
        serviceId,
        appointmentType: 'emergency' as any,
        mode: 'in-person' as any,
        status: AppointmentStatus.CONFIRMED,
        reason: reason,
        notes: `Emergency appointment - Priority: ${priority}`
      });

      const saved = await appointmentRepo.save(appointment);

      // Add history
      await addHistory(saved.id, 'created', `Emergency appointment created with priority: ${priority}`, user.id);

      return res.status(201).json({
        success: true,
        message: 'Emergency appointment created',
        appointment: saved,
        timeToAppointment: '30 minutes'
      });
    } catch (error) {
      console.error('Error creating emergency appointment:', error);
      return res.status(500).json({ message: 'Failed to create emergency appointment' });
    }
  };

  // Mark appointment as completed
  static completeAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { consultationNotes, followUpReason } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const appointmentRepo = AppDataSource.getRepository(Appointment);

      const appointment = await appointmentRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Update appointment
      appointment.status = AppointmentStatus.COMPLETED;
      appointment.completedAt = new Date();
      appointment.consultationNotes = consultationNotes;

      await appointmentRepo.save(appointment);

      // Add history
      await addHistory(id, 'confirmed', `Appointment completed with notes`, user.id);

      return res.json({ success: true, message: 'Appointment marked as completed', appointment });
    } catch (error) {
      console.error('Error completing appointment:', error);
      return res.status(500).json({ message: 'Failed to complete appointment' });
    }
  };
}
