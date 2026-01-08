import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Referral } from '../models/Referral';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { canDoctorAccessPatient } from '../middleware/access.middleware';
import { createTenantRepository } from '../repositories/TenantRepository';

export class ReferralController {
  static createReferral = async (req: Request, res: Response) => {
    const { patientId, departmentId } = req.body || {};
    if (!patientId || !departmentId) {
      return res.status(400).json({ message: 'patientId and departmentId are required' });
    }
    try {
      const userRepo = AppDataSource.getRepository(User);
      const deptRepo = AppDataSource.getRepository(Department);
      const refRepo = AppDataSource.getRepository(Referral);

      const patient = await userRepo.findOne({ where: { id: patientId } });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const dept = await deptRepo.findOne({ where: { id: departmentId } });
      if (!dept) return res.status(404).json({ message: 'Department not found' });

      const existing = await refRepo.findOne({ where: { patientId, departmentId } as any });
      if (existing) return res.status(200).json(existing);

      const r = new Referral();
      r.patientId = patientId;
      r.departmentId = departmentId;
      const saved = await refRepo.save(r);
      return res.status(201).json(saved);
    } catch (e) {
      console.error('Create referral error:', e);
      return res.status(500).json({ message: 'Failed to create referral' });
    }
  };

  static listPatientReferrals = async (req: Request, res: Response) => {
    const { patientId } = req.params as any;
    try {
      const refRepo = AppDataSource.getRepository(Referral);
      const items = await refRepo.find({ where: { patientId } as any, relations: ['department'] });
      return res.json(items);
    } catch (e) {
      console.error('List referrals error:', e);
      return res.status(500).json({ message: 'Failed to list referrals' });
    }
  };

  // Doctor: create referral if doctor has access to the patient per FR-001
  static doctorCreateReferral = async (req: Request, res: Response) => {
    const doctorId = (req as any).user?.id as string | undefined;
    const { patientId } = req.params as any;
    const { departmentId } = req.body || {};
    if (!doctorId) return res.status(401).json({ message: 'Authentication required' });
    if (!patientId || !departmentId) return res.status(400).json({ message: 'patientId and departmentId are required' });
    try {
      const ok = await canDoctorAccessPatient(patientId, doctorId);
      if (!ok) return res.status(403).json({ message: 'Access denied by department policy (FR-001)' });
      const dept = await AppDataSource.getRepository(Department).findOne({ where: { id: departmentId } });
      if (!dept) return res.status(404).json({ message: 'Department not found' });
      const refRepo = AppDataSource.getRepository(Referral);
      const existing = await refRepo.findOne({ where: { patientId, departmentId } as any });
      if (existing) return res.json(existing);
      const r = new Referral();
      r.patientId = patientId;
      r.departmentId = departmentId;
      const saved = await refRepo.save(r);
      return res.status(201).json(saved);
    } catch (e) {
      console.error('Doctor create referral error:', e);
      return res.status(500).json({ message: 'Failed to create referral' });
    }
  };

  // Doctor: list patient referrals if doctor has access per FR-001
  static doctorListReferrals = async (req: Request, res: Response) => {
    const doctorId = (req as any).user?.id as string | undefined;
    const { patientId } = req.params as any;
    if (!doctorId) return res.status(401).json({ message: 'Authentication required' });
    try {
      const ok = await canDoctorAccessPatient(patientId, doctorId);
      if (!ok) return res.status(403).json({ message: 'Access denied by department policy (FR-001)' });
      const refRepo = AppDataSource.getRepository(Referral);
      const items = await refRepo.find({ where: { patientId } as any, relations: ['department'] });
      return res.json(items);
    } catch (e) {
      console.error('Doctor list referrals error:', e);
      return res.status(500).json({ message: 'Failed to list referrals' });
    }
  };
}
