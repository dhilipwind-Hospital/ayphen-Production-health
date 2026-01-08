import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { errorHandler } from '../middleware/error.middleware';
import { ReportController } from '../controllers/report.controller';
import { enforcePatientReportAccess } from '../middleware/access.middleware';
import { AppDataSource } from '../config/database';
import { Report } from '../models/Report';

const router = Router();

// List patient reports (FR-001 enforced for doctor role)
router.get(
  '/patients/:patientId/reports',
  authenticate,
  authorize({ requireRole: [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN] }),
  enforcePatientReportAccess(req => req.params.patientId),
  errorHandler(ReportController.listPatientReports)
);

// Get one report (FR-001 enforced for doctor role)
router.get(
  '/reports/:reportId',
  authenticate,
  authorize({ requireRole: [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN] }),
  // resolve patient id from report then enforce
  async (req, res, next) => {
    try {
      const report = await AppDataSource.getRepository(Report).findOne({ where: { id: req.params.reportId } as any });
      if (!report) return res.status(404).json({ message: 'Report not found' });
      (req as any).__patientId = report.patientId;
      next();
    } catch (e) { next(e); }
  },
  enforcePatientReportAccess(req => (req as any).__patientId),
  errorHandler(ReportController.getReport)
);

// Create report (admin/doctors only)
router.post(
  '/reports',
  authenticate,
  authorize({ requireRole: [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN] }),
  // For doctors, enforce FR-001 using patientId from body; admins bypass in middleware
  enforcePatientReportAccess(req => (req.body as any)?.patientId),
  errorHandler(ReportController.createReport)
);

export default router;
