import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Referral } from '../models/Referral';
import { UserRole } from '../types/roles';
import { Appointment } from '../models/Appointment';

/**
 * Utility: check if a doctor (by id) can access a patient's records based on FR-001.
 * Access if:
 *  - doctor's departmentId === patient's primaryDepartmentId, OR
 *  - there exists a referral for the patient to the doctor's department
 */
export async function canDoctorAccessPatient(patientId: string, doctorId: string): Promise<boolean> {
  const userRepo = AppDataSource.getRepository(User);
  const referralRepo = AppDataSource.getRepository(Referral);
  const apptRepo = AppDataSource.getRepository(Appointment);

  const doctor = await userRepo.findOne({ where: { id: doctorId } });
  const patient = await userRepo.findOne({ where: { id: patientId } });

  if (!doctor || !patient) return false;
  if (String(doctor.role).toLowerCase() !== String(UserRole.DOCTOR).toLowerCase()) return false;

  // Primary department match
  if (doctor.departmentId && patient.primaryDepartmentId && doctor.departmentId === patient.primaryDepartmentId) {
    return true;
  }

  // Referral-based match
  if (doctor.departmentId) {
    const exists = await referralRepo.findOne({ where: { patientId, departmentId: doctor.departmentId } as any });
    if (exists) return true;
  }

  // Treated-patient access: any appointment between this doctor and patient
  const hasAppt = await apptRepo.createQueryBuilder('a')
    .leftJoin('a.doctor', 'doctor')
    .leftJoin('a.patient', 'patient')
    .where('doctor.id = :doctorId', { doctorId })
    .andWhere('patient.id = :patientId', { patientId })
    .limit(1)
    .getOne();
  if (hasAppt) return true;

  return false;
}

/**
 * Middleware: enforce FR-001 department access rules for patient reports
 * Expects req.user.id (doctor) and req.params.patientId (or provided via getter)
 */
export function enforcePatientReportAccess(getPatientId: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id as string | undefined;
      const role = String((req as any).user?.role || '').toLowerCase();
      if (!userId) return res.status(401).json({ message: 'Authentication required' });
      // Admin/super_admin bypass
      if (role === 'admin' || role === 'super_admin') return next();
      const patientId = getPatientId(req);
      if (!patientId) return res.status(400).json({ message: 'patientId required' });

      const ok = await canDoctorAccessPatient(patientId, userId);
      if (!ok) return res.status(403).json({ message: 'Access denied by department policy (FR-001)' });
      return next();
    } catch (e) {
      console.error('Access check error:', e);
      return res.status(500).json({ message: 'Access check failed' });
    }
  };
}
