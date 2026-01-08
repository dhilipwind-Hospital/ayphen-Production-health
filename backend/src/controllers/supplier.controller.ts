import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/PurchaseOrder';

export class SupplierController {
  // Get all suppliers
  static getSuppliers = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { isActive } = req.query;
      const supplierRepo = AppDataSource.getRepository(Supplier);

      // CRITICAL: Filter by organization_id
      const queryBuilder = supplierRepo.createQueryBuilder('supplier')
        .where('supplier.organization_id = :tenantId', { tenantId })
        .orderBy('supplier.name', 'ASC');

      if (isActive !== undefined) {
        queryBuilder.andWhere('supplier.isActive = :isActive', { isActive: isActive === 'true' });
      }

      const suppliers = await queryBuilder.getMany();

      return res.json({
        data: suppliers,
        total: suppliers.length
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return res.status(500).json({ message: 'Error fetching suppliers' });
    }
  };

  // Get supplier by ID
  static getSupplier = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const supplierRepo = AppDataSource.getRepository(Supplier);

      // CRITICAL: Filter by organization_id
      const supplier = await supplierRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      return res.json({ data: supplier });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return res.status(500).json({ message: 'Error fetching supplier' });
    }
  };

  // Create supplier
  static createSupplier = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { name, contactPerson, phone, email, address, notes } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Supplier name is required' });
      }

      const supplierRepo = AppDataSource.getRepository(Supplier);

      const supplier = supplierRepo.create({
        name,
        contactPerson,
        phone,
        email,
        address,
        notes,
        organizationId: tenantId
      });

      await supplierRepo.save(supplier);

      return res.status(201).json({
        message: 'Supplier created successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      return res.status(500).json({ message: 'Error creating supplier' });
    }
  };

  // Update supplier
  static updateSupplier = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const updateData = req.body;

      const supplierRepo = AppDataSource.getRepository(Supplier);

      // CRITICAL: Filter by organization_id
      const supplier = await supplierRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      Object.assign(supplier, updateData);
      await supplierRepo.save(supplier);

      return res.json({
        message: 'Supplier updated successfully',
        data: supplier
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      return res.status(500).json({ message: 'Error updating supplier' });
    }
  };

  // Delete/deactivate supplier
  static deleteSupplier = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const supplierRepo = AppDataSource.getRepository(Supplier);

      // CRITICAL: Filter by organization_id
      const supplier = await supplierRepo.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }

      // Soft delete - just deactivate
      supplier.isActive = false;
      await supplierRepo.save(supplier);

      return res.json({ message: 'Supplier deactivated successfully' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return res.status(500).json({ message: 'Error deleting supplier' });
    }
  };

  // Get supplier purchase orders
  static getSupplierOrders = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const poRepo = AppDataSource.getRepository(PurchaseOrder);

      // CRITICAL: Filter orders by organizationId
      const orders = await poRepo.createQueryBuilder('po')
        .leftJoinAndSelect('po.createdBy', 'createdBy')
        .leftJoinAndSelect('po.approvedBy', 'approvedBy')
        .where('po.supplier.id = :supplierId', { supplierId: id })
        .andWhere('po.organization_id = :tenantId', { tenantId })
        .orderBy('po.createdAt', 'DESC')
        .getMany();

      return res.json({
        data: orders,
        total: orders.length
      });
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      return res.status(500).json({ message: 'Error fetching supplier orders' });
    }
  };
}
