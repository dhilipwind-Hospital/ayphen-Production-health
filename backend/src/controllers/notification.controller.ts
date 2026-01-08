import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class NotificationController {
  // Get user's notifications
  static getMyNotifications = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;
      const { unreadOnly, limit = 50, offset = 0 } = req.query;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const repo = AppDataSource.getRepository(Notification);
      const queryBuilder = repo.createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId })
        .andWhere('notification.organization_id = :tenantId', { tenantId })
        .orderBy('notification.createdAt', 'DESC')
        .skip(Number(offset))
        .take(Number(limit));

      if (unreadOnly === 'true') {
        queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
      }

      const [notifications, total] = await queryBuilder.getManyAndCount();
      const unreadCount = await repo.count({
        where: { user: { id: userId }, isRead: false }
      });

      return res.json({
        data: notifications,
        total,
        unreadCount,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Error fetching notifications' });
    }
  };

  // Mark notification as read
  static markAsRead = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const repo = AppDataSource.getRepository(Notification);
      const notification = await repo.findOne({
        where: { id },
        relations: ['user']
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      if (notification.user.id !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await repo.save(notification);

      return res.json({
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ message: 'Error updating notification' });
    }
  };

  // Mark all as read
  static markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const repo = AppDataSource.getRepository(Notification);
      await repo.createQueryBuilder()
        .update(Notification)
        .set({ isRead: true, readAt: new Date() })
        .where('userId = :userId AND isRead = :isRead', { userId, isRead: false })
        .execute();

      return res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      return res.status(500).json({ message: 'Error updating notifications' });
    }
  };

  // Delete notification
  static deleteNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const repo = AppDataSource.getRepository(Notification);
      const notification = await repo.findOne({
        where: { id },
        relations: ['user']
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      if (notification.user.id !== userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      await repo.remove(notification);

      return res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ message: 'Error deleting notification' });
    }
  };

  // Get unread count
  static getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const repo = AppDataSource.getRepository(Notification);
      const count = await repo.count({
        where: { user: { id: userId }, isRead: false }
      });

      return res.json({ count });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return res.status(500).json({ message: 'Error fetching count' });
    }
  };

  // Create notification (internal use by other controllers)
  static createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      metadata?: any;
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => {
    try {
      const repo = AppDataSource.getRepository(Notification);
      const userRepo = AppDataSource.getRepository(User);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        console.error('User not found for notification:', userId);
        return null;
      }

      const notification = repo.create({
        user,
        type,
        title,
        message,
        priority: options?.priority || NotificationPriority.MEDIUM,
        metadata: options?.metadata,
        actionUrl: options?.actionUrl,
        actionLabel: options?.actionLabel
      });

      await repo.save(notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  };

  // Broadcast notification to multiple users
  static broadcastNotification = async (
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      metadata?: any;
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => {
    try {
      const repo = AppDataSource.getRepository(Notification);
      const userRepo = AppDataSource.getRepository(User);

      const users = await userRepo.findByIds(userIds);
      
      const notifications = users.map(user => 
        repo.create({
          user,
          type,
          title,
          message,
          priority: options?.priority || NotificationPriority.MEDIUM,
          metadata: options?.metadata,
          actionUrl: options?.actionUrl,
          actionLabel: options?.actionLabel
        })
      );

      await repo.save(notifications);
      return notifications;
    } catch (error) {
      console.error('Error broadcasting notifications:', error);
      return [];
    }
  };

  // Admin: Send system announcement
  static sendAnnouncement = async (req: Request, res: Response) => {
    try {
      const { title, message, targetRoles, priority } = req.body;

      if (!title || !message) {
        return res.status(400).json({ message: 'Title and message are required' });
      }

      const userRepo = AppDataSource.getRepository(User);
      let users: User[];

      if (targetRoles && targetRoles.length > 0) {
        users = await userRepo.createQueryBuilder('user')
          .where('user.role IN (:...roles)', { roles: targetRoles })
          .andWhere('user.isActive = :isActive', { isActive: true })
          .getMany();
      } else {
        users = await userRepo.find({ where: { isActive: true } });
      }

      const userIds = users.map(u => u.id);
      await NotificationController.broadcastNotification(
        userIds,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        { priority: priority || NotificationPriority.MEDIUM }
      );

      return res.json({
        message: 'Announcement sent successfully',
        recipientCount: userIds.length
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      return res.status(500).json({ message: 'Error sending announcement' });
    }
  };
}
