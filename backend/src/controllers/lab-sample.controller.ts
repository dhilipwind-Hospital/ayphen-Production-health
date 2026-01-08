import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LabSample } from '../models/LabSample';
import { LabOrderItem } from '../models/LabOrderItem';
import { createTenantRepository } from '../repositories/TenantRepository';

export class LabSampleController {
  // Generate sample ID (barcode)
  private static async generateSampleId(orgId: string): Promise<string> {
    const labSampleRepo = AppDataSource.getRepository(LabSample);
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    const lastSample = await labSampleRepo
      .createQueryBuilder('sample')
      .where('sample.sampleId LIKE :pattern', { pattern: `S${year}${month}%` })
      .andWhere('sample.organizationId = :orgId', { orgId })
      .orderBy('sample.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastSample) {
      const lastSequence = parseInt(lastSample.sampleId.substring(7));
      sequence = lastSequence + 1;
    }

    return `S${year}${month}${sequence.toString().padStart(5, '0')}`;
  }

  // Register a new sample
  static registerSample = async (req: Request, res: Response) => {
    try {
      const { orderItemId, sampleType, storageLocation } = req.body;
      const collectedById = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labSampleTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabSample),
        orgId
      );

      const labOrderItemTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabOrderItem),
        orgId
      );

      // Check if order item exists
      const orderItem = await labOrderItemTenantRepo.findOne({
        where: { id: orderItemId },
        relations: ['labTest']
      });

      if (!orderItem) {
        return res.status(404).json({ message: 'Lab order item not found' });
      }

      // Generate sample ID
      const sampleId = await LabSampleController.generateSampleId(orgId);

      // Create sample
      const savedSample = await labSampleTenantRepo.save({
        sampleId,
        sampleType: sampleType || orderItem.labTest.sampleType || 'blood',
        collectionTime: new Date(),
        collectedById,
        status: 'collected',
        storageLocation
      });

      // Update order item
      orderItem.sampleId = savedSample.id;
      orderItem.status = 'sample_collected';
      await labOrderItemTenantRepo.save(orderItem);

      res.status(201).json(savedSample);
    } catch (error) {
      console.error('Error registering sample:', error);
      res.status(500).json({ message: 'Error registering sample' });
    }
  };

  // Update sample status
  static updateSampleStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, storageLocation } = req.body;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labSampleTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabSample),
        orgId
      );

      const sample = await labSampleTenantRepo.findOne({ where: { id } });

      if (!sample) {
        return res.status(404).json({ message: 'Sample not found' });
      }

      sample.status = status;
      if (storageLocation) {
        sample.storageLocation = storageLocation;
      }

      const updatedSample = await labSampleTenantRepo.save(sample);

      res.json(updatedSample);
    } catch (error) {
      console.error('Error updating sample status:', error);
      res.status(500).json({ message: 'Error updating sample status' });
    }
  };

  // Reject sample
  static rejectSample = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labSampleTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabSample),
        orgId
      );

      const sample = await labSampleTenantRepo.findOne({ where: { id } });

      if (!sample) {
        return res.status(404).json({ message: 'Sample not found' });
      }

      sample.status = 'rejected';
      sample.rejectionReason = rejectionReason;

      const updatedSample = await labSampleTenantRepo.save(sample);

      res.json(updatedSample);
    } catch (error) {
      console.error('Error rejecting sample:', error);
      res.status(500).json({ message: 'Error rejecting sample' });
    }
  };

  // Get sample by ID
  static getSampleById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organization_id;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labSampleTenantRepo = createTenantRepository(
        AppDataSource.getRepository(LabSample),
        orgId
      );

      const sample = await labSampleTenantRepo.findOne({
        where: { id },
        relations: ['collectedBy']
      });

      if (!sample) {
        return res.status(404).json({ message: 'Sample not found' });
      }

      res.json(sample);
    } catch (error) {
      console.error('Error fetching sample:', error);
      res.status(500).json({ message: 'Error fetching sample' });
    }
  };

  // Get samples by lab order
  static getSamplesByLabOrder = async (req: Request, res: Response) => {
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
        relations: ['sample', 'sample.collectedBy', 'labTest']
      });

      const samples = items
        .filter(item => item.sample)
        .map(item => ({
          ...item.sample,
          testName: item.labTest.name
        }));

      res.json(samples);
    } catch (error) {
      console.error('Error fetching samples:', error);
      res.status(500).json({ message: 'Error fetching samples' });
    }
  };
}
