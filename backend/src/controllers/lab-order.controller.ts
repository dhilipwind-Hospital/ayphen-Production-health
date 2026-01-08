import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabTest } from '../models/LabTest';
import { User } from '../models/User';
import { createTenantRepository } from '../repositories/TenantRepository';

export class LabOrderController {
  // Generate order number
  private static async generateOrderNumber(orgId: string): Promise<string> {
    const labOrderRepo = AppDataSource.getRepository(LabOrder);
    const year = new Date().getFullYear();

    const lastOrder = await labOrderRepo
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :pattern', { pattern: `LAB-${year}-%` })
      .andWhere('order.organizationId = :orgId', { orgId })
      .orderBy('order.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `LAB-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  // Create a new lab order (for doctors)
  static createLabOrder = async (req: Request, res: Response) => {
    try {
      const { patientId, tests, clinicalNotes, diagnosis, isUrgent } = req.body;
      const doctorId = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Create tenant repositories
      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );

      const labTestTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabTest),
        orgId
      );

      // Generate order number
      const orderNumber = await LabOrderController.generateOrderNumber(orgId);

      // Create lab order
      const labOrder = await labOrderTenantRepo.save({
        orderNumber,
        doctorId,
        patientId,
        orderDate: new Date(),
        clinicalNotes,
        diagnosis,
        isUrgent: isUrgent || false,
        status: 'ordered'
      });

      // Create order items
      const orderItems = [];
      for (const testId of tests) {
        const test = await labTestTenantRepo.findOne({ where: { id: testId } });
        if (test) {
          const item = await labOrderItemTenantRepo.save({
            labOrderId: labOrder.id,
            labTestId: testId,
            status: 'ordered'
          });
          orderItems.push(item);
        }
      }

      // Fetch complete order with relations
      const completeOrder = await labOrderTenantRepo.findOne({
        where: { id: labOrder.id },
        relations: ['doctor', 'patient', 'items', 'items.labTest']
      });

      res.status(201).json(completeOrder);
    } catch (error) {
      console.error('Error creating lab order:', error);
      res.status(500).json({ message: 'Error creating lab order' });
    }
  };

  // Get lab orders by patient
  static getPatientLabOrders = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const orders = await labOrderTenantRepo.find({
        where: { patientId },
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.result'],
        order: { createdAt: 'DESC' }
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching patient lab orders:', error);
      res.status(500).json({ message: 'Error fetching patient lab orders' });
    }
  };

  // Get lab orders by doctor
  static getDoctorLabOrders = async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const orders = await labOrderTenantRepo.find({
        where: { doctorId },
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.result'],
        order: { createdAt: 'DESC' }
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching doctor lab orders:', error);
      res.status(500).json({ message: 'Error fetching doctor lab orders' });
    }
  };

  // Get pending lab orders (for lab technicians)
  static getPendingLabOrders = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const orders = await labOrderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.doctor', 'doctor')
        .leftJoinAndSelect('order.patient', 'patient')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.labTest', 'labTest')
        .leftJoinAndSelect('items.sample', 'sample')
        .where('order.organizationId = :orgId', { orgId })
        .andWhere('order.status IN (:...statuses)', {
          statuses: ['ordered', 'sample_collected', 'in_progress']
        })
        .orderBy('order.isUrgent', 'DESC')
        .addOrderBy('order.createdAt', 'ASC')
        .getMany();

      res.json(orders);
    } catch (error) {
      console.error('Error fetching pending lab orders:', error);
      res.status(500).json({ message: 'Error fetching pending lab orders' });
    }
  };

  // Get all lab orders (admin)
  static getAllLabOrders = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, status = '' } = req.query;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const whereConditions: any = {};
      if (status) {
        whereConditions.status = status;
      }

      const [orders, total] = await labOrderTenantRepo.findAndCount({
        where: whereConditions,
        relations: ['doctor', 'patient', 'items', 'items.labTest'],
        order: { createdAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      res.json({
        orders,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Error fetching all lab orders:', error);
      res.status(500).json({ message: 'Error fetching all lab orders' });
    }
  };

  // Get single lab order by ID
  static getLabOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const order = await labOrderTenantRepo.findOne({
        where: { id },
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.sample', 'items.result']
      });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching lab order:', error);
      res.status(500).json({ message: 'Error fetching lab order' });
    }
  };

  // Update lab order status
  static updateLabOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const order = await labOrderTenantRepo.findOne({ where: { id } });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      order.status = status;
      const updatedOrder = await labOrderTenantRepo.save(order);

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating lab order status:', error);
      res.status(500).json({ message: 'Error updating lab order status' });
    }
  };

  // Cancel lab order
  static cancelLabOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );

      const order = await labOrderTenantRepo.findOne({
        where: { id },
        relations: ['items']
      });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      // Update order status
      order.status = 'cancelled';
      await labOrderTenantRepo.save(order);

      // Update all items status
      for (const item of order.items) {
        item.status = 'cancelled';
        if (reason) {
          item.notes = `Cancelled: ${reason}`;
        }
        await labOrderItemTenantRepo.save(item);
      }

      res.json({ message: 'Lab order cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling lab order:', error);
      res.status(500).json({ message: 'Error cancelling lab order' });
    }
  };
}
