import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Service } from '../models/Service';
import { Department } from '../models/Department';

export class ServiceController {
  // Get all services with optional search and filters
  static listAll = async (req: Request, res: Response) => {
    const serviceRepository = AppDataSource.getRepository(Service);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const { search, department, status, departmentId, isActive } = req.query as any;
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10), 1), 100);

    try {
      const query = serviceRepository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.department', 'department');

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        query.where('service.organization_id = :tenantId', { tenantId });
      } else {
        // If no tenant context, return empty result to prevent data leakage
        return res.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
      }

      // Apply search filter
      if (search) {
        const condition = '(LOWER(service.name) LIKE :search OR LOWER(service.description) LIKE :search)';
        if (tenantId) {
          query.andWhere(condition, { search: `%${String(search).toLowerCase()}%` });
        } else {
          query.where(condition, { search: `%${String(search).toLowerCase()}%` });
        }
      }

      // Apply department filter (support both department and departmentId)
      const deptId = department || departmentId;
      if (deptId) {
        query.andWhere('department.id = :deptId', { deptId });
      }

      // Apply status/isActive filter - default to showing only active services
      if (typeof status !== 'undefined') {
        query.andWhere('service.status = :status', { status });
      } else if (typeof isActive !== 'undefined') {
        // Service entity does not have an 'isActive' column; map to status
        const active = String(isActive) === 'true';
        if (active) {
          query.andWhere('service.status = :activeStatus', { activeStatus: 'active' });
        } else {
          query.andWhere('service.status != :activeStatus', { activeStatus: 'active' });
        }
      } else {
        // Default: only show active services
        query.andWhere('service.status = :activeStatus', { activeStatus: 'active' });
      }

      const [items, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const meta = { total, page, limit, totalPages: Math.ceil(total / limit) };
      return res.json({ data: items, meta });
    } catch (error) {
      console.error('Error fetching services:', error);
      return res.status(500).json({ message: 'Error fetching services' });
    }
  };

  // Stats: count services grouped by department
  static statsByDepartment = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(Service);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;

    try {
      const qb = repo.createQueryBuilder('s')
        .leftJoin('s.department', 'd')
        .select('d.id', 'departmentId')
        .addSelect('d.name', 'departmentName')
        .addSelect('COUNT(s.id)', 'count');

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        qb.where('s.organization_id = :tenantId', { tenantId });
      }

      const rows = await qb
        .groupBy('d.id')
        .addGroupBy('d.name')
        .orderBy('d.name', 'ASC')
        .getRawMany();

      const total = rows.reduce((acc, r) => acc + Number(r.count || 0), 0);
      return res.json({ data: rows.map(r => ({
        departmentId: r.departmentId || null,
        departmentName: r.departmentName || 'Unassigned',
        count: Number(r.count || 0),
      })), meta: { total } });
    } catch (e) {
      console.error('statsByDepartment error:', e);
      return res.status(500).json({ message: 'Failed to compute stats' });
    }
  };

  // Get service by ID
  static getOneById = async (req: Request, res: Response) => {
    const serviceRepository = AppDataSource.getRepository(Service);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const id = req.params.id;

    try {
      const where: any = { id };

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        where.organizationId = tenantId;
      }

      const service = await serviceRepository.findOne({
        where,
        relations: ['department']
      });

      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      return res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      return res.status(500).json({ message: 'Error fetching service' });
    }
  };

  // Get services by department
  static getByDepartment = async (req: Request, res: Response) => {
    const serviceRepository = AppDataSource.getRepository(Service);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const departmentId = req.params.departmentId;

    try {
      const where: any = { department: { id: departmentId } };

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        where.organizationId = tenantId;
      }

      const services = await serviceRepository.find({
        where,
        relations: ['department']
      });

      return res.json(services);
    } catch (error) {
      console.error('Error fetching services by department:', error);
      return res.status(500).json({ message: 'Error fetching services by department' });
    }
  };

  // Search services
  static search = async (req: Request, res: Response) => {
    const serviceRepository = AppDataSource.getRepository(Service);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    try {
      const qb = serviceRepository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.department', 'department')
        .where(
          'LOWER(service.name) LIKE :query OR LOWER(service.description) LIKE :query',
          { query: `%${query.toString().toLowerCase()}%` }
        );

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        qb.andWhere('service.organization_id = :tenantId', { tenantId });
      }

      const services = await qb.getMany();

      return res.json(services);
    } catch (error) {
      console.error('Error searching services:', error);
      return res.status(500).json({ message: 'Error searching services' });
    }
  };

  // Admin: create service
  static create = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(Service);
    const deptRepo = AppDataSource.getRepository(Department);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const { name, description, departmentId, status, averageDuration } = req.body || {};
    try {
      if (!name) return res.status(400).json({ message: 'Name is required' });
      let department: Department | null = null as any;
      if (departmentId) {
        department = await deptRepo.findOne({ where: { id: departmentId } }) as any;
        if (!department) return res.status(400).json({ message: 'Invalid departmentId' });
      }
      const entity = repo.create({
        name,
        description,
        status: status || 'active',
        averageDuration,
        department: department || undefined,
        departmentId: department?.id,
        organizationId: tenantId // Set organization_id
      } as any);
      const saved = await repo.save(entity as any);
      const savedEntity: any = Array.isArray(saved) ? saved[0] : saved;
      const withDept = await repo.findOne({ where: { id: savedEntity.id }, relations: ['department'] });
      return res.status(201).json(withDept);
    } catch (e) {
      console.error('Error creating service:', e);
      return res.status(500).json({ message: 'Error creating service' });
    }
  };

  // Admin: update service
  static update = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(Service);
    const deptRepo = AppDataSource.getRepository(Department);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const { id } = req.params;
    const { name, description, departmentId, status, averageDuration } = req.body || {};
    try {
      const where: any = { id };

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        where.organizationId = tenantId;
      }

      const svc = await repo.findOne({ where, relations: ['department'] });
      if (!svc) return res.status(404).json({ message: 'Service not found' });
      if (typeof name !== 'undefined') svc.name = name;
      if (typeof description !== 'undefined') svc.description = description;
      if (typeof status !== 'undefined') (svc as any).status = status;
      if (typeof averageDuration !== 'undefined') (svc as any).averageDuration = averageDuration;
      if (typeof departmentId !== 'undefined') {
        if (departmentId) {
          const dept = await deptRepo.findOne({ where: { id: departmentId } });
          if (!dept) return res.status(400).json({ message: 'Invalid departmentId' });
          (svc as any).department = dept;
          (svc as any).departmentId = (dept as any).id;
        } else {
          (svc as any).department = null;
          (svc as any).departmentId = null;
        }
      }
      await repo.save(svc);
      const updated = await repo.findOne({ where: { id }, relations: ['department'] });
      return res.json(updated);
    } catch (e) {
      console.error('Error updating service:', e);
      return res.status(500).json({ message: 'Error updating service' });
    }
  };

  // Admin: set status (activate/deactivate)
  static setStatus = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(Service);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });
    try {
      const where: any = { id };

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        where.organizationId = tenantId;
      }

      const svc = await repo.findOne({ where });
      if (!svc) return res.status(404).json({ message: 'Service not found' });
      (svc as any).status = status;
      await repo.save(svc);
      return res.json({ message: 'Status updated' });
    } catch (e) {
      console.error('Error updating service status:', e);
      return res.status(500).json({ message: 'Error updating service status' });
    }
  };
}
