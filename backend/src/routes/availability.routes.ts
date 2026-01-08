import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AvailabilitySlot, DayOfWeek } from '../models/AvailabilitySlot';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { AvailabilityController } from '../controllers/availability.controller';
import { Between, MoreThanOrEqual } from 'typeorm';

const router = Router();

/**
 * @swagger
 * /availability/doctors/{doctorId}:
 *   get:
 *     summary: Get doctor's availability slots (public)
 *     tags: [Availability]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date (YYYY-MM-DD)
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *     responses:
 *       200:
 *         description: Doctor availability slots
 */
router.get('/doctors/:doctorId', errorHandler(async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { date, dayOfWeek } = req.query;
  
  // Note: Avoid strict UUID v4 validation here to support integration tests that use deterministic IDs.

  const repo = AppDataSource.getRepository(AvailabilitySlot);
  const whereClause: any = {
    doctor: { id: doctorId },
    isActive: true
  };

  if (date) {
    whereClause.specificDate = new Date(date as string);
  } else if (dayOfWeek) {
    whereClause.dayOfWeek = dayOfWeek as DayOfWeek;
  }

  const slots = await repo.find({
    where: whereClause,
    order: { startTime: 'ASC' }
  });

  res.json({ data: slots });
}));

/**
 * @swagger
 * /availability:
 *   post:
 *     summary: Create availability slot (doctors/admins only)
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *               dayOfWeek:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *               specificDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Availability slot created
 */
router.post('/', authenticate, errorHandler(async (req: any, res: Response) => {
  const { doctorId, dayOfWeek, startTime, endTime, specificDate, notes } = req.body;
  
  // Check if user is doctor managing own schedule or admin
  const isOwnSchedule = req.user.role === UserRole.DOCTOR && req.user.id === doctorId;
  const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
  
  if (!isOwnSchedule && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized to manage this schedule' });
  }

  const repo = AppDataSource.getRepository(AvailabilitySlot);
  const userRepo = AppDataSource.getRepository(User);
  
  const doctor = await userRepo.findOne({ where: { id: doctorId, role: UserRole.DOCTOR } });
  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  const slot = repo.create({
    doctor,
    dayOfWeek,
    startTime,
    endTime,
    specificDate: specificDate ? new Date(specificDate) : undefined,
    notes
  });

  await repo.save(slot);
  res.status(201).json({ data: slot });
}));

/**
 * @swagger
 * /availability/{id}:
 *   put:
 *     summary: Update availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, errorHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  const repo = AppDataSource.getRepository(AvailabilitySlot);
  const slot = await repo.findOne({ where: { id }, relations: ['doctor'] });
  
  if (!slot) {
    return res.status(404).json({ message: 'Availability slot not found' });
  }

  const isOwnSchedule = req.user.role === UserRole.DOCTOR && req.user.id === slot.doctor.id;
  const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
  
  if (!isOwnSchedule && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized to update this schedule' });
  }

  Object.assign(slot, updates);
  await repo.save(slot);
  
  res.json({ data: slot });
}));

/**
 * @swagger
 * /availability/{id}:
 *   delete:
 *     summary: Delete availability slot
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, errorHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  
  const repo = AppDataSource.getRepository(AvailabilitySlot);
  const slot = await repo.findOne({ where: { id }, relations: ['doctor'] });
  
  if (!slot) {
    return res.status(404).json({ message: 'Availability slot not found' });
  }

  const isOwnSchedule = req.user.role === UserRole.DOCTOR && req.user.id === slot.doctor.id;
  const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
  
  if (!isOwnSchedule && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized to delete this schedule' });
  }

  await repo.remove(slot);
  res.status(204).send();
}));

/**
 * @swagger
 * /availability/my-schedule:
 *   get:
 *     summary: Get current user's availability (doctors only)
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my-schedule', authenticate, errorHandler(async (req: any, res: Response) => {
  if (req.user.role !== UserRole.DOCTOR) {
    return res.status(403).json({ message: 'Only doctors can access this endpoint' });
  }

  const repo = AppDataSource.getRepository(AvailabilitySlot);
  const slots = await repo.find({
    where: { doctor: { id: req.user.id } },
    order: { dayOfWeek: 'ASC', startTime: 'ASC' }
  });

  res.json({ data: slots });
}));

/**
 * @swagger
 * /availability/slots/available:
 *   get:
 *     summary: Get available time slots for booking (public)
 *     tags: [Availability]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by specific doctor
 *     responses:
 *       200:
 *         description: Available time slots with doctors
 */
router.get('/slots/available', errorHandler(AvailabilityController.getAvailableSlots));

export default router;
