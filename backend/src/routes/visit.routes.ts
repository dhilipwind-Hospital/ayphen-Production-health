import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { Visit } from '../models/Visit';
import { QueueItem, QueueStage, QueuePriority, QueueStatus } from '../models/QueueItem';
import { VisitCounter } from '../models/VisitCounter';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

const router = Router();

// Require auth + tenant for all
router.use(authenticate as any);
router.use(tenantContext as any);

const isEnabled = () => String(process.env.ENABLE_QUEUE || 'false').toLowerCase() === 'true';

const yyyymmdd = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const toOrgCode = (sub?: string) => String(sub || 'ORG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const nextNumbers = async (organizationId: string) => {
  const repo = AppDataSource.getRepository(VisitCounter);
  const today = yyyymmdd();
  let counter = await repo.findOne({ where: { organizationId, dateKey: today } });
  if (!counter) {
    counter = repo.create({ organizationId, dateKey: today, nextVisitSeq: 1, nextTokenSeq: 1 });
  }
  const visitSeq = counter.nextVisitSeq;
  const tokenSeq = counter.nextTokenSeq;
  counter.nextVisitSeq = visitSeq + 1;
  counter.nextTokenSeq = tokenSeq + 1;
  await repo.save(counter);
  return { visitSeq, tokenSeq, dateKey: today };
};

router.post('/', async (req, res) => {
  try {
    if (!isEnabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const { patientId, skipTriage = false, priority = 'standard', doctorId } = req.body || {};
    if (!patientId) return res.status(400).json({ message: 'patientId is required' });

    // Accept either a UUID or a display code like PID-<SUB>-<TAIL> or PID-<TAIL>
    const raw = String(patientId).trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let patientUuid = raw;
    if (!uuidRe.test(raw)) {
      // Attempt to parse display code
      // Examples: PID-AYPHEN-ABC123 or PID-ABC123
      const m = /^pid-(?:[a-z0-9]+-)?([a-z0-9]{6,})$/i.exec(raw);
      if (m && m[1]) {
        const tail = m[1].toLowerCase();
        const userRepo = AppDataSource.getRepository(User);
        // Find user in this org whose UUID (without dashes) ends with the tail
        const candidate = await userRepo
          .createQueryBuilder('u')
          .where('u.organization_id = :orgId', { orgId })
          .andWhere("replace(u.id::text, '-', '') ILIKE :pattern", { pattern: `%${tail}` })
          .orderBy('u.createdAt', 'DESC')
          .getOne();
        if (!candidate) {
          return res.status(404).json({ message: 'Patient not found for code' });
        }
        patientUuid = (candidate as any).id;
      } else {
        return res.status(400).json({ message: 'Invalid patient identifier' });
      }
    }

    const { visitSeq, tokenSeq, dateKey } = await nextNumbers(orgId);
    const orgCode = toOrgCode(tenant?.subdomain);
    const visitNumber = `V-${orgCode}-${dateKey.slice(2)}-${String(visitSeq).padStart(4, '0')}`;
    const tokenNumber = `T-${orgCode}-${dateKey.slice(2)}-${String(tokenSeq).padStart(4, '0')}`;

    const visitRepo = AppDataSource.getRepository(Visit);
    const qRepo = AppDataSource.getRepository(QueueItem);

    // Determine visit status and queue stage based on skipTriage flag
    const visitStatus = skipTriage ? 'with_doctor' : 'created';
    const queueStage = skipTriage ? 'doctor' : 'reception';
    const queuePriority = skipTriage ? 'urgent' : priority;

    const visit = visitRepo.create({ organizationId: orgId, patientId: patientUuid, visitNumber, status: visitStatus as any });
    await visitRepo.save(visit);

    const qi1: Partial<QueueItem> = {
      organizationId: orgId,
      visitId: (visit as any).id,
      stage: queueStage as QueueStage,
      priority: queuePriority as QueuePriority,
      tokenNumber,
      status: 'waiting' as QueueStatus,
      assignedDoctorId: skipTriage && doctorId ? doctorId : undefined,
    };
    const queueItem = qRepo.create(qi1);
    await qRepo.save(queueItem);

    return res.json({ success: true, data: { visit, queueItem } });
  } catch (e: any) {
    console.error('POST /api/visits error:', e);
    return res.status(500).json({ message: 'Failed to create visit' });
  }
});

// Skip triage for existing visit
router.patch('/:visitId/skip-triage', async (req, res) => {
  try {
    if (!isEnabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    
    const { visitId } = req.params;
    const { doctorId, priority = 'urgent' } = req.body || {};
    
    const visitRepo = AppDataSource.getRepository(Visit);
    const queueRepo = AppDataSource.getRepository(QueueItem);
    
    // Update visit status
    const visit = await visitRepo.findOne({ where: { id: visitId, organizationId: orgId } });
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    
    visit.status = 'with_doctor' as any;
    await visitRepo.save(visit);
    
    // Update queue item
    const queueItem = await queueRepo.findOne({ where: { visitId, organizationId: orgId } });
    if (queueItem) {
      queueItem.stage = 'doctor';
      queueItem.priority = priority as QueuePriority;
      queueItem.status = 'waiting';
      if (doctorId) queueItem.assignedDoctorId = doctorId;
      await queueRepo.save(queueItem);
    }
    
    return res.json({ success: true, message: 'Patient moved directly to doctor queue', data: { visit, queueItem } });
  } catch (e: any) {
    console.error('PATCH /api/visits/:visitId/skip-triage error:', e);
    return res.status(500).json({ message: 'Failed to skip triage' });
  }
});

router.post('/:id/advance', async (req, res) => {
  try {
    if (!isEnabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    const { id } = req.params;
    const { toStage, doctorId } = req.body || {};
    if (!id || !toStage) return res.status(400).json({ message: 'id and toStage are required' });
    const visitRepo = AppDataSource.getRepository(Visit);
    const qRepo = AppDataSource.getRepository(QueueItem);
    const userRepo = AppDataSource.getRepository(User);

    const visit = await visitRepo.findOne({ where: { id } });
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    // simple state machine
    const nextStatusMap: Record<string, string> = {
      triage: 'triage',
      doctor: 'with_doctor',
      billing: 'awaiting_billing'
    };
    const nextStatus = nextStatusMap[String(toStage)] as any;
    if (!nextStatus) return res.status(400).json({ message: 'Invalid toStage' });

    (visit as any).status = nextStatus;
    await visitRepo.save(visit);

    // Optional: verify doctor belongs to org and is active when assigning to doctor stage
    let assignDoctorId: string | undefined;
    if (String(toStage) === 'doctor' && doctorId) {
      const doc = await userRepo.createQueryBuilder('u')
        .where('u.id = :id', { id: String(doctorId) })
        .andWhere('u.organization_id = :orgId', { orgId })
        .andWhere('u.role = :role', { role: UserRole.DOCTOR })
        .andWhere('u.isActive = true')
        .getOne();
      if (doc) assignDoctorId = (doc as any).id;
    }

    // generate a new token for next stage
    const { tokenSeq, dateKey } = await nextNumbers(orgId);
    const orgCode = toOrgCode(tenant?.subdomain);
    const tokenNumber = `T-${orgCode}-${dateKey.slice(2)}-${String(tokenSeq).padStart(4, '0')}`;

    const qi2: Partial<QueueItem> = {
      organizationId: orgId,
      visitId: id,
      stage: String(toStage) as QueueStage,
      priority: 'standard' as QueuePriority,
      tokenNumber,
      status: 'waiting' as QueueStatus,
    };
    if (assignDoctorId) (qi2 as any).assignedDoctorId = assignDoctorId;
    const queueItem = qRepo.create(qi2);
    await qRepo.save(queueItem);

    return res.json({ success: true, data: { visit, queueItem } });
  } catch (e: any) {
    console.error('POST /api/visits/:id/advance error:', e);
    return res.status(500).json({ message: 'Failed to advance visit' });
  }
});

// List available doctors for this organization (minimal fields)
router.get('/available-doctors', async (req, res) => {
  try {
    if (!isEnabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organization_id;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const userRepo = AppDataSource.getRepository(User);
    // Use leftJoinAndSelect to return nested department objects for proper filtering
    const doctors = await userRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.department','department')
      .where('u.organization_id = :orgId', { orgId })
      .andWhere('u.role = :role', { role: UserRole.DOCTOR })
      .andWhere('u.isActive = true')
      .select([
        'u.id',
        'u.firstName',
        'u.lastName',
        'u.email',
        'u.specialization',
        'u.consultationFee',
        'u.experience',
        'department.id',
        'department.name'
      ])
      .orderBy('u.firstName','ASC')
      .addOrderBy('u.lastName','ASC')
      .getMany();
    return res.json({ success: true, data: doctors });
  } catch (e) {
    console.error('GET /api/visits/available-doctors error:', e);
    return res.status(500).json({ message: 'Failed to load doctors' });
  }
});

export default router;
