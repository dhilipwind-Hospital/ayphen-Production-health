import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Prescription, PrescriptionStatus } from '../../models/pharmacy/Prescription';
import { PrescriptionItem, PrescriptionItemStatus } from '../../models/pharmacy/PrescriptionItem';
import { Medicine } from '../../models/pharmacy/Medicine';
import { MedicineTransaction, TransactionType } from '../../models/pharmacy/MedicineTransaction';
import { validate } from 'class-validator';
import { User } from '../../models/User';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class PrescriptionController {
  // Create a new prescription (for doctors)
  static createPrescription = async (req: Request, res: Response) => {
    try {
      const { patientId, items, diagnosis, notes } = req.body;
      
      // Get doctor ID and tenant context from authenticated user
      const doctorId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!doctorId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Validate required fields
      if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Patient ID and at least one prescription item are required' });
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Create prescription
        const prescriptionRepository = queryRunner.manager.getRepository(Prescription);
        const prescription = prescriptionRepository.create({
          doctorId,
          patientId,
          prescriptionDate: new Date(),
          diagnosis,
          notes,
          status: PrescriptionStatus.PENDING,
          organizationId: tenantId
        });

        // Validate prescription
        const errors = await validate(prescription);
        if (errors.length > 0) {
          return res.status(400).json({ message: 'Validation failed', errors });
        }

        // Save prescription
        const savedPrescription = await prescriptionRepository.save(prescription);

        // Create prescription items
        const prescriptionItemRepository = queryRunner.manager.getRepository(PrescriptionItem);
        const medicineRepository = queryRunner.manager.getRepository(Medicine);
        
        const savedItems = [];
        for (const item of items) {
          // CRITICAL: Check if medicine exists AND belongs to this organization
          const medicine = await medicineRepository.findOne({
            where: { id: item.medicineId, organizationId: tenantId }
          });
          if (!medicine) {
            throw new Error(`Medicine with ID ${item.medicineId} not found`);
          }

          // Create prescription item
          const prescriptionItem = prescriptionItemRepository.create({
            prescriptionId: savedPrescription.id,
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            quantity: item.quantity,
            status: PrescriptionItemStatus.PENDING,
            organizationId: tenantId
          });

          // Validate prescription item
          const itemErrors = await validate(prescriptionItem);
          if (itemErrors.length > 0) {
            throw new Error(`Validation failed for prescription item: ${JSON.stringify(itemErrors)}`);
          }

          // Save prescription item
          const savedItem = await prescriptionItemRepository.save(prescriptionItem);
          savedItems.push(savedItem);
        }

        // Commit transaction
        await queryRunner.commitTransaction();

        // Send prescription notification email
        try {
          const userRepository = AppDataSource.getRepository(User);
          // CRITICAL: Filter patient and doctor by organizationId
          const patient = await userRepository.findOne({
            where: { id: patientId, organizationId: tenantId }
          });
          const doctor = await userRepository.findOne({
            where: { id: doctorId, organizationId: tenantId }
          });
          
          if (patient && doctor) {
            const { EmailService } = await import('../../services/email.service');
            EmailService.sendPrescriptionNotificationEmail(
              patient.email,
              `${patient.firstName} ${patient.lastName}`,
              `${doctor.firstName} ${doctor.lastName}`
            ).catch(err => console.error('Failed to send prescription notification email:', err));
          }
        } catch (emailError) {
          console.error('Email service error:', emailError);
        }

        return res.status(201).json({
          message: 'Prescription created successfully',
          prescription: {
            ...savedPrescription,
            items: savedItems
          }
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
      console.error('Error creating prescription:', error);
      return res.status(500).json({ message: 'Failed to create prescription', error: error.message });
    }
  };

  // Get prescriptions by patient
  static getPatientPrescriptions = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { patientId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const prescriptionRepository = AppDataSource.getRepository(Prescription);

      // CRITICAL: Filter prescriptions by organizationId
      const [prescriptions, total] = await prescriptionRepository.findAndCount({
        where: { patientId, organizationId: tenantId },
        relations: ['doctor', 'patient', 'items', 'items.medicine'],
        skip,
        take,
        order: { prescriptionDate: 'DESC' }
      });

      return res.status(200).json({
        prescriptions,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting patient prescriptions:', error);
      return res.status(500).json({ message: 'Failed to get patient prescriptions', error: error.message });
    }
  };

  // Get single prescription by ID
  static getPrescriptionById = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { id } = req.params;
      const prescriptionRepository = AppDataSource.getRepository(Prescription);

      // CRITICAL: Filter prescription by organization_id
      const prescription = await prescriptionRepository.findOne({
        where: { id, organizationId: tenantId },
        relations: ['patient', 'doctor', 'items', 'items.medicine']
      });

      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      return res.status(200).json({ data: prescription });
    } catch (error) {
      console.error('Error getting prescription:', error);
      return res.status(500).json({ message: 'Failed to get prescription', error: (error as any).message });
    }
  };

  // Get prescriptions by doctor
  static getDoctorPrescriptions = async (req: Request, res: Response) => {
    try {
      // Get doctor ID from authenticated user
      const doctorId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!doctorId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { page = 1, limit = 10, status } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const prescriptionRepository = AppDataSource.getRepository(Prescription);

      // Build query conditions - CRITICAL: Include organizationId filter
      const whereConditions: any = { doctorId, organizationId: tenantId };

      if (status) {
        whereConditions.status = status;
      }

      const [prescriptions, total] = await prescriptionRepository.findAndCount({
        where: whereConditions,
        relations: ['patient', 'doctor', 'items', 'items.medicine'],
        skip,
        take,
        order: { prescriptionDate: 'DESC' }
      });

      return res.status(200).json({
        prescriptions,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting doctor prescriptions:', error);
      return res.status(500).json({ message: 'Failed to get doctor prescriptions', error: error.message });
    }
  };

  // Get pending prescriptions (for pharmacy)
  static getPendingPrescriptions = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const prescriptionRepository = AppDataSource.getRepository(Prescription);

      // CRITICAL: Filter pending prescriptions by organizationId
      const [prescriptions, total] = await prescriptionRepository.findAndCount({
        where: { status: PrescriptionStatus.PENDING, organizationId: tenantId },
        relations: ['doctor', 'patient', 'items', 'items.medicine'],
        skip,
        take,
        order: { prescriptionDate: 'ASC' }
      });

      return res.status(200).json({
        prescriptions,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting pending prescriptions:', error);
      return res.status(500).json({ message: 'Failed to get pending prescriptions', error: error.message });
    }
  };

  // Update prescription status (dispense)
  static dispensePrescription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { items } = req.body;

      // Get pharmacist ID from authenticated user
      const pharmacistId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!pharmacistId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Prescription items are required' });
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get prescription - CRITICAL: Filter by organizationId
        const prescriptionRepository = queryRunner.manager.getRepository(Prescription);
        const prescription = await prescriptionRepository.findOne({
          where: { id, organizationId: tenantId },
          relations: ['items']
        });

        if (!prescription) {
          return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.status === PrescriptionStatus.DISPENSED) {
          return res.status(400).json({ message: 'Prescription has already been dispensed' });
        }

        if (prescription.status === PrescriptionStatus.CANCELLED) {
          return res.status(400).json({ message: 'Cannot dispense a cancelled prescription' });
        }

        // Update prescription items
        const prescriptionItemRepository = queryRunner.manager.getRepository(PrescriptionItem);
        const medicineRepository = queryRunner.manager.getRepository(Medicine);
        const medicineTransactionRepository = queryRunner.manager.getRepository(MedicineTransaction);
        
        let allItemsDispensed = true;
        
        for (const itemUpdate of items) {
          // Find prescription item
          const prescriptionItem = await prescriptionItemRepository.findOne({
            where: { id: itemUpdate.id, prescriptionId: id }
          });

          if (!prescriptionItem) {
            throw new Error(`Prescription item with ID ${itemUpdate.id} not found`);
          }

          // Update prescription item status
          prescriptionItem.status = itemUpdate.status;
          await prescriptionItemRepository.save(prescriptionItem);

          // If item is dispensed, update medicine stock
          if (itemUpdate.status === PrescriptionItemStatus.DISPENSED) {
            // CRITICAL: Get medicine filtered by organizationId
            const medicine = await medicineRepository.findOne({
              where: { id: prescriptionItem.medicineId, organizationId: tenantId }
            });

            if (!medicine) {
              throw new Error(`Medicine with ID ${prescriptionItem.medicineId} not found`);
            }

            // Check if enough stock
            if (medicine.currentStock < prescriptionItem.quantity) {
              throw new Error(`Not enough stock for medicine ${medicine.name}`);
            }

            // Update medicine stock
            medicine.currentStock -= prescriptionItem.quantity;
            await medicineRepository.save(medicine);

            // Create medicine transaction
            const transaction = medicineTransactionRepository.create({
              medicineId: medicine.id,
              transactionType: TransactionType.SALE,
              quantity: prescriptionItem.quantity,
              transactionDate: new Date(),
              reference: `Prescription: ${prescription.id}`,
              performedById: pharmacistId
            });

            await medicineTransactionRepository.save(transaction);
          } else {
            allItemsDispensed = false;
          }
        }

        // Update prescription status
        prescription.status = allItemsDispensed ? 
          PrescriptionStatus.DISPENSED : 
          PrescriptionStatus.PARTIALLY_DISPENSED;
        
        await prescriptionRepository.save(prescription);

        // Commit transaction
        await queryRunner.commitTransaction();

        return res.status(200).json({
          message: 'Prescription dispensed successfully',
          prescription
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
      console.error('Error dispensing prescription:', error);
      return res.status(500).json({ message: 'Failed to dispense prescription', error: error.message });
    }
  };

  // Cancel prescription
  static cancelPrescription = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Get user ID from authenticated user
      const userId = (req as any).user?.id;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organization_id;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Start a transaction
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get prescription - CRITICAL: Filter by organizationId
        const prescriptionRepository = queryRunner.manager.getRepository(Prescription);
        const prescription = await prescriptionRepository.findOne({
          where: { id, organizationId: tenantId },
          relations: ['items']
        });

        if (!prescription) {
          return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.status === PrescriptionStatus.DISPENSED) {
          return res.status(400).json({ message: 'Cannot cancel a dispensed prescription' });
        }

        if (prescription.status === PrescriptionStatus.CANCELLED) {
          return res.status(400).json({ message: 'Prescription is already cancelled' });
        }

        // Update prescription status
        prescription.status = PrescriptionStatus.CANCELLED;
        prescription.notes = prescription.notes ? 
          `${prescription.notes}\n\nCancelled: ${reason}` : 
          `Cancelled: ${reason}`;
        
        await prescriptionRepository.save(prescription);

        // Update all pending prescription items to cancelled
        const prescriptionItemRepository = queryRunner.manager.getRepository(PrescriptionItem);
        for (const item of prescription.items) {
          if (item.status === PrescriptionItemStatus.PENDING) {
            item.status = PrescriptionItemStatus.CANCELLED;
            await prescriptionItemRepository.save(item);
          }
        }

        // Commit transaction
        await queryRunner.commitTransaction();

        return res.status(200).json({
          message: 'Prescription cancelled successfully',
          prescription
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
      console.error('Error cancelling prescription:', error);
      return res.status(500).json({ message: 'Failed to cancel prescription', error: error.message });
    }
  };
}
