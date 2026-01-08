import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { EmergencyRequest, EmergencyStatus, EmergencyPriority } from '../models/EmergencyRequest';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class EmergencyController {
  // Get all emergency requests (dashboard)
  static getDashboard = async (req: Request, res: Response) => {
    try {
      const { status, priority, search, limit = 50, offset = 0 } = req.query;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const queryBuilder = repo.createQueryBuilder('emergency')
        .leftJoinAndSelect('emergency.assignedTo', 'assignedTo')
        .where('emergency.organization_id = :tenantId', { tenantId })
        .orderBy('emergency.createdAt', 'DESC');

      // Filter by status
      if (status && status !== 'all') {
        queryBuilder.andWhere('emergency.status = :status', { status });
      }

      // Filter by priority
      if (priority && priority !== 'all') {
        queryBuilder.andWhere('emergency.priority = :priority', { priority });
      }

      // Search by name or phone
      if (search) {
        queryBuilder.andWhere(
          '(emergency.name ILIKE :search OR emergency.phone ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Pagination
      queryBuilder.skip(Number(offset)).take(Number(limit));

      const [requests, total] = await queryBuilder.getManyAndCount();

      // Calculate response times
      const requestsWithMetrics = requests.map(req => ({
        ...req,
        responseTime: req.respondedAt 
          ? Math.round((req.respondedAt.getTime() - req.createdAt.getTime()) / 1000 / 60) // minutes
          : null,
        waitingTime: !req.respondedAt
          ? Math.round((Date.now() - req.createdAt.getTime()) / 1000 / 60) // minutes
          : null
      }));

      return res.json({
        data: requestsWithMetrics,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Error fetching emergency dashboard:', error);
      return res.status(500).json({ message: 'Error fetching emergency requests' });
    }
  };

  // Get statistics
  static getStatistics = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(EmergencyRequest);

      const [
        total,
        pending,
        inProgress,
        resolved,
        critical,
        avgResponseTime
      ] = await Promise.all([
        repo.count(),
        repo.count({ where: { status: EmergencyStatus.PENDING } }),
        repo.count({ where: { status: EmergencyStatus.IN_PROGRESS } }),
        repo.count({ where: { status: EmergencyStatus.RESOLVED } }),
        repo.count({ where: { priority: EmergencyPriority.CRITICAL } }),
        repo.createQueryBuilder('emergency')
          .select('AVG(EXTRACT(EPOCH FROM (emergency.respondedAt - emergency.createdAt)))', 'avg')
          .where('emergency.respondedAt IS NOT NULL')
          .getRawOne()
      ]);

      return res.json({
        total,
        pending,
        inProgress,
        resolved,
        critical,
        avgResponseTimeMinutes: avgResponseTime?.avg ? Math.round(avgResponseTime.avg / 60) : null
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json({ message: 'Error fetching statistics' });
    }
  };

  // Assign emergency request to staff
  static assignRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const userRepo = AppDataSource.getRepository(User);

      const request = await repo.findOne({ where: { id } });
      if (!request) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      request.assignedTo = user;
      if (request.status === EmergencyStatus.PENDING) {
        request.status = EmergencyStatus.IN_PROGRESS;
      }

      await repo.save(request);

      const updated = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      return res.json({
        message: 'Emergency request assigned successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error assigning request:', error);
      return res.status(500).json({ message: 'Error assigning request' });
    }
  };

  // Update status
  static updateStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, responseNotes } = req.body;

      if (!status || !Object.values(EmergencyStatus).includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      request.status = status;
      
      if (responseNotes) {
        request.responseNotes = responseNotes;
      }

      // Set respondedAt when moving to in_progress or resolved
      if ((status === EmergencyStatus.IN_PROGRESS || status === EmergencyStatus.RESOLVED) && !request.respondedAt) {
        request.respondedAt = new Date();
      }

      await repo.save(request);

      const updated = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      return res.json({
        message: 'Status updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ message: 'Error updating status' });
    }
  };

  // Update priority
  static updatePriority = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      if (!priority || !Object.values(EmergencyPriority).includes(priority)) {
        return res.status(400).json({ message: 'Valid priority is required' });
      }

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      request.priority = priority;
      await repo.save(request);

      const updated = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      return res.json({
        message: 'Priority updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      return res.status(500).json({ message: 'Error updating priority' });
    }
  };

  // Add response notes
  static addNotes = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ message: 'Notes are required' });
      }

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      // Append notes with timestamp
      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] ${notes}`;
      request.responseNotes = request.responseNotes 
        ? `${request.responseNotes}\n${newNote}`
        : newNote;

      await repo.save(request);

      const updated = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      return res.json({
        message: 'Notes added successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error adding notes:', error);
      return res.status(500).json({ message: 'Error adding notes' });
    }
  };

  // Get single emergency request
  static getRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const request = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      if (!request) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      // Calculate metrics
      const responseTime = request.respondedAt 
        ? Math.round((request.respondedAt.getTime() - request.createdAt.getTime()) / 1000 / 60)
        : null;
      
      const waitingTime = !request.respondedAt
        ? Math.round((Date.now() - request.createdAt.getTime()) / 1000 / 60)
        : null;

      return res.json({
        data: {
          ...request,
          responseTime,
          waitingTime
        }
      });
    } catch (error) {
      console.error('Error fetching request:', error);
      return res.status(500).json({ message: 'Error fetching request' });
    }
  };

  // Delete emergency request
  static deleteRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const repo = AppDataSource.getRepository(EmergencyRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Emergency request not found' });
      }

      await repo.remove(request);

      return res.json({
        message: 'Emergency request deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      return res.status(500).json({ message: 'Error deleting request' });
    }
  };
}
