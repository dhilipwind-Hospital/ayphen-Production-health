import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { In } from 'typeorm';
import { Plan } from '../models/Plan';
import { Policy } from '../models/Policy';
import { Claim } from '../models/Claim';

export class InsuranceController {
  static listPlans = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const repo = AppDataSource.getRepository(Plan);
      const country = String((req.query as any)?.country || '').toUpperCase();

      // CRITICAL: Filter by organization_id using queryBuilder
      const queryBuilder = repo.createQueryBuilder('plan')
        .where('plan.organization_id = :tenantId', { tenantId });

      if (country && country !== 'ALL') {
        queryBuilder.andWhere('plan.country = :country', { country });
      }

      const plans = await queryBuilder.orderBy('plan.priceMonthly', 'ASC').getMany();
      return res.json(plans);
    } catch (e) {
      console.error('listPlans error:', e);
      return res.status(500).json({ message: 'Failed to list plans' });
    }
  };

  static recommendPlans = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const repo = AppDataSource.getRepository(Plan);
      const country = String((req.query as any)?.country || '').toUpperCase();

      // CRITICAL: Filter by organization_id using queryBuilder
      const queryBuilder = repo.createQueryBuilder('plan')
        .where('plan.organization_id = :tenantId', { tenantId });

      if (country && country !== 'ALL') {
        queryBuilder.andWhere('plan.country = :country', { country });
      }

      const plans = await queryBuilder
        .orderBy('plan.priceMonthly', 'ASC')
        .take(3)
        .getMany();
      return res.json(plans);
    } catch (e) {
      console.error('recommendPlans error:', e);
      return res.status(500).json({ message: 'Failed to recommend plans' });
    }
  };

  static comparePlans = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { planIds = [] } = req.body || {};
      const repo = AppDataSource.getRepository(Plan);
      if (!Array.isArray(planIds) || planIds.length === 0) return res.json([]);

      // CRITICAL: Filter by organization_id AND ensure plans belong to this organization
      const items = await repo.find({
        where: { id: In(planIds), organizationId: tenantId }
      });
      const mapped = items.map(p => ({
        id: p.id,
        name: p.name,
        insurer: p.insurer,
        coverageLevel: p.coverageLevel,
        waitingPeriod: p.waitingPeriod,
        priceMonthly: Number(p.priceMonthly),
        benefits: Array.isArray((p as any).benefits) ? (p as any).benefits : [],
      }));
      return res.json(mapped);
    } catch (e) {
      console.error('comparePlans error:', e);
      return res.status(500).json({ message: 'Failed to compare plans' });
    }
  };

  static calculatePremium = async (req: Request, res: Response) => {
    try {
      const { age = 30, dependents = 0, prevYears = 0 } = req.body || {};
      const a = Number(age) || 0;
      const d = Number(dependents) || 0;
      const base = 50 + Math.max(0, a - 30) * 1.2 + d * 15;
      const loading = a > 34 ? Math.round(base * 0.1) : 0; // LCR placeholder
      const total = Math.round((base + loading) * 100) / 100;
      return res.json({ base, loading, total });
    } catch (e) {
      console.error('calculatePremium error:', e);
      return res.status(500).json({ message: 'Failed to calculate premium' });
    }
  };

  static familyCalc = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Placeholder: return cheapest few plans (optionally filtered by country)
      const repo = AppDataSource.getRepository(Plan);
      const country = String((req.query as any)?.country || '').toUpperCase();

      // CRITICAL: Filter by organization_id using queryBuilder
      const queryBuilder = repo.createQueryBuilder('plan')
        .where('plan.organization_id = :tenantId', { tenantId });

      if (country && country !== 'ALL') {
        queryBuilder.andWhere('plan.country = :country', { country });
      }

      const plans = await queryBuilder
        .orderBy('plan.priceMonthly', 'ASC')
        .take(5)
        .getMany();
      return res.json(plans);
    } catch (e) {
      console.error('familyCalc error:', e);
      return res.status(500).json({ message: 'Failed to compute family packages' });
    }
  };

  static purchase = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!userId) return res.status(401).json({ message: 'Authentication required' });
      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { planId, billingCycle = 'monthly' } = req.body || {};
      if (!planId) return res.status(400).json({ message: 'planId is required' });

      const planRepo = AppDataSource.getRepository(Plan);
      const policyRepo = AppDataSource.getRepository(Policy);

      // CRITICAL: Filter plan by organization_id
      const plan = await planRepo.findOne({
        where: { id: planId, organizationId: tenantId }
      });
      if (!plan) return res.status(404).json({ message: 'Plan not found' });

      const policy = policyRepo.create({
        userId,
        planId,
        billingCycle,
        status: 'active',
        startDate: new Date(),
        organizationId: tenantId
      } as any);
      const saved = await policyRepo.save(policy as any);
      const policyId = Array.isArray(saved) ? (saved[0] as any)?.id : (saved as any)?.id;
      return res.status(201).json({ policyId, documents: [] });
    } catch (e) {
      console.error('purchase error:', e);
      return res.status(500).json({ message: 'Failed to purchase plan' });
    }
  };

  static listMyClaims = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!userId) return res.status(401).json({ message: 'Authentication required' });
      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const repo = AppDataSource.getRepository(Claim);

      // CRITICAL: Filter claims by organizationId
      const claims = await repo.createQueryBuilder('claim')
        .where('claim.userId = :userId', { userId })
        .andWhere('claim.organization_id = :tenantId', { tenantId })
        .orderBy('claim.createdAt', 'DESC')
        .getMany();
      return res.json(claims);
    } catch (e) {
      console.error('listMyClaims error:', e);
      return res.status(500).json({ message: 'Failed to list claims' });
    }
  };

  static myDashboard = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });
      // Placeholder benefit usage
      const benefits = [
        { key: 'gp', label: 'GP Visits', used: 1, total: 6 },
        { key: 'physio', label: 'Physio Sessions', used: 2, total: 8 },
        { key: 'scan', label: 'Scans', used: 0, total: 3 },
      ];
      return res.json({ benefits });
    } catch (e) {
      console.error('myDashboard error:', e);
      return res.status(500).json({ message: 'Failed to fetch dashboard' });
    }
  };
}
