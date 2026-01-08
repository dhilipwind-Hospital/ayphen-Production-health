import { Router } from 'express';
import { ConsultationController } from '../controllers/consultation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /consultations:
 *   post:
 *     summary: Create consultation note
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  errorHandler(ConsultationController.createConsultation)
);

/**
 * @swagger
 * /consultations/{id}:
 *   get:
 *     summary: Get consultation note
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  errorHandler(ConsultationController.getConsultation)
);

/**
 * @swagger
 * /consultations/{id}:
 *   put:
 *     summary: Update consultation note
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  errorHandler(ConsultationController.updateConsultation)
);

/**
 * @swagger
 * /patients/{id}/consultations:
 *   get:
 *     summary: Get patient consultations
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/patient/:id',
  authenticate,
  errorHandler(ConsultationController.getPatientConsultations)
);

/**
 * @swagger
 * /consultations/{id}/sign:
 *   post:
 *     summary: Sign consultation note
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/sign',
  authenticate,
  errorHandler(ConsultationController.signConsultation)
);

/**
 * @swagger
 * /consultations/{id}/pdf:
 *   get:
 *     summary: Generate consultation PDF
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/pdf',
  authenticate,
  errorHandler(ConsultationController.getConsultationPDF)
);

export default router;
