import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Feedback, FeedbackType, FeedbackStatus } from '../models/Feedback';
import { User } from '../models/User';

export class FeedbackController {
  // Submit feedback
  static submitFeedback = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { type, subject, message, rating } = req.body;

      if (!type || !subject || !message) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      const feedbackRepo = AppDataSource.getRepository(Feedback);
      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter user by organizationId
      const foundUser = await userRepo.findOne({ where: { id: userId, organizationId: tenantId } });
      if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const feedback = feedbackRepo.create({
        user: foundUser,
        type,
        subject,
        message,
        rating: rating || null,
        organizationId: tenantId
      });

      await feedbackRepo.save(feedback);

      return res.status(201).json({
        message: 'Feedback submitted successfully',
        data: feedback
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({ message: 'Error submitting feedback' });
    }
  };

  // Get all feedback
  static getAllFeedback = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { type, status } = req.query;
      const feedbackRepo = AppDataSource.getRepository(Feedback);

      // CRITICAL: Filter by organization_id using queryBuilder
      const queryBuilder = feedbackRepo.createQueryBuilder('feedback')
        .leftJoinAndSelect('feedback.user', 'user')
        .leftJoinAndSelect('feedback.respondedBy', 'respondedBy')
        .where('feedback.organization_id = :tenantId', { tenantId })
        .orderBy('feedback.createdAt', 'DESC');

      if (type) {
        queryBuilder.andWhere('feedback.type = :type', { type });
      }

      if (status) {
        queryBuilder.andWhere('feedback.status = :status', { status });
      }

      const feedback = await queryBuilder.getMany();

      return res.json({
        data: feedback,
        total: feedback.length
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return res.status(500).json({ message: 'Error fetching feedback' });
    }
  };

  // Get user feedback
  static getUserFeedback = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(Feedback);

      // CRITICAL: Filter by organizationId using queryBuilder
      const feedback = await feedbackRepo.createQueryBuilder('feedback')
        .leftJoinAndSelect('feedback.user', 'user')
        .leftJoinAndSelect('feedback.respondedBy', 'respondedBy')
        .where('feedback.user.id = :userId', { userId })
        .andWhere('feedback.organization_id = :tenantId', { tenantId })
        .orderBy('feedback.createdAt', 'DESC')
        .getMany();

      return res.json({
        data: feedback,
        total: feedback.length
      });
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      return res.status(500).json({ message: 'Error fetching user feedback' });
    }
  };

  // Get feedback by ID
  static getFeedback = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(Feedback);

      // CRITICAL: Filter by organization_id using queryBuilder
      const feedback = await feedbackRepo.createQueryBuilder('feedback')
        .leftJoinAndSelect('feedback.user', 'user')
        .leftJoinAndSelect('feedback.respondedBy', 'respondedBy')
        .where('feedback.id = :id', { id })
        .andWhere('feedback.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      return res.json({ data: feedback });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return res.status(500).json({ message: 'Error fetching feedback' });
    }
  };

  // Respond to feedback
  static respondToFeedback = async (req: Request, res: Response) => {
    try {
      const responderId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const { response } = req.body;

      if (!response) {
        return res.status(400).json({ message: 'Response is required' });
      }

      const feedbackRepo = AppDataSource.getRepository(Feedback);
      const userRepo = AppDataSource.getRepository(User);

      // CRITICAL: Filter feedback by organization_id
      const feedback = await feedbackRepo.findOne({
        where: { id, organizationId: tenantId }
      });
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      // CRITICAL: Filter responder by organization_id
      const responder = await userRepo.findOne({
        where: { id: responderId, organizationId: tenantId }
      });
      if (!responder) {
        return res.status(404).json({ message: 'Responder not found' });
      }

      feedback.response = response;
      feedback.respondedBy = responder;
      feedback.respondedAt = new Date();
      feedback.status = FeedbackStatus.REVIEWED;

      await feedbackRepo.save(feedback);

      return res.json({
        message: 'Response added successfully',
        data: feedback
      });
    } catch (error) {
      console.error('Error responding to feedback:', error);
      return res.status(500).json({ message: 'Error responding to feedback' });
    }
  };

  // Update feedback status
  static updateStatus = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      const feedbackRepo = AppDataSource.getRepository(Feedback);

      // CRITICAL: Filter feedback by organization_id
      const feedback = await feedbackRepo.findOne({
        where: { id, organizationId: tenantId }
      });
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }

      feedback.status = status;
      await feedbackRepo.save(feedback);

      return res.json({
        message: 'Status updated successfully',
        data: feedback
      });
    } catch (error) {
      console.error('Error updating status:', error);
      return res.status(500).json({ message: 'Error updating status' });
    }
  };

  // Get feedback statistics
  static getStatistics = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const feedbackRepo = AppDataSource.getRepository(Feedback);

      // CRITICAL: All counts must filter by organization_id
      const [
        total,
        pending,
        reviewed,
        resolved,
        avgRating
      ] = await Promise.all([
        feedbackRepo.count({ where: { organizationId: tenantId } }),
        feedbackRepo.count({ where: { status: FeedbackStatus.PENDING, organizationId: tenantId } }),
        feedbackRepo.count({ where: { status: FeedbackStatus.REVIEWED, organizationId: tenantId } }),
        feedbackRepo.count({ where: { status: FeedbackStatus.RESOLVED, organizationId: tenantId } }),
        feedbackRepo.createQueryBuilder('feedback')
          .select('AVG(feedback.rating)', 'avg')
          .where('feedback.rating IS NOT NULL')
          .andWhere('feedback.organization_id = :tenantId', { tenantId })
          .getRawOne()
      ]);

      return res.json({
        data: {
          total,
          pending,
          reviewed,
          resolved,
          averageRating: avgRating?.avg ? parseFloat(avgRating.avg).toFixed(2) : null
        }
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json({ message: 'Error fetching statistics' });
    }
  };
}
