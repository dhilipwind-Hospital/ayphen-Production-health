import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Bed, BedStatus } from '../../models/inpatient/Bed';
import { Room } from '../../models/inpatient/Room';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class BedController {
  // Get all beds
  static getAllBeds = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id using queryBuilder
      const beds = await bedRepository.createQueryBuilder('bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .leftJoinAndSelect('bed.currentAdmission', 'currentAdmission')
        .where('bed.organization_id = :tenantId', { tenantId })
        .orderBy('bed.bedNumber', 'ASC')
        .getMany();

      return res.json({
        success: true,
        beds
      });
    } catch (error) {
      console.error('Error fetching beds:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch beds'
      });
    }
  };

  // Get beds by room
  static getBedsByRoom = async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id using queryBuilder
      const beds = await bedRepository.createQueryBuilder('bed')
        .leftJoinAndSelect('bed.currentAdmission', 'currentAdmission')
        .leftJoinAndSelect('currentAdmission.patient', 'patient')
        .where('bed.roomId = :roomId', { roomId })
        .andWhere('bed.organization_id = :tenantId', { tenantId })
        .orderBy('bed.bedNumber', 'ASC')
        .getMany();

      return res.json({
        success: true,
        beds
      });
    } catch (error) {
      console.error('Error fetching beds:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch beds'
      });
    }
  };

  // Get available beds
  static getAvailableBeds = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id using queryBuilder
      const beds = await bedRepository.createQueryBuilder('bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('bed.status = :status', { status: BedStatus.AVAILABLE })
        .andWhere('bed.organization_id = :tenantId', { tenantId })
        .orderBy('bed.bedNumber', 'ASC')
        .getMany();

      return res.json({
        success: true,
        beds
      });
    } catch (error) {
      console.error('Error fetching available beds:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch available beds'
      });
    }
  };

  // Get bed by ID
  static getBedById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id using queryBuilder
      const bed = await bedRepository.createQueryBuilder('bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .leftJoinAndSelect('bed.currentAdmission', 'currentAdmission')
        .leftJoinAndSelect('currentAdmission.patient', 'patient')
        .where('bed.id = :id', { id })
        .andWhere('bed.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      return res.json({
        success: true,
        bed
      });
    } catch (error) {
      console.error('Error fetching bed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch bed'
      });
    }
  };

  // Create new bed
  static createBed = async (req: Request, res: Response) => {
    try {
      const { bedNumber, roomId, notes } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      // Validate required fields
      if (!bedNumber || !roomId) {
        return res.status(400).json({
          success: false,
          message: 'Bed number and room are required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);
      const roomRepository = AppDataSource.getRepository(Room);

      // CRITICAL: Check if bed number already exists within organization
      const existingBed = await bedRepository.findOne({
        where: { bedNumber, organizationId: tenantId }
      });
      if (existingBed) {
        return res.status(400).json({
          success: false,
          message: 'Bed number already exists'
        });
      }

      // CRITICAL: Verify room exists within organization
      const room = await roomRepository.findOne({
        where: { id: roomId, organizationId: tenantId }
      });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Create bed
      const bed = bedRepository.create({
        bedNumber,
        roomId,
        organizationId: tenantId,
        status: BedStatus.AVAILABLE,
        notes
      });

      await bedRepository.save(bed);

      return res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        bed
      });
    } catch (error) {
      console.error('Error creating bed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create bed'
      });
    }
  };

  // Update bed
  static updateBed = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { bedNumber, roomId, status, notes } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id
      const bed = await bedRepository.findOne({
        where: { id, organizationId: tenantId }
      });
      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      // Check if bed number is being changed and if it already exists
      if (bedNumber && bedNumber !== bed.bedNumber) {
        const existingBed = await bedRepository.findOne({
          where: { bedNumber, organizationId: tenantId }
        });
        if (existingBed) {
          return res.status(400).json({
            success: false,
            message: 'Bed number already exists'
          });
        }
      }

      // Update fields
      if (bedNumber) bed.bedNumber = bedNumber;
      if (roomId) bed.roomId = roomId;
      if (status) bed.status = status;
      if (notes !== undefined) bed.notes = notes;

      await bedRepository.save(bed);

      return res.json({
        success: true,
        message: 'Bed updated successfully',
        bed
      });
    } catch (error) {
      console.error('Error updating bed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update bed'
      });
    }
  };

  // Change bed status
  static changeBedStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id
      const bed = await bedRepository.findOne({
        where: { id, organizationId: tenantId }
      });
      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      bed.status = status;
      if (notes !== undefined) bed.notes = notes;

      await bedRepository.save(bed);

      return res.json({
        success: true,
        message: 'Bed status updated successfully',
        bed
      });
    } catch (error) {
      console.error('Error updating bed status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update bed status'
      });
    }
  };

  // Delete bed
  static deleteBed = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Filter by organization_id using queryBuilder
      const bed = await bedRepository.createQueryBuilder('bed')
        .leftJoinAndSelect('bed.currentAdmission', 'currentAdmission')
        .where('bed.id = :id', { id })
        .andWhere('bed.organization_id = :tenantId', { tenantId })
        .getOne();

      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      // Check if bed is occupied
      if (bed.currentAdmission) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete occupied bed. Please discharge patient first.'
        });
      }

      await bedRepository.remove(bed);

      return res.json({
        success: true,
        message: 'Bed deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting bed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete bed'
      });
    }
  };
}
