import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { QueueItem } from '../models/QueueItem';

const router = Router();
router.use(authenticate as any);
router.use(tenantContext as any);

const enabled = () => String(process.env.ENABLE_QUEUE || 'false').toLowerCase() === 'true';
const tvEnabled = () => String(process.env.ENABLE_TV_DISPLAY || process.env.ENABLE_QUEUE || 'false').toLowerCase() === 'true';

// GET /api/queue?stage=triage|doctor&doctorId=
router.get('/', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const stage = String(req.query.stage || '').toLowerCase();
    const doctorId = String(req.query.doctorId || '') || undefined;
    if (!stage) return res.status(400).json({ message: 'stage is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const qb = repo.createQueryBuilder('q')
      .where('q.organization_id = :orgId', { orgId })
      .andWhere('q.stage = :stage', { stage })
      .andWhere('q.status IN (:...st)', { st: ['waiting', 'called'] })
      .orderBy('q.priority = :emergency', 'DESC')
      .addOrderBy('q.priority = :urgent', 'DESC')
      .addOrderBy('q.created_at', 'ASC')
      .setParameters({ emergency: 'emergency', urgent: 'urgent' });
    // Join visit and patient to expose patient name for UI
    qb.leftJoinAndSelect('q.visit', 'v')
      .leftJoinAndSelect('v.patient', 'p');
    if (stage === 'doctor' && doctorId) {
      qb.andWhere('(q.assigned_doctor_id IS NULL OR q.assigned_doctor_id = :doc)', { doc: doctorId });
    }
    const items = await qb.getMany();
    return res.json({ success: true, data: items });
  } catch (e) {
    console.error('GET /api/queue error:', e);
    return res.status(500).json({ message: 'Failed to fetch queue' });
  }
});

// POST /api/queue/call-next?stage=triage|doctor&doctorId=
router.post('/call-next', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const stage = String(req.query.stage || '').toLowerCase();
    const doctorId = String(req.query.doctorId || '') || undefined;
    if (!stage) return res.status(400).json({ message: 'stage is required' });

    console.log('[Queue] call-next start', { orgId, stage, doctorId });
    const result = await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(QueueItem);
      // 1) Pick next waiting id (ordered by priority then created_at)
      const next = await repo.createQueryBuilder('q')
        .select(['q.id'])
        .where('q.organization_id = :orgId', { orgId })
        .andWhere('q.stage = :stage', { stage })
        .andWhere('q.status = :waiting', { waiting: 'waiting' })
        .orderBy('q.priority = :emergency', 'DESC')
        .addOrderBy('q.priority = :urgent', 'DESC')
        .addOrderBy('q.created_at', 'ASC')
        .setParameters({ emergency: 'emergency', urgent: 'urgent' })
        .getOne();

      if (!next) return null;
      console.log('[Queue] call-next picked', { id: (next as any).id });

      // 2) Atomic conditional update to transition waiting -> called
      const payload: any = { status: 'called' };
      if (stage === 'doctor' && doctorId) payload.assignedDoctorId = doctorId;

      const upd = await manager.createQueryBuilder()
        .update(QueueItem)
        .set(payload)
        .where('id = :id', { id: (next as any).id })
        .andWhere('organization_id = :orgId', { orgId })
        .andWhere('stage = :stage', { stage })
        .andWhere('status = :waiting', { waiting: 'waiting' })
        .returning(['id','organization_id','visit_id','stage','priority','token_number','assigned_doctor_id','status','created_at','updated_at'])
        .execute();

      const row = (upd.raw && upd.raw[0]) || null;
      if (!row) return null;
      console.log('[Queue] call-next updated', { id: row.id, status: row.status });
      // Fetch as entity to ensure camelCase fields (tokenNumber, visitId) for frontend
      const entity = await repo.findOne({ where: { id: row.id } });
      return entity as any;
    });

    if (!result) return res.json({ success: true, data: null, message: 'No items' });
    return res.json({ success: true, data: result });
  } catch (e) {
    console.error('POST /api/queue/call-next error:', (e as any)?.message || e);
    return res.status(500).json({ message: 'Failed to call next' });
  }
});

// POST /api/queue/:id/serve -> mark queue item served
router.post('/:id/serve', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const item = await repo.findOne({ where: { id } });
    if (!item || (item as any).organizationId !== orgId) return res.status(404).json({ message: 'Queue item not found' });
    (item as any).status = 'served';
    await repo.save(item);
    return res.json({ success: true, data: item });
  } catch (e) {
    console.error('POST /api/queue/:id/serve error:', e);
    return res.status(500).json({ message: 'Failed to mark served' });
  }
});

// POST /api/queue/:id/skip -> mark queue item skipped
router.post('/:id/skip', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const item = await repo.findOne({ where: { id } });
    if (!item || (item as any).organizationId !== orgId) return res.status(404).json({ message: 'Queue item not found' });
    (item as any).status = 'skipped';
    await repo.save(item);
    return res.json({ success: true, data: item });
  } catch (e) {
    console.error('POST /api/queue/:id/skip error:', e);
    return res.status(500).json({ message: 'Failed to mark skipped' });
  }
});

// GET /api/queue/board?stage=triage|doctor (for TV display)
router.get('/board', async (req, res) => {
  try {
    if (!tvEnabled()) return res.status(404).json({ message: 'TV display disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    const stage = String(req.query.stage || '').toLowerCase();
    if (!stage) return res.status(400).json({ message: 'stage is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const items = await repo.createQueryBuilder('q')
      .where('q.organization_id = :orgId', { orgId })
      .andWhere('q.stage = :stage', { stage })
      .andWhere('q.status IN (:...st)', { st: ['waiting', 'called'] })
      .orderBy('q.priority = :emergency', 'DESC')
      .addOrderBy('q.priority = :urgent', 'DESC')
      .addOrderBy('q.created_at', 'ASC')
      .setParameters({ emergency: 'emergency', urgent: 'urgent' })
      .getMany();
    return res.json({ success: true, data: items });
  } catch (e) {
    console.error('GET /api/queue/board error:', e);
    return res.status(500).json({ message: 'Failed to fetch queue board' });
  }
});

// POST /api/queue/:id/call -> mark queue item as called (explicit selection)
router.post('/:id/call', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    // Update atomically and return row
    const upd = await AppDataSource.createQueryBuilder()
      .update(QueueItem)
      .set({ status: 'called' } as any)
      .where('id = :id', { id })
      .andWhere('organization_id = :orgId', { orgId })
      .returning(['id','organization_id','visit_id','stage','priority','token_number','assigned_doctor_id','status','created_at','updated_at'])
      .execute();
    const row = (upd.raw && upd.raw[0]) || null;
    if (!row) return res.status(404).json({ message: 'Queue item not found' });
    const entity = await repo.findOne({ where: { id: row.id } });
    return res.json({ success: true, data: entity });
  } catch (e) {
    console.error('POST /api/queue/:id/call error:', e);
    return res.status(500).json({ message: 'Failed to mark called' });
  }
});

export default router;
