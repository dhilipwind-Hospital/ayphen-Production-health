import { Request, Response } from 'express';
import Prescription from '../models/Prescription';
import PrescriptionItem from '../models/PrescriptionItem';
import User from '../models/User';
import Patient from '../models/Patient';
import Medicine from '../models/Medicine';
import { Op } from 'sequelize';
import { createTenantRepository } from '../repositories/TenantRepository';

// Create a new prescription
export const createPrescription = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, diagnosis, notes, prescriptionDate, items } = req.body;
    
    // Validate required fields
    if (!patientId || !doctorId || !diagnosis || !prescriptionDate || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create prescription in database
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      diagnosis,
      notes,
      prescriptionDate,
      status: 'pending',
    });
    
    // Create prescription items
    const prescriptionItems = await Promise.all(
      items.map((item: any) => PrescriptionItem.create({
        prescriptionId: prescription.id,
        medicineId: item.medicineId,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        status: 'pending',
      }))
    );
    
    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription: {
        ...prescription.toJSON(),
        items: prescriptionItems,
      },
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get prescriptions by doctor
export const getPrescriptionsByDoctor = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    
    const prescriptions = await Prescription.findAll({
      where: { doctorId },
      include: [
        { 
          model: User, 
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'specialization'] 
        },
        { 
          model: Patient, 
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] 
        },
        { 
          model: PrescriptionItem, 
          as: 'items',
          include: [{ 
            model: Medicine, 
            as: 'medicine',
            attributes: ['id', 'name', 'dosageForm', 'strength'] 
          }] 
        },
      ],
      order: [['prescriptionDate', 'DESC']],
    });
    
    return res.status(200).json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get prescriptions by patient
export const getPrescriptionsByPatient = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await Prescription.findAll({
      where: { patientId },
      include: [
        { 
          model: User, 
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'specialization'] 
        },
        { 
          model: Patient, 
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] 
        },
        { 
          model: PrescriptionItem, 
          as: 'items',
          include: [{ 
            model: Medicine, 
            as: 'medicine',
            attributes: ['id', 'name', 'dosageForm', 'strength'] 
          }] 
        },
      ],
      order: [['prescriptionDate', 'DESC']],
    });
    
    return res.status(200).json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get prescriptions for pharmacy
export const getPharmacyPrescriptions = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    
    const prescriptions = await Prescription.findAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'specialization'] 
        },
        { 
          model: Patient, 
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] 
        },
        { 
          model: PrescriptionItem, 
          as: 'items',
          include: [{ 
            model: Medicine, 
            as: 'medicine',
            attributes: ['id', 'name', 'dosageForm', 'strength', 'currentStock'] 
          }] 
        },
      ],
      order: [['prescriptionDate', 'DESC']],
    });
    
    return res.status(200).json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a single prescription by ID
export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'specialization'] 
        },
        { 
          model: Patient, 
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] 
        },
        { 
          model: PrescriptionItem, 
          as: 'items',
          include: [{ 
            model: Medicine, 
            as: 'medicine',
            attributes: ['id', 'name', 'dosageForm', 'strength', 'currentStock'] 
          }] 
        },
      ],
    });
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    return res.status(200).json({ prescription });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update prescription status (for pharmacy dispensing)
export const updatePrescriptionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid items data' });
    }
    
    const prescription = await Prescription.findByPk(id, {
      include: [{ model: PrescriptionItem, as: 'items' }],
    });
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    // Update each prescription item
    await Promise.all(
      items.map(async (item: any) => {
        await PrescriptionItem.update(
          { status: item.status },
          { where: { id: item.id } }
        );
        
        // If item is dispensed, update medicine stock
        if (item.status === 'dispensed') {
          const prescriptionItem = await PrescriptionItem.findByPk(item.id);
          if (prescriptionItem) {
            await Medicine.decrement(
              'currentStock',
              { by: prescriptionItem.quantity, where: { id: prescriptionItem.medicineId } }
            );
          }
        }
      })
    );
    
    // Determine overall prescription status
    const updatedItems = await PrescriptionItem.findAll({
      where: { prescriptionId: id },
    });
    
    const allDispensed = updatedItems.every(item => item.status === 'dispensed');
    const anyDispensed = updatedItems.some(item => item.status === 'dispensed');
    const anyOutOfStock = updatedItems.some(item => item.status === 'out_of_stock');
    
    let newStatus = 'pending';
    if (allDispensed) {
      newStatus = 'dispensed';
    } else if (anyDispensed || anyOutOfStock) {
      newStatus = 'partially_dispensed';
    }
    
    await prescription.update({ status: newStatus });
    
    // Get updated prescription with all relations
    const updatedPrescription = await Prescription.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'specialization'] 
        },
        { 
          model: Patient, 
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] 
        },
        { 
          model: PrescriptionItem, 
          as: 'items',
          include: [{ 
            model: Medicine, 
            as: 'medicine',
            attributes: ['id', 'name', 'dosageForm', 'strength', 'currentStock'] 
          }] 
        },
      ],
    });
    
    return res.status(200).json({
      message: 'Prescription status updated successfully',
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update prescription (for doctors to edit pending prescriptions)
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnosis, notes, prescriptionDate, items } = req.body;
    
    const prescription = await Prescription.findByPk(id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    if (prescription.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending prescriptions can be updated' });
    }
    
    // Update prescription
    await prescription.update({
      diagnosis,
      notes,
      prescriptionDate,
    });
    
    // Handle items
    if (items && Array.isArray(items)) {
      // Get existing items
      const existingItems = await PrescriptionItem.findAll({
        where: { prescriptionId: id },
      });
      
      // Items to delete (not in the updated list)
      const existingItemIds = existingItems.map(item => item.id);
      const updatedItemIds = items.filter(item => item.id).map(item => item.id);
      const itemsToDelete = existingItemIds.filter(id => !updatedItemIds.includes(id));
      
      // Delete items
      if (itemsToDelete.length > 0) {
        await PrescriptionItem.destroy({
          where: { id: { [Op.in]: itemsToDelete } },
        });
      }
      
      // Update or create items
      await Promise.all(
        items.map(async (item: any) => {
          if (item.id) {
            // Update existing item
            await PrescriptionItem.update(
              {
                medicineId: item.medicineId,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                quantity: item.quantity,
                instructions: item.instructions,
              },
              { where: { id: item.id } }
            );
          } else {
            // Create new item
            await PrescriptionItem.create({
              prescriptionId: id,
              medicineId: item.medicineId,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              quantity: item.quantity,
              instructions: item.instructions,
              status: 'pending',
            });
          }
        })
      );
    }
    
    // Get updated prescription with all relations
    const updatedPrescription = await Prescription.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'specialization'] 
        },
        { 
          model: Patient, 
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'age', 'gender'] 
        },
        { 
          model: PrescriptionItem, 
          as: 'items',
          include: [{ 
            model: Medicine, 
            as: 'medicine',
            attributes: ['id', 'name', 'dosageForm', 'strength'] 
          }] 
        },
      ],
    });
    
    return res.status(200).json({
      message: 'Prescription updated successfully',
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel a prescription
export const cancelPrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const prescription = await Prescription.findByPk(id);
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    if (prescription.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending prescriptions can be cancelled' });
    }
    
    // Update prescription status
    await prescription.update({ status: 'cancelled' });
    
    // Update all items to cancelled
    await PrescriptionItem.update(
      { status: 'cancelled' },
      { where: { prescriptionId: id } }
    );
    
    return res.status(200).json({
      message: 'Prescription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
