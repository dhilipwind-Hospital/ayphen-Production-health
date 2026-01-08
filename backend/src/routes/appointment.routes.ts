import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { DoctorAvailabilityController } from '../controllers/doctorAvailability.controller';
import { AppointmentFeedbackController } from '../controllers/appointmentFeedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { isAdmin, isDoctor } from '../middleware/rbac.middleware';
import { validateDto } from '../middleware/validation.middleware';
import { CreateAppointmentDto, UpdateAppointmentDto } from '../dto/create-appointment.dto';
import { errorHandler } from '../middleware/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - serviceId
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the appointment
 *         serviceId:
 *           type: string
 *           format: uuid
 *           description: The ID of the service being booked
 *         doctorId:
 *           type: string
 *           format: uuid
 *           description: The ID of the doctor (optional)
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: The start time of the appointment
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: The end time of the appointment
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no_show]
 *           default: scheduled
 *         notes:
 *           type: string
 *           description: Additional notes for the appointment
 *         reason:
 *           type: string
 *           description: Reason for the appointment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the appointment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the appointment was last updated
 *         service:
 *           $ref: '#/components/schemas/Service'
 *         doctor:
 *           $ref: '#/components/schemas/User'
 *         patient:
 *           $ref: '#/components/schemas/User'
 *     
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         duration:
 *           type: integer
 *         price:
 *           type: number
 *     
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 * 
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: Error message describing what went wrong
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Error detail 1", "Error detail 2"]
 */

const router = Router();

// Apply authentication middleware to all appointment routes
router.use(authenticate);

// ==================== DOCTOR AVAILABILITY ROUTES ====================

/**
 * @swagger
 * /appointments/availability/{doctorId}/{date}:
 *   get:
 *     summary: Get available time slots for a doctor on a specific date
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: List of available time slots
 */
router.get(
  '/availability/:doctorId/:date',
  authenticate,
  errorHandler(DoctorAvailabilityController.getAvailableSlots)
);

/**
 * @swagger
 * /appointments/availability/{doctorId}:
 *   post:
 *     summary: Set or update doctor availability
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *               slotDurationMinutes:
 *                 type: number
 *                 default: 30
 *               status:
 *                 type: string
 *                 enum: [available, on-leave, holiday, blocked]
 *               isRecurring:
 *                 type: boolean
 *                 description: If true, applies this availability for 12 weeks
 *     responses:
 *       201:
 *         description: Availability created/updated successfully
 */
router.post(
  '/availability/:doctorId',
  isDoctor,
  errorHandler(DoctorAvailabilityController.setAvailability)
);

/**
 * @swagger
 * /appointments/doctor-schedule/{doctorId}:
 *   get:
 *     summary: Get doctor's 30-day availability schedule
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor's schedule for next 30 days
 */
router.get(
  '/doctor-schedule/:doctorId',
  authenticate,
  errorHandler(DoctorAvailabilityController.getDoctorSchedule)
);

/**
 * @swagger
 * /appointments/available-doctors:
 *   get:
 *     summary: Get all available doctors for a specific date
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department (optional)
 *     responses:
 *       200:
 *         description: List of available doctors
 */
router.get(
  '/available-doctors',
  authenticate,
  errorHandler(DoctorAvailabilityController.getAvailableDoctors)
);

// ==================== EMERGENCY APPOINTMENT ROUTES ====================

/**
 * @swagger
 * /appointments/emergency:
 *   post:
 *     summary: Create an emergency same-day appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *               doctorId:
 *                 type: string
 *               serviceId:
 *                 type: string
 *               reason:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [high, critical]
 *     responses:
 *       201:
 *         description: Emergency appointment created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Doctor or patient not found
 */
router.post(
  '/emergency',
  errorHandler(AppointmentController.createEmergencyAppointment)
);

// ==================== FEEDBACK ROUTES ====================

/**
 * @swagger
 * /appointments/{appointmentId}/feedback:
 *   post:
 *     summary: Submit feedback for a completed appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               facilityRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               staffRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               overallRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               doctorComment:
 *                 type: string
 *               facilityComment:
 *                 type: string
 *               overallComment:
 *                 type: string
 *               wouldRecommend:
 *                 type: boolean
 *               followUpNeeded:
 *                 type: boolean
 *               followUpReason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 */
router.post(
  '/:appointmentId/feedback',
  errorHandler(AppointmentFeedbackController.submitFeedback)
);

/**
 * @swagger
 * /appointments/{appointmentId}/feedback:
 *   get:
 *     summary: Get feedback for a specific appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment feedback
 *       404:
 *         description: Feedback not found
 */
router.get(
  '/:appointmentId/feedback',
  authenticate,
  errorHandler(AppointmentFeedbackController.getAppointmentFeedback)
);

/**
 * @swagger
 * /appointments/doctor/{doctorId}/ratings:
 *   get:
 *     summary: Get doctor's overall ratings and statistics
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor ratings and recommendation percentage
 */
router.get(
  '/doctor/:doctorId/ratings',
  authenticate,
  errorHandler(AppointmentFeedbackController.getDoctorRatings)
);

/**
 * @swagger
 * /appointments/doctor/{doctorId}/feedback-statistics:
 *   get:
 *     summary: Get comprehensive doctor feedback statistics
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor feedback statistics including rating breakdown
 */
router.get(
  '/doctor/:doctorId/feedback-statistics',
  authenticate,
  errorHandler(AppointmentFeedbackController.getDoctorFeedbackStatistics)
);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - User not authorized to create appointment
 *       409:
 *         description: Conflict - Time slot not available
 */
router.post(
  '/',
  authenticate,
  tenantContext,
  validateDto(CreateAppointmentDto),
  errorHandler(AppointmentController.bookAppointment)
);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get list of user's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, no_show]
 *         description: Filter appointments by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter appointments after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter appointments before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for service or doctor name
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/', authenticate, errorHandler(AppointmentController.listUserAppointments));

// Admin: list all appointments
router.get('/admin', authenticate, isAdmin, errorHandler(AppointmentController.listAllAppointments));
router.get('/admin/:id', authenticate, isAdmin, errorHandler(AppointmentController.adminGetAppointment));
router.patch('/admin/:id/notes', authenticate, isAdmin, errorHandler(AppointmentController.adminBackfillDepartments));
router.patch('/admin/:id/cancel', authenticate, isAdmin, errorHandler(AppointmentController.adminCancelAppointment));
router.post('/admin/:id/confirm', authenticate, isAdmin, errorHandler(AppointmentController.adminConfirmAppointment));

// Doctor: list own appointments
router.get('/doctor/me', isDoctor, errorHandler(AppointmentController.listDoctorAppointments));
// Doctor: update notes for own appointment
router.patch('/doctor/:id/notes', isDoctor, errorHandler(AppointmentController.doctorUpdateNotes));
// Doctor: create follow-up appointment for a patient
router.post('/doctor', isDoctor, errorHandler(AppointmentController.doctorCreateAppointment));

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment details by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not authorized to view this appointment
 *       404:
 *         description: Appointment not found
 */
router.get(
  '/:id',
  authenticate,
  errorHandler(AppointmentController.getAppointment)
);

/**
 * @swagger
 * /appointments/{id}:
 *   patch:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not authorized to update this appointment
 *       404:
 *         description: Appointment not found
 *       409:
 *         description: Conflict - Time slot not available
 */
router.patch(
  '/:id',
  validateDto(UpdateAppointmentDto, true), // Allow partial updates
  errorHandler(AppointmentController.updateAppointment)
);

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       204:
 *         description: Appointment cancelled successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not authorized to cancel this appointment
 *       404:
 *         description: Appointment not found
 */
router.delete(
  '/:id',
  errorHandler(AppointmentController.cancelAppointment)
);

// Patient: cancel with reason (accepts body { reason })
router.post(
  '/:id/cancel',
  errorHandler(AppointmentController.cancelAppointmentWithReason)
);

// Reschedule appointment
router.post(
  '/:id/reschedule',
  authenticate,
  errorHandler(AppointmentController.rescheduleAppointment)
);

// Complete appointment (doctor only)
router.post(
  '/:id/complete',
  authenticate,
  errorHandler(AppointmentController.completeAppointment)
);

// Mark as no-show (doctor only)
router.post(
  '/:id/no-show',
  authenticate,
  errorHandler(AppointmentController.markNoShow)
);

// Add consultation notes (doctor only)
router.post(
  '/:id/consultation-notes',
  authenticate,
  errorHandler(AppointmentController.addConsultationNotes)
);

// Appointment history timeline
router.get(
  '/:id/history',
  authenticate,
  errorHandler(AppointmentController.listHistory)
);

export default router;
