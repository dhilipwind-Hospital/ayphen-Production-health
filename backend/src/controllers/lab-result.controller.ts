import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LabResult } from '../models/LabResult';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabOrder } from '../models/LabOrder';
import { EmailService } from '../services/email.service';
import { createTenantRepository } from '../repositories/TenantRepository';

export class LabResultController {
  // Enter lab result
  static enterLabResult = async (req: Request, res: Response) => {
    try {
      const {
        orderItemId,
        resultValue,
        units,
        referenceRange,
        interpretation,
        flag,
        comments,
        additionalData
      } = req.body;
      const performedById = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labResultTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabResult),
        orgId
      );

      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );

      const labOrderTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrder),
        orgId
      );

      // Check if order item exists
      const orderItem = await labOrderItemTenantRepo.findOne({
        where: { id: orderItemId },
        relations: ['labTest', 'labOrder', 'labOrder.patient', 'labOrder.doctor']
      });

      if (!orderItem) {
        return res.status(404).json({ message: 'Lab order item not found' });
      }

      // Create result
      const savedResult = await labResultTenantRepo.save({
        resultValue,
        units: units || orderItem.labTest.units,
        referenceRange: referenceRange || orderItem.labTest.normalRange,
        interpretation,
        flag: flag || 'normal',
        resultTime: new Date(),
        performedById,
        comments,
        additionalData,
        isVerified: false
      });

      // Update order item
      orderItem.resultId = savedResult.id;
      orderItem.status = 'completed';
      await labOrderItemTenantRepo.save(orderItem);

      // Check if all items in order are completed
      const allItems = await labOrderItemTenantRepo.find({
        where: { labOrderId: orderItem.labOrderId }
      });

      const allCompleted = allItems.every(item => item.status === 'completed');
      if (allCompleted) {
        const order = await labOrderTenantRepo.findOne({
          where: { id: orderItem.labOrderId }
        });
        if (order) {
          order.status = 'completed';
          await labOrderTenantRepo.save(order);
        }
      }

      // Send notification for critical results
      if (flag === 'critical') {
        try {
          await EmailService.sendEmail({
            to: orderItem.labOrder.doctor.email,
            subject: `🚨 CRITICAL Lab Result - ${orderItem.labTest.name}`,
            html: `
              <h2>Critical Lab Result Alert</h2>
              <p><strong>Patient:</strong> ${orderItem.labOrder.patient.firstName} ${orderItem.labOrder.patient.lastName}</p>
              <p><strong>Test:</strong> ${orderItem.labTest.name}</p>
              <p><strong>Result:</strong> ${resultValue} ${units || ''}</p>
              <p><strong>Reference Range:</strong> ${referenceRange || orderItem.labTest.normalRange}</p>
              <p><strong>Interpretation:</strong> ${interpretation || 'N/A'}</p>
              <p style="color: red;"><strong>This is a CRITICAL result requiring immediate attention!</strong></p>
            `
          });
        } catch (emailError) {
          console.error('Error sending critical result email:', emailError);
        }
      }

      res.status(201).json(savedResult);
    } catch (error) {
      console.error('Error entering lab result:', error);
      res.status(500).json({ message: 'Error entering lab result' });
    }
  };

  // Verify lab result
  static verifyLabResult = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const verifiedById = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labResultTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabResult),
        orgId
      );

      const result = await labResultTenantRepo.findOne({ where: { id } });

      if (!result) {
        return res.status(404).json({ message: 'Lab result not found' });
      }

      result.isVerified = true;
      result.verifiedById = verifiedById;
      result.verificationTime = new Date();

      const updatedResult = await labResultTenantRepo.save(result);

      res.json(updatedResult);
    } catch (error) {
      console.error('Error verifying lab result:', error);
      res.status(500).json({ message: 'Error verifying lab result' });
    }
  };

  // Get result by ID
  static getResultById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labResultTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabResult),
        orgId
      );

      const result = await labResultTenantRepo.findOne({
        where: { id },
        relations: ['performedBy', 'verifiedBy']
      });

      if (!result) {
        return res.status(404).json({ message: 'Lab result not found' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching lab result:', error);
      res.status(500).json({ message: 'Error fetching lab result' });
    }
  };

  // Get results by lab order
  static getResultsByLabOrder = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );

      const items = await labOrderItemTenantRepo.find({
        where: { labOrderId: orderId },
        relations: ['result', 'result.performedBy', 'result.verifiedBy', 'labTest']
      });

      const results = items
        .filter(item => item.result)
        .map(item => ({
          ...item.result,
          testName: item.labTest.name,
          testCode: item.labTest.code
        }));

      res.json(results);
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: 'Error fetching results' });
    }
  };

  // Get patient lab results
  static getPatientLabResults = async (req: Request, res: Response) => {
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
        where: { patientId, status: 'completed' },
        relations: ['items', 'items.result', 'items.labTest', 'doctor'],
        order: { createdAt: 'DESC' }
      });

      const results = orders.flatMap(order =>
        order.items
          .filter(item => item.result)
          .map(item => ({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderDate: order.orderDate,
            doctorName: `${order.doctor.firstName} ${order.doctor.lastName}`,
            testName: item.labTest.name,
            testCode: item.labTest.code,
            result: item.result
          }))
      );

      res.json(results);
    } catch (error) {
      console.error('Error fetching patient lab results:', error);
      res.status(500).json({ message: 'Error fetching patient lab results' });
    }
  };
}
