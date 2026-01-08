import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Medicine } from '../../models/pharmacy/Medicine';
import { validate } from 'class-validator';
import { Between, LessThanOrEqual } from 'typeorm';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class MedicineController {
  // Get all medicines with pagination and filtering
  static getAllMedicines = async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        name,
        category,
        manufacturer,
        lowStock,
        expiringSoon,
        sortBy = 'name',
        sortOrder = 'ASC'
      } = req.query;

      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const medicineRepository = AppDataSource.getRepository(Medicine);
      
      // Build query with tenant filtering
      const qb = medicineRepository.createQueryBuilder('medicine')
        .where('medicine.organization_id = :tenantId', { tenantId })
        .andWhere('medicine.isActive = :isActive', { isActive: true });
      
      if (name) {
        qb.andWhere('medicine.name ILIKE :name', { name: `%${name}%` });
      }
      
      if (category) {
        qb.andWhere('medicine.category = :category', { category });
      }
      
      if (manufacturer) {
        qb.andWhere('medicine.manufacturer ILIKE :manufacturer', { manufacturer: `%${manufacturer}%` });
      }
      
      if (lowStock === 'true') {
        qb.andWhere('medicine.currentStock <= medicine.reorderLevel');
      }
      
      if (expiringSoon === 'true') {
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        qb.andWhere('medicine.expiryDate BETWEEN :now AND :threeMonths', {
          now: new Date(),
          threeMonths: threeMonthsFromNow
        });
      }

      // Execute query with pagination and sorting
      const [medicines, total] = await qb
        .orderBy(`medicine.${sortBy}`, sortOrder as 'ASC' | 'DESC')
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return res.status(200).json({
        medicines,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting medicines:', error);
      return res.status(500).json({ message: 'Failed to get medicines', error: error.message });
    }
  };

  // Get a single medicine by ID
  static getMedicineById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const medicineRepository = AppDataSource.getRepository(Medicine);
      const medicine = await medicineRepository.findOne({ 
        where: { id, organizationId: tenantId } 
      });

      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      return res.status(200).json(medicine);
    } catch (error) {
      console.error('Error getting medicine:', error);
      return res.status(500).json({ message: 'Failed to get medicine', error: error.message });
    }
  };

  // Create a new medicine
  static createMedicine = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const medicineRepository = AppDataSource.getRepository(Medicine);
      const medicine = medicineRepository.create({
        ...req.body,
        organizationId: tenantId
      });

      // Validate medicine data
      const errors = await validate(medicine);
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
      }

      // Save medicine
      await medicineRepository.save(medicine);
      return res.status(201).json({ message: 'Medicine created successfully', medicine });
    } catch (error) {
      console.error('Error creating medicine:', error);
      return res.status(500).json({ message: 'Failed to create medicine', error: error.message });
    }
  };

  // Update an existing medicine
  static updateMedicine = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const medicineRepository = AppDataSource.getRepository(Medicine);
      
      // Find existing medicine
      let medicine = await medicineRepository.findOne({ where: { id } });
      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      // Update medicine properties
      medicineRepository.merge(medicine, req.body);

      // Validate updated medicine
      const errors = await validate(medicine);
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
      }

      // Save updated medicine
      medicine = await medicineRepository.save(medicine);
      return res.status(200).json({ message: 'Medicine updated successfully', medicine });
    } catch (error) {
      console.error('Error updating medicine:', error);
      return res.status(500).json({ message: 'Failed to update medicine', error: error.message });
    }
  };

  // Delete a medicine (soft delete)
  static deleteMedicine = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const medicineRepository = AppDataSource.getRepository(Medicine);
      
      // Find existing medicine
      const medicine = await medicineRepository.findOne({ where: { id, organizationId: tenantId } });
      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      // Soft delete by setting isActive to false
      medicine.isActive = false;
      await medicineRepository.save(medicine);

      return res.status(200).json({ message: 'Medicine deleted successfully' });
    } catch (error) {
      console.error('Error deleting medicine:', error);
      return res.status(500).json({ message: 'Failed to delete medicine', error: error.message });
    }
  };

  // Get low stock medicines
  static getLowStockMedicines = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const medicineRepository = AppDataSource.getRepository(Medicine);

      const qb = medicineRepository.createQueryBuilder('m')
        .where('m.isActive = true')
        .andWhere('m.currentStock <= m.reorderLevel');

      // Filter by organization
      if (tenantId) {
        qb.andWhere('m.organization_id = :tenantId', { tenantId });
      }

      const medicines = await qb.getMany();

      return res.status(200).json(medicines);
    } catch (error) {
      console.error('Error getting low stock medicines:', error);
      return res.status(500).json({ message: 'Failed to get low stock medicines', error: error.message });
    }
  };

  // Get expiring medicines
  static getExpiringMedicines = async (req: Request, res: Response) => {
    try {
      const { days = 90 } = req.query; // Default to 90 days
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const medicineRepository = AppDataSource.getRepository(Medicine);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Number(days));

      const qb = medicineRepository.createQueryBuilder('m')
        .where('m.isActive = true')
        .andWhere('m.expiryDate >= :nowDate', { nowDate: new Date() })
        .andWhere('m.expiryDate <= :futureDate', { futureDate });

      // Filter by organization
      if (tenantId) {
        qb.andWhere('m.organization_id = :tenantId', { tenantId });
      }

      const medicines = await qb.getMany();

      return res.status(200).json(medicines);
    } catch (error) {
      console.error('Error getting expiring medicines:', error);
      return res.status(500).json({ message: 'Failed to get expiring medicines', error: error.message });
    }
  };
}
