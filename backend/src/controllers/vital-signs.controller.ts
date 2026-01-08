import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { VitalSigns } from '../models/VitalSigns';
import { User } from '../models/User';
import { ConsultationNote } from '../models/ConsultationNote';
import { createTenantRepository } from '../repositories/TenantRepository';

export class VitalSignsController {
  // Record vital signs
  static recordVitalSigns = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const {
        patientId,
        consultationId,
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        temperature,
        temperatureUnit,
        oxygenSaturation,
        weight,
        weightUnit,
        height,
        heightUnit,
        painScale
      } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required' });
      }

      const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);
      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id: patientId, organizationId: tenantId }
      });
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // CRITICAL: Filter user by organization_id
      const recordedBy = await userRepo.findOne({
        where: { id: userId, organizationId: tenantId }
      });
      if (!recordedBy) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Calculate BMI if weight and height are provided
      let bmi: number | undefined;
      if (weight && height) {
        // Convert to metric if needed
        let weightKg = weight;
        let heightM = height / 100; // assuming height is in cm

        if (weightUnit === 'lbs') {
          weightKg = weight * 0.453592;
        }
        if (heightUnit === 'in') {
          heightM = (height * 2.54) / 100;
        }

        bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
      }

      const vitalSigns = vitalSignsRepo.create({
        patient,
        recordedBy,
        organizationId: tenantId,
        systolicBp,
        diastolicBp,
        heartRate,
        respiratoryRate,
        temperature,
        temperatureUnit,
        oxygenSaturation,
        weight,
        weightUnit,
        height,
        heightUnit,
        bmi,
        painScale
      });

      // Link to consultation if provided
      if (consultationId) {
        const consultationRepo = AppDataSource.getRepository(ConsultationNote);

        // CRITICAL: Filter consultation by organization_id
        const consultation = await consultationRepo.findOne({
          where: { id: consultationId, organizationId: tenantId }
        });
        if (consultation) {
          vitalSigns.consultation = consultation;
        }
      }

      await vitalSignsRepo.save(vitalSigns);

      return res.status(201).json({
        message: 'Vital signs recorded successfully',
        data: vitalSigns
      });
    } catch (error) {
      console.error('Error recording vital signs:', error);
      return res.status(500).json({ message: 'Error recording vital signs' });
    }
  };

  // Get vital signs by ID
  static getVitalSigns = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);

      // CRITICAL: Filter by organization_id using queryBuilder
      const vitalSigns = await vitalSignsRepo.createQueryBuilder('vitalSigns')
        .leftJoinAndSelect('vitalSigns.patient', 'patient')
        .leftJoinAndSelect('vitalSigns.recordedBy', 'recordedBy')
        .leftJoinAndSelect('vitalSigns.consultation', 'consultation')
        .where('vitalSigns.id = :id', { id })
        .andWhere('vitalSigns.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!vitalSigns) {
        return res.status(404).json({ message: 'Vital signs not found' });
      }

      return res.json({ data: vitalSigns });
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      return res.status(500).json({ message: 'Error fetching vital signs' });
    }
  };

  // Get patient vital signs
  static getPatientVitalSigns = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);

      // CRITICAL: Filter by organization_id using queryBuilder
      const queryBuilder = vitalSignsRepo.createQueryBuilder('vitalSigns')
        .leftJoinAndSelect('vitalSigns.recordedBy', 'recordedBy')
        .where('vitalSigns.patientId = :patientId', { patientId: id })
        .andWhere('vitalSigns.organization_id = :tenantId', { tenantId })
        .orderBy('vitalSigns.recordedAt', 'DESC')
        .take(Number(limit))
        .skip(Number(offset));

      const [vitalSigns, total] = await queryBuilder.getManyAndCount();

      return res.json({
        data: vitalSigns,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Error fetching patient vital signs:', error);
      return res.status(500).json({ message: 'Error fetching vital signs' });
    }
  };

  // Get vital signs trends
  static getVitalSignsTrends = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      // CRITICAL: Filter by organization_id using queryBuilder
      const vitalSigns = await vitalSignsRepo.createQueryBuilder('vs')
        .where('vs.patientId = :patientId', { patientId: id })
        .andWhere('vs.organization_id = :tenantId', { tenantId })
        .andWhere('vs.recordedAt >= :startDate', { startDate })
        .orderBy('vs.recordedAt', 'ASC')
        .getMany();

      // Calculate trends
      const trends = {
        bloodPressure: vitalSigns
          .filter(vs => vs.systolicBp && vs.diastolicBp)
          .map(vs => ({
            date: vs.recordedAt,
            systolic: vs.systolicBp,
            diastolic: vs.diastolicBp
          })),
        heartRate: vitalSigns
          .filter(vs => vs.heartRate)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.heartRate
          })),
        temperature: vitalSigns
          .filter(vs => vs.temperature)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.temperature,
            unit: vs.temperatureUnit
          })),
        weight: vitalSigns
          .filter(vs => vs.weight)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.weight,
            unit: vs.weightUnit,
            bmi: vs.bmi
          })),
        oxygenSaturation: vitalSigns
          .filter(vs => vs.oxygenSaturation)
          .map(vs => ({
            date: vs.recordedAt,
            value: vs.oxygenSaturation
          }))
      };

      // Calculate averages
      const averages = {
        systolicBp: trends.bloodPressure.length > 0
          ? Math.round(trends.bloodPressure.reduce((sum, item) => sum + (item.systolic || 0), 0) / trends.bloodPressure.length)
          : null,
        diastolicBp: trends.bloodPressure.length > 0
          ? Math.round(trends.bloodPressure.reduce((sum, item) => sum + (item.diastolic || 0), 0) / trends.bloodPressure.length)
          : null,
        heartRate: trends.heartRate.length > 0
          ? Math.round(trends.heartRate.reduce((sum, item) => sum + (item.value || 0), 0) / trends.heartRate.length)
          : null,
        temperature: trends.temperature.length > 0
          ? (trends.temperature.reduce((sum, item) => sum + (item.value || 0), 0) / trends.temperature.length).toFixed(1)
          : null,
        weight: trends.weight.length > 0
          ? (trends.weight.reduce((sum, item) => sum + (item.value || 0), 0) / trends.weight.length).toFixed(1)
          : null,
        oxygenSaturation: trends.oxygenSaturation.length > 0
          ? Math.round(trends.oxygenSaturation.reduce((sum, item) => sum + (item.value || 0), 0) / trends.oxygenSaturation.length)
          : null
      };

      return res.json({
        data: {
          trends,
          averages,
          period: {
            days: Number(days),
            startDate,
            endDate: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching vital signs trends:', error);
      return res.status(500).json({ message: 'Error fetching trends' });
    }
  };
}
