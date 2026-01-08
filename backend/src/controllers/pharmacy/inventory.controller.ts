import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Medicine } from '../../models/pharmacy/Medicine';
import { MedicineTransaction, TransactionType } from '../../models/pharmacy/MedicineTransaction';
import { Between } from 'typeorm';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class InventoryController {
  // Add stock (purchase)
  static addStock = async (req: Request, res: Response) => {
    try {
      const { medicineId, quantity, batchNumber, expiryDate, unitPrice, notes } = req.body;
      
      // Get user ID from authenticated user
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Validate required fields
      if (!medicineId || !quantity || !batchNumber || !expiryDate) {
        return res.status(400).json({ message: 'Medicine ID, quantity, batch number, and expiry date are required' });
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get medicine
        const medicineRepository = queryRunner.manager.getRepository(Medicine);
        const medicine = await medicineRepository.findOne({ where: { id: medicineId } });

        if (!medicine) {
          return res.status(404).json({ message: 'Medicine not found' });
        }

        // Update medicine stock
        medicine.currentStock += Number(quantity);
        medicine.batchNumber = batchNumber;
        medicine.expiryDate = new Date(expiryDate);
        if (unitPrice) {
          medicine.unitPrice = Number(unitPrice);
        }

        await medicineRepository.save(medicine);

        // Create medicine transaction
        const medicineTransactionRepository = queryRunner.manager.getRepository(MedicineTransaction);
        const transaction = medicineTransactionRepository.create({
          medicineId,
          transactionType: TransactionType.PURCHASE,
          quantity: Number(quantity),
          transactionDate: new Date(),
          notes,
          performedById: userId
        });

        await medicineTransactionRepository.save(transaction);

        // Commit transaction
        await queryRunner.commitTransaction();

        return res.status(200).json({
          message: 'Stock added successfully',
          medicine,
          transaction
        });
      } catch (error) {
        // Rollback transaction in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      return res.status(500).json({ message: 'Failed to add stock', error: error.message });
    }
  };

  // Adjust stock (for inventory reconciliation)
  static adjustStock = async (req: Request, res: Response) => {
    try {
      const { medicineId, quantity, reason } = req.body;
      
      // Get user ID from authenticated user
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Validate required fields
      if (!medicineId || quantity === undefined || !reason) {
        return res.status(400).json({ message: 'Medicine ID, quantity, and reason are required' });
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get medicine
        const medicineRepository = queryRunner.manager.getRepository(Medicine);
        const medicine = await medicineRepository.findOne({ where: { id: medicineId } });

        if (!medicine) {
          return res.status(404).json({ message: 'Medicine not found' });
        }

        // Check if adjustment would result in negative stock
        if (medicine.currentStock + Number(quantity) < 0) {
          return res.status(400).json({ message: 'Adjustment would result in negative stock' });
        }

        // Update medicine stock
        medicine.currentStock += Number(quantity);
        await medicineRepository.save(medicine);

        // Create medicine transaction
        const medicineTransactionRepository = queryRunner.manager.getRepository(MedicineTransaction);
        const transaction = medicineTransactionRepository.create({
          medicineId,
          transactionType: TransactionType.ADJUSTMENT,
          quantity: Number(quantity),
          transactionDate: new Date(),
          notes: reason,
          performedById: userId
        });

        await medicineTransactionRepository.save(transaction);

        // Commit transaction
        await queryRunner.commitTransaction();

        return res.status(200).json({
          message: 'Stock adjusted successfully',
          medicine,
          transaction
        });
      } catch (error) {
        // Rollback transaction in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return res.status(500).json({ message: 'Failed to adjust stock', error: error.message });
    }
  };

  // Record damaged/expired stock
  static recordDamagedStock = async (req: Request, res: Response) => {
    try {
      const { medicineId, quantity, reason, type } = req.body;
      
      // Get user ID from authenticated user
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Validate required fields
      if (!medicineId || !quantity || !reason || !type) {
        return res.status(400).json({ message: 'Medicine ID, quantity, reason, and type are required' });
      }

      if (type !== 'expired' && type !== 'damaged') {
        return res.status(400).json({ message: 'Type must be either "expired" or "damaged"' });
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get medicine
        const medicineRepository = queryRunner.manager.getRepository(Medicine);
        const medicine = await medicineRepository.findOne({ where: { id: medicineId } });

        if (!medicine) {
          return res.status(404).json({ message: 'Medicine not found' });
        }

        // Check if there is enough stock
        if (medicine.currentStock < Number(quantity)) {
          return res.status(400).json({ message: 'Not enough stock' });
        }

        // Update medicine stock
        medicine.currentStock -= Number(quantity);
        await medicineRepository.save(medicine);

        // Create medicine transaction
        const medicineTransactionRepository = queryRunner.manager.getRepository(MedicineTransaction);
        const transaction = medicineTransactionRepository.create({
          medicineId,
          transactionType: type === 'expired' ? TransactionType.EXPIRED : TransactionType.DAMAGED,
          quantity: Number(quantity),
          transactionDate: new Date(),
          notes: reason,
          performedById: userId
        });

        await medicineTransactionRepository.save(transaction);

        // Commit transaction
        await queryRunner.commitTransaction();

        return res.status(200).json({
          message: `${type === 'expired' ? 'Expired' : 'Damaged'} stock recorded successfully`,
          medicine,
          transaction
        });
      } catch (error) {
        // Rollback transaction in case of error
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        // Release query runner
        await queryRunner.release();
      }
    } catch (error) {
      console.error('Error recording damaged/expired stock:', error);
      return res.status(500).json({ message: 'Failed to record damaged/expired stock', error: error.message });
    }
  };

  // Get stock transaction history
  static getTransactionHistory = async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        medicineId,
        transactionType,
        startDate,
        endDate,
        sortBy = 'transactionDate',
        sortOrder = 'DESC'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const medicineTransactionRepository = AppDataSource.getRepository(MedicineTransaction);
      
      // Build query conditions
      const whereConditions: any = {};
      
      if (medicineId) {
        whereConditions.medicineId = medicineId;
      }
      
      if (transactionType) {
        whereConditions.transactionType = transactionType;
      }
      
      if (startDate && endDate) {
        whereConditions.transactionDate = Between(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      }

      // Execute query with pagination and sorting
      const [transactions, total] = await medicineTransactionRepository.findAndCount({
        where: whereConditions,
        relations: ['medicine', 'performedBy'],
        skip,
        take,
        order: {
          [sortBy as string]: sortOrder
        }
      });

      return res.status(200).json({
        transactions,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return res.status(500).json({ message: 'Failed to get transaction history', error: error.message });
    }
  };

  // Generate inventory reports
  static generateInventoryReport = async (req: Request, res: Response) => {
    try {
      const { reportType, startDate, endDate } = req.query;
      
      if (!reportType) {
        return res.status(400).json({ message: 'Report type is required' });
      }

      const medicineRepository = AppDataSource.getRepository(Medicine);
      const medicineTransactionRepository = AppDataSource.getRepository(MedicineTransaction);

      let report: any = {};

      switch (reportType) {
        case 'stock_levels':
          // Current stock levels report
          const medicines = await medicineRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' }
          });

          report = {
            reportType: 'Stock Levels',
            generatedAt: new Date(),
            data: medicines.map(medicine => ({
              id: medicine.id,
              name: medicine.name,
              genericName: medicine.genericName,
              category: medicine.category,
              currentStock: medicine.currentStock,
              reorderLevel: medicine.reorderLevel,
              status: medicine.currentStock <= medicine.reorderLevel ? 'Low Stock' : 'Adequate'
            }))
          };
          break;

        case 'transactions':
          // Transaction history report
          if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required for transaction report' });
          }

          const transactions = await medicineTransactionRepository.find({
            where: {
              transactionDate: Between(
                new Date(startDate as string),
                new Date(endDate as string)
              )
            },
            relations: ['medicine', 'performedBy'],
            order: { transactionDate: 'DESC' }
          });

          report = {
            reportType: 'Transaction History',
            generatedAt: new Date(),
            startDate,
            endDate,
            data: transactions.map(transaction => ({
              id: transaction.id,
              medicineName: transaction.medicine.name,
              transactionType: transaction.transactionType,
              quantity: transaction.quantity,
              transactionDate: transaction.transactionDate,
              performedBy: transaction.performedBy ? 
                `${transaction.performedBy.firstName} ${transaction.performedBy.lastName}` : 
                'Unknown',
              notes: transaction.notes
            }))
          };
          break;

        case 'expiry':
          // Expiring medicines report
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

          const expiringMedicines = await medicineRepository.find({
            where: {
              isActive: true,
              expiryDate: Between(new Date(), threeMonthsFromNow)
            },
            order: { expiryDate: 'ASC' }
          });

          report = {
            reportType: 'Expiring Medicines',
            generatedAt: new Date(),
            data: expiringMedicines.map(medicine => ({
              id: medicine.id,
              name: medicine.name,
              batchNumber: medicine.batchNumber,
              expiryDate: medicine.expiryDate,
              currentStock: medicine.currentStock,
              daysToExpiry: Math.ceil((medicine.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            }))
          };
          break;

        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }

      return res.status(200).json(report);
    } catch (error) {
      console.error('Error generating inventory report:', error);
      return res.status(500).json({ message: 'Failed to generate inventory report', error: error.message });
    }
  };
}
