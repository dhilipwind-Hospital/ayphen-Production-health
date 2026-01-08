import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Message, MessageStatus } from '../models/Message';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class MessagingController {
  // Send message
  static sendMessage = async (req: Request, res: Response) => {
    try {
      const senderId = (req as any).user?.id;
      const { recipientId, content, subject, attachmentUrl } = req.body;

      if (!recipientId || !content) {
        return res.status(400).json({ message: 'Recipient and content are required' });
      }

      const messageRepo = AppDataSource.getRepository(Message);
      const userRepo = AppDataSource.getRepository(User);

      const sender = await userRepo.findOne({ where: { id: senderId } });
      const recipient = await userRepo.findOne({ where: { id: recipientId } });

      if (!sender || !recipient) {
        return res.status(404).json({ message: 'User not found' });
      }

      const message = messageRepo.create({
        sender,
        recipient,
        content,
        subject,
        attachmentUrl,
        status: MessageStatus.SENT
      });

      await messageRepo.save(message);

      // TODO: Send notification to recipient
      // await NotificationService.sendMessageNotification(recipient, sender, message);

      return res.status(201).json({
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ message: 'Error sending message' });
    }
  };

  // Get conversations
  static getConversations = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const messageRepo = AppDataSource.getRepository(Message);

      // Get unique conversation partners
      const sentMessages = await messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.recipient', 'recipient')
        .where('message.senderId = :userId', { userId })
        .select(['message.recipientId', 'recipient'])
        .distinct(true)
        .getMany();

      const receivedMessages = await messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .where('message.recipientId = :userId', { userId })
        .select(['message.senderId', 'sender'])
        .distinct(true)
        .getMany();

      // Combine and get unique users
      const conversationPartners = new Map();
      
      sentMessages.forEach(msg => {
        if (msg.recipient) {
          conversationPartners.set(msg.recipient.id, msg.recipient);
        }
      });

      receivedMessages.forEach(msg => {
        if (msg.sender) {
          conversationPartners.set(msg.sender.id, msg.sender);
        }
      });

      const conversations = Array.from(conversationPartners.values());

      return res.json({
        data: conversations,
        total: conversations.length
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ message: 'Error fetching conversations' });
    }
  };

  // Get messages with specific user
  static getMessages = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { otherUserId } = req.params;
      const { limit = 50 } = req.query;

      const messageRepo = AppDataSource.getRepository(Message);

      const messages = await messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.recipient', 'recipient')
        .where(
          '(message.senderId = :userId AND message.recipientId = :otherUserId) OR (message.senderId = :otherUserId AND message.recipientId = :userId)',
          { userId, otherUserId }
        )
        .orderBy('message.createdAt', 'DESC')
        .take(Number(limit))
        .getMany();

      return res.json({
        data: messages.reverse(),
        total: messages.length
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ message: 'Error fetching messages' });
    }
  };

  // Mark message as read
  static markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const messageRepo = AppDataSource.getRepository(Message);

      const message = await messageRepo.findOne({
        where: { id },
        relations: ['recipient']
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (message.recipient.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      message.isRead = true;
      message.readAt = new Date();
      message.status = MessageStatus.READ;

      await messageRepo.save(message);

      return res.json({
        message: 'Message marked as read',
        data: message
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      return res.status(500).json({ message: 'Error marking message as read' });
    }
  };

  // Get unread count
  static getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const messageRepo = AppDataSource.getRepository(Message);

      const count = await messageRepo.count({
        where: {
          recipient: { id: userId },
          isRead: false
        }
      });

      return res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({ message: 'Error fetching unread count' });
    }
  };

  // Delete message
  static deleteMessage = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const messageRepo = AppDataSource.getRepository(Message);

      const message = await messageRepo.findOne({
        where: { id },
        relations: ['sender', 'recipient']
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (message.sender.id !== userId && message.recipient.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await messageRepo.remove(message);

      return res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ message: 'Error deleting message' });
    }
  };
}
