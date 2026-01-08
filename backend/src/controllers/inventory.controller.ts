import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Medicine } from '../models/pharmacy/Medicine';
import { StockAlert, AlertType, AlertStatus } from '../models/pharmacy/StockAlert';
import { StockMovement, MovementType } from '../models/pharmacy/StockMovement';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/PurchaseOrder';
import { LessThan, MoreThan } from 'typeorm';
import { createTenantRepository } from '../repositories/TenantRepository';

export class InventoryController {
  // Generate stock alerts
  static generateAlerts = async (req: Request, res: Response) => {
    try {
      const medicineRepo = AppDataSource.getRepository(Medicine);
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const medicines = await medicineRepo.find({ where: { isActive: true } });
      const alerts: StockAlert[] = [];
      const now = new Date();

      for (const medicine of medicines) {
        // Clear old active alerts for this medicine
        await alertRepo.update(
          { medicine: { id: medicine.id }, status: AlertStatus.ACTIVE },
          { status: AlertStatus.RESOLVED }
        );

        // Check for low stock
        if (medicine.currentStock <= medicine.reorderLevel && medicine.currentStock > 0) {
          const alert = alertRepo.create({
            medicine,
            alertType: AlertType.LOW_STOCK,
            status: AlertStatus.ACTIVE,
            message: `${medicine.name} is running low. Current stock: ${medicine.currentStock}, Reorder level: ${medicine.reorderLevel}`,
            currentStock: medicine.currentStock,
            reorderLevel: medicine.reorderLevel
          });
          alerts.push(alert);
        }

        // Check for out of stock
        if (medicine.currentStock === 0) {
          const alert = alertRepo.create({
            medicine,
            alertType: AlertType.OUT_OF_STOCK,
            status: AlertStatus.ACTIVE,
            message: `${medicine.name} is out of stock!`,
            currentStock: medicine.currentStock
          });
          alerts.push(alert);
        }

        // Check for expiry
        if (medicine.expiryDate) {
          const expiryDate = new Date(medicine.expiryDate);
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            const alert = alertRepo.create({
              medicine,
              alertType: AlertType.EXPIRED,
              status: AlertStatus.ACTIVE,
              message: `${medicine.name} has expired on ${expiryDate.toDateString()}`,
              expiryDate: medicine.expiryDate,
              daysUntilExpiry
            });
            alerts.push(alert);
          } else if (daysUntilExpiry <= 90) {
            const alert = alertRepo.create({
              medicine,
              alertType: AlertType.NEAR_EXPIRY,
              status: AlertStatus.ACTIVE,
              message: `${medicine.name} will expire in ${daysUntilExpiry} days`,
              expiryDate: medicine.expiryDate,
              daysUntilExpiry
            });
            alerts.push(alert);
          }
        }
      }

      if (alerts.length > 0) {
        await alertRepo.save(alerts);
      }

      return res.json({
        message: 'Alerts generated successfully',
        alertsCreated: alerts.length,
        data: alerts
      });
    } catch (error) {
      console.error('Error generating alerts:', error);
      return res.status(500).json({ message: 'Error generating alerts' });
    }
  };

  // Get active alerts
  static getAlerts = async (req: Request, res: Response) => {
    try {
      const { type, status = 'active' } = req.query;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const queryBuilder = alertRepo.createQueryBuilder('alert')
        .leftJoinAndSelect('alert.medicine', 'medicine')
        .orderBy('alert.createdAt', 'DESC');

      // Filter by organization
      if (tenantId) {
        queryBuilder.andWhere('medicine.organization_id = :tenantId', { tenantId });
      }

      if (status) {
        queryBuilder.andWhere('alert.status = :status', { status });
      }

      if (type) {
        queryBuilder.andWhere('alert.alertType = :type', { type });
      }

      const alerts = await queryBuilder.getMany();

      // Categorize alerts
      const categorized = {
        critical: alerts.filter(a => a.alertType === AlertType.OUT_OF_STOCK || a.alertType === AlertType.EXPIRED),
        warning: alerts.filter(a => a.alertType === AlertType.LOW_STOCK || a.alertType === AlertType.NEAR_EXPIRY),
        all: alerts
      };

      return res.json({
        data: alerts,
        categorized,
        total: alerts.length,
        criticalCount: categorized.critical.length
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return res.status(500).json({ message: 'Error fetching alerts' });
    }
  };

  // Acknowledge alert
  static acknowledgeAlert = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const alertRepo = AppDataSource.getRepository(StockAlert);

      await alertRepo.update(id, { status: AlertStatus.ACKNOWLEDGED });

      return res.json({ message: 'Alert acknowledged successfully' });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return res.status(500).json({ message: 'Error acknowledging alert' });
    }
  };

  // Get stock movements
  static getStockMovements = async (req: Request, res: Response) => {
    try {
      const { medicineId, type, limit = 50 } = req.query;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const movementRepo = AppDataSource.getRepository(StockMovement);

      const queryBuilder = movementRepo.createQueryBuilder('movement')
        .leftJoinAndSelect('movement.medicine', 'medicine')
        .leftJoinAndSelect('movement.performedBy', 'user')
        .orderBy('movement.createdAt', 'DESC')
        .take(Number(limit));

      // Filter by organization
      if (tenantId) {
        queryBuilder.andWhere('medicine.organization_id = :tenantId', { tenantId });
      }

      if (medicineId) {
        queryBuilder.andWhere('movement.medicineId = :medicineId', { medicineId });
      }

      if (type) {
        queryBuilder.andWhere('movement.movementType = :type', { type });
      }

      const movements = await queryBuilder.getMany();

      return res.json({
        data: movements,
        total: movements.length
      });
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return res.status(500).json({ message: 'Error fetching stock movements' });
    }
  };

  // Record stock movement
  static recordMovement = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { medicineId, movementType, quantity, notes, referenceNumber } = req.body;

      const medicineRepo = AppDataSource.getRepository(Medicine);
      const movementRepo = AppDataSource.getRepository(StockMovement);

      const medicine = await medicineRepo.findOne({ where: { id: medicineId } });
      if (!medicine) {
        return res.status(404).json({ message: 'Medicine not found' });
      }

      const previousStock = medicine.currentStock;
      let newStock = previousStock;

      // Calculate new stock based on movement type
      if ([MovementType.PURCHASE, MovementType.RETURN].includes(movementType)) {
        newStock = previousStock + quantity;
      } else if ([MovementType.SALE, MovementType.EXPIRED, MovementType.DAMAGED].includes(movementType)) {
        newStock = previousStock - quantity;
      } else if (movementType === MovementType.ADJUSTMENT) {
        newStock = quantity; // Direct adjustment
      }

      // Update medicine stock
      medicine.currentStock = newStock;
      await medicineRepo.save(medicine);

      // Record movement
      const movement = movementRepo.create({
        medicine,
        movementType,
        quantity,
        previousStock,
        newStock,
        notes,
        referenceNumber,
        performedBy: { id: userId }
      });

      await movementRepo.save(movement);

      return res.status(201).json({
        message: 'Stock movement recorded successfully',
        data: movement
      });
    } catch (error) {
      console.error('Error recording stock movement:', error);
      return res.status(500).json({ message: 'Error recording stock movement' });
    }
  };

  // Get inventory dashboard
  static getDashboard = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const medicineRepo = AppDataSource.getRepository(Medicine);
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const [
        totalMedicines,
        lowStockCount,
        outOfStockCount,
        nearExpiryCount,
        expiredCount,
        activeAlerts
      ] = await Promise.all([
        medicineRepo.count({ where: { isActive: true, ...(tenantId && { organization_id: tenantId }) } }),
        medicineRepo.createQueryBuilder('m')
          .where('m.currentStock <= m.reorderLevel')
          .andWhere('m.currentStock > 0')
          .andWhere('m.isActive = true')
          .andWhere(tenantId ? 'm.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .getCount(),
        medicineRepo.count({ where: { currentStock: 0, isActive: true, ...(tenantId && { organization_id: tenantId }) } }),
        medicineRepo.createQueryBuilder('m')
          .where('m.expiryDate <= :date', {
            date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          })
          .andWhere('m.expiryDate > :now', { now: new Date() })
          .andWhere('m.isActive = true')
          .andWhere(tenantId ? 'm.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .getCount(),
        medicineRepo.createQueryBuilder('m')
          .where('m.expiryDate < :now', { now: new Date() })
          .andWhere('m.isActive = true')
          .andWhere(tenantId ? 'm.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .getCount(),
        alertRepo.createQueryBuilder('a')
          .leftJoinAndSelect('a.medicine', 'medicine')
          .where('a.status = :status', { status: AlertStatus.ACTIVE })
          .andWhere(tenantId ? 'medicine.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
          .getCount()
      ]);

      // Get total stock value
      const medicinesQb = medicineRepo.createQueryBuilder('m')
        .where('m.isActive = true');
      if (tenantId) {
        medicinesQb.andWhere('m.organization_id = :tenantId', { tenantId });
      }
      const medicines = await medicinesQb.getMany();
      const totalValue = medicines.reduce((sum, m) => sum + (m.currentStock * m.unitPrice), 0);

      return res.json({
        data: {
          totalMedicines,
          lowStockCount,
          outOfStockCount,
          nearExpiryCount,
          expiredCount,
          activeAlerts,
          totalStockValue: totalValue.toFixed(2),
          criticalIssues: outOfStockCount + expiredCount
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return res.status(500).json({ message: 'Error fetching dashboard data' });
    }
  };

  // Get expiry report
  static getExpiryReport = async (req: Request, res: Response) => {
    try {
      const { days = 90 } = req.query;
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const medicineRepo = AppDataSource.getRepository(Medicine);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Number(days));

      const expiringMedicines = await medicineRepo.createQueryBuilder('m')
        .where('m.expiryDate <= :futureDate', { futureDate })
        .andWhere('m.expiryDate >= :now', { now: new Date() })
        .andWhere('m.isActive = true')
        .andWhere(tenantId ? 'm.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .orderBy('m.expiryDate', 'ASC')
        .getMany();

      const expiredMedicines = await medicineRepo.createQueryBuilder('m')
        .where('m.expiryDate < :now', { now: new Date() })
        .andWhere('m.isActive = true')
        .andWhere(tenantId ? 'm.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .orderBy('m.expiryDate', 'DESC')
        .getMany();

      return res.json({
        data: {
          expiring: expiringMedicines,
          expired: expiredMedicines,
          expiringCount: expiringMedicines.length,
          expiredCount: expiredMedicines.length
        }
      });
    } catch (error) {
      console.error('Error fetching expiry report:', error);
      return res.status(500).json({ message: 'Error fetching expiry report' });
    }
  };

  // Get reorder report
  static getReorderReport = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenant?.id || (req as any).user?.organization_id;
      const medicineRepo = AppDataSource.getRepository(Medicine);

      const reorderNeeded = await medicineRepo.createQueryBuilder('m')
        .where('m.currentStock <= m.reorderLevel')
        .andWhere('m.isActive = true')
        .andWhere(tenantId ? 'm.organization_id = :tenantId' : '1=1', tenantId ? { tenantId } : {})
        .orderBy('m.currentStock', 'ASC')
        .getMany();

      const suggestedOrders = reorderNeeded.map(medicine => ({
        medicine,
        currentStock: medicine.currentStock,
        reorderLevel: medicine.reorderLevel,
        suggestedQuantity: (medicine.reorderLevel * 2) - medicine.currentStock,
        estimatedCost: ((medicine.reorderLevel * 2) - medicine.currentStock) * medicine.unitPrice
      }));

      const totalEstimatedCost = suggestedOrders.reduce((sum, order) => sum + order.estimatedCost, 0);

      return res.json({
        data: suggestedOrders,
        total: suggestedOrders.length,
        totalEstimatedCost: totalEstimatedCost.toFixed(2)
      });
    } catch (error) {
      console.error('Error fetching reorder report:', error);
      return res.status(500).json({ message: 'Error fetching reorder report' });
    }
  };
}
