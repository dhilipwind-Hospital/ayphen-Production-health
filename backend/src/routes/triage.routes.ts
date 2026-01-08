import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { Triage } from '../models/Triage';

const router = Router();
router.use(authenticate as any);
router.use(tenantContext as any);

const enabled = () => String(process.env.ENABLE_TRIAGE || 'false').toLowerCase() === 'true';

// Upsert triage by visit
router.patch('/:visitId', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Triage module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const { visitId } = req.params;
    const { vitals, symptoms, allergies, currentMeds, painScale, priority, notes } = req.body || {};
    if (!visitId) return res.status(400).json({ message: 'visitId is required' });
    const repo = AppDataSource.getRepository(Triage);
    let t = await repo.findOne({ where: { visitId, organizationId: orgId } });
    if (!t) {
      t = repo.create({ visitId, organizationId: orgId });
    }
    (t as any).vitals = vitals ?? (t as any).vitals;
    (t as any).symptoms = symptoms ?? (t as any).symptoms;
    (t as any).allergies = allergies ?? (t as any).allergies;
    (t as any).currentMeds = currentMeds ?? (t as any).currentMeds;
    (t as any).painScale = painScale ?? (t as any).painScale;
    (t as any).priority = priority ?? (t as any).priority;
    (t as any).notes = notes ?? (t as any).notes;
    await repo.save(t);
    return res.json({ success: true, data: t });
  } catch (e) {
    console.error('PATCH /api/triage/:visitId error:', e);
    return res.status(500).json({ message: 'Failed to save triage' });
  }
});

// Get triage by visit
router.get('/:visitId', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Triage module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const { visitId } = req.params;
    const repo = AppDataSource.getRepository(Triage);
    const t = await repo.findOne({ where: { visitId, organizationId: orgId } });
    return res.json({ success: true, data: t || null });
  } catch (e) {
    console.error('GET /api/triage/:visitId error:', e);
    return res.status(500).json({ message: 'Failed to get triage' });
  }
});

export default router;
