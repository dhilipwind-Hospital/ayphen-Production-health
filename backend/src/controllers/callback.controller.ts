import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { CallbackRequest, CallbackStatus } from '../models/CallbackRequest';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class CallbackController {
  // Get callback queue (dashboard)
  static getQueue = async (req: Request, res: Response) => {
    try {
      const { status, search, limit = 50, offset = 0 } = req.query;

      const repo = AppDataSource.getRepository(CallbackRequest);
      const queryBuilder = repo.createQueryBuilder('callback')
        .leftJoinAndSelect('callback.assignedTo', 'assignedTo')
        .orderBy('callback.createdAt', 'DESC');

      // Filter by status
      if (status && status !== 'all') {
        queryBuilder.andWhere('callback.status = :status', { status });
      }

      // Search by name or phone
      if (search) {
        queryBuilder.andWhere(
          '(callback.name ILIKE :search OR callback.phone ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Pagination
      queryBuilder.skip(Number(offset)).take(Number(limit));

      const [requests, total] = await queryBuilder.getManyAndCount();

      // Calculate waiting times
      const requestsWithMetrics = requests.map(req => ({
        ...req,
        waitingTime: !req.calledAt
          ? Math.round((Date.now() - req.createdAt.getTime()) / 1000 / 60) // minutes
          : null,
        responseTime: req.calledAt
          ? Math.round((req.calledAt.getTime() - req.createdAt.getTime()) / 1000 / 60) // minutes
          : null
      }));

      return res.json({
        data: requestsWithMetrics,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Error fetching callback queue:', error);
      return res.status(500).json({ message: 'Error fetching callback requests' });
    }
  };

  // Get statistics
  static getStatistics = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(CallbackRequest);

      const [
        total,
        pending,
        called,
        completed,
        noAnswer,
        avgResponseTime
      ] = await Promise.all([
        repo.count(),
        repo.count({ where: { status: CallbackStatus.PENDING } }),
        repo.count({ where: { status: CallbackStatus.CALLED } }),
        repo.count({ where: { status: CallbackStatus.COMPLETED } }),
        repo.count({ where: { status: CallbackStatus.NO_ANSWER } }),
        repo.createQueryBuilder('callback')
          .select('AVG(EXTRACT(EPOCH FROM (callback.calledAt - callback.createdAt)))', 'avg')
          .where('callback.calledAt IS NOT NULL')
          .getRawOne()
      ]);

      return res.json({
        total,
        pending,
        called,
        completed,
        noAnswer,
        avgResponseTimeMinutes: avgResponseTime?.avg ? Math.round(avgResponseTime.avg / 60) : null
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json({ message: 'Error fetching statistics' });
    }
  };

  // Assign callback request to staff
  static assignRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }

      const repo = AppDataSource.getRepository(CallbackRequest);
      const userRepo = AppDataSource.getRepository(User);

      const request = await repo.findOne({ where: { id } });
      if (!request) {
        return res.status(404).json({ message: 'Callback request not found' });
      }

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      request.assignedTo = user;
      await repo.save(request);

      const updated = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      return res.json({
        message: 'Callback request assigned successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error assigning request:', error);
      return res.status(500).json({ message: 'Error assigning request' });
    }
  };

  // Update status and add call notes
  static updateStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, callNotes, callOutcome, followUpDate } = req.body;

      if (!status || !Object.values(CallbackStatus).includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }

      const repo = AppDataSource.getRepository(CallbackRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Callback request not found' });
      }

      request.status = status;
      
      if (callNotes) {
        request.callNotes = callNotes;
      }

      if (callOutcome) {
        request.callOutcome = callOutcome;
      }

      if (followUpDate) {
        request.followUpDate = new Date(followUpDate);
      }

      // Set calledAt when status changes to called or completed
      if ((status === CallbackStatus.CALLED || status === CallbackStatus.COMPLETED) && !request.calledAt) {
        request.calledAt = new Date();
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

  // Add call notes
  static addNotes = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ message: 'Notes are required' });
      }

      const repo = AppDataSource.getRepository(CallbackRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Callback request not found' });
      }

      // Append notes with timestamp
      const timestamp = new Date().toISOString();
      const newNote = `[${timestamp}] ${notes}`;
      request.callNotes = request.callNotes 
        ? `${request.callNotes}\n${newNote}`
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

  // Get single callback request
  static getRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const repo = AppDataSource.getRepository(CallbackRequest);
      const request = await repo.findOne({
        where: { id },
        relations: ['assignedTo']
      });

      if (!request) {
        return res.status(404).json({ message: 'Callback request not found' });
      }

      // Calculate metrics
      const waitingTime = !request.calledAt
        ? Math.round((Date.now() - request.createdAt.getTime()) / 1000 / 60)
        : null;
      
      const responseTime = request.calledAt
        ? Math.round((request.calledAt.getTime() - request.createdAt.getTime()) / 1000 / 60)
        : null;

      return res.json({
        data: {
          ...request,
          waitingTime,
          responseTime
        }
      });
    } catch (error) {
      console.error('Error fetching request:', error);
      return res.status(500).json({ message: 'Error fetching request' });
    }
  };

  // Delete callback request
  static deleteRequest = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const repo = AppDataSource.getRepository(CallbackRequest);
      const request = await repo.findOne({ where: { id } });

      if (!request) {
        return res.status(404).json({ message: 'Callback request not found' });
      }

      await repo.remove(request);

      return res.json({
        message: 'Callback request deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      return res.status(500).json({ message: 'Error deleting request' });
    }
  };
}
