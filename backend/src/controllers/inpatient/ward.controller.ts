import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Ward } from '../../models/inpatient/Ward';
import { Department } from '../../models/Department';
import { createTenantRepository } from '../../repositories/TenantRepository';

export class WardController {
  // Get all wards
  static getAllWards = async (req: Request, res: Response) => {
    try {
      const wardRepository = AppDataSource.getRepository(Ward);
      const wards = await wardRepository.find({
        relations: ['department', 'rooms'],
        order: { wardNumber: 'ASC' }
      });

      return res.json({
        success: true,
        wards
      });
    } catch (error) {
      console.error('Error fetching wards:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch wards'
      });
    }
  };

  // Get ward by ID
  static getWardById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const wardRepository = AppDataSource.getRepository(Ward);
      
      const ward = await wardRepository.findOne({
        where: { id },
        relations: ['department', 'rooms', 'rooms.beds']
      });

      if (!ward) {
        return res.status(404).json({
          success: false,
          message: 'Ward not found'
        });
      }

      return res.json({
        success: true,
        ward
      });
    } catch (error) {
      console.error('Error fetching ward:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ward'
      });
    }
  };

  // Create new ward
  static createWard = async (req: Request, res: Response) => {
    try {
      const { name, wardNumber, description, departmentId, capacity, location } = req.body;

      // Validate required fields
      if (!name || !wardNumber || !departmentId || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'Name, ward number, department, and capacity are required'
        });
      }

      const wardRepository = AppDataSource.getRepository(Ward);
      const departmentRepository = AppDataSource.getRepository(Department);

      // Check if ward number already exists
      const existingWard = await wardRepository.findOne({ where: { wardNumber } });
      if (existingWard) {
        return res.status(400).json({
          success: false,
          message: 'Ward number already exists'
        });
      }

      // Check if it's a fallback ID first (before querying database)
      let department;
      let actualDepartmentId = departmentId;
      
      // If it's a fallback ID (starts with 'dept-'), create the department
      if (departmentId.startsWith('dept-')) {
        // Map fallback IDs to department names
        const departmentNames: Record<string, string> = {
          'dept-1': 'General Medicine',
          'dept-2': 'Cardiology',
          'dept-3': 'Orthopedics',
          'dept-4': 'Pediatrics',
          'dept-5': 'Surgery',
          'dept-6': 'Gynecology',
          'dept-7': 'Neurology',
          'dept-8': 'Oncology',
          'dept-9': 'Dermatology',
          'dept-10': 'Psychiatry',
          'dept-11': 'Radiology',
          'dept-12': 'Emergency Medicine',
          'dept-13': 'ICU',
          'dept-14': 'NICU',
          'dept-15': 'PICU',
        };
        
        const deptName = departmentNames[departmentId];
        if (deptName) {
          // Check if department already exists by name
          department = await departmentRepository.findOne({ where: { name: deptName } });
          
          if (!department) {
            // Create the department if it doesn't exist
            department = departmentRepository.create({
              name: deptName,
              description: `Auto-created ${deptName} department`,
              status: 'active'
            });
            await departmentRepository.save(department);
            console.log(`Auto-created department: ${deptName} with ID: ${department.id}`);
          } else {
            console.log(`Using existing department: ${deptName} with ID: ${department.id}`);
          }
          actualDepartmentId = department.id; // Use the real UUID
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid department ID'
          });
        }
      } else {
        // It's a real UUID, verify it exists
        department = await departmentRepository.findOne({ where: { id: departmentId } });
        if (!department) {
          return res.status(404).json({
            success: false,
            message: 'Department not found'
          });
        }
      }

      // Create ward
      const ward = wardRepository.create({
        name,
        wardNumber,
        description,
        departmentId: department.id, // Use the real department ID
        capacity,
        location
      });

      await wardRepository.save(ward);

      return res.status(201).json({
        success: true,
        message: 'Ward created successfully',
        ward
      });
    } catch (error) {
      console.error('Error creating ward:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create ward'
      });
    }
  };

  // Update ward
  static updateWard = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, wardNumber, description, departmentId, capacity, location, isActive } = req.body;

      const wardRepository = AppDataSource.getRepository(Ward);
      
      const ward = await wardRepository.findOne({ where: { id } });
      if (!ward) {
        return res.status(404).json({
          success: false,
          message: 'Ward not found'
        });
      }

      // Check if ward number is being changed and if it already exists
      if (wardNumber && wardNumber !== ward.wardNumber) {
        const existingWard = await wardRepository.findOne({ where: { wardNumber } });
        if (existingWard) {
          return res.status(400).json({
            success: false,
            message: 'Ward number already exists'
          });
        }
      }

      // Update fields
      if (name) ward.name = name;
      if (wardNumber) ward.wardNumber = wardNumber;
      if (description) ward.description = description;
      if (departmentId) ward.departmentId = departmentId;
      if (capacity) ward.capacity = capacity;
      if (location !== undefined) ward.location = location;
      if (isActive !== undefined) ward.isActive = isActive;

      await wardRepository.save(ward);

      return res.json({
        success: true,
        message: 'Ward updated successfully',
        ward
      });
    } catch (error) {
      console.error('Error updating ward:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update ward'
      });
    }
  };

  // Delete ward
  static deleteWard = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const wardRepository = AppDataSource.getRepository(Ward);
      
      const ward = await wardRepository.findOne({
        where: { id },
        relations: ['rooms']
      });

      if (!ward) {
        return res.status(404).json({
          success: false,
          message: 'Ward not found'
        });
      }

      // Check if ward has rooms
      if (ward.rooms && ward.rooms.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete ward with existing rooms. Please delete rooms first.'
        });
      }

      await wardRepository.remove(ward);

      return res.json({
        success: true,
        message: 'Ward deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting ward:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete ward'
      });
    }
  };

  // Get ward occupancy statistics
  static getWardOccupancy = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const wardRepository = AppDataSource.getRepository(Ward);
      
      const ward = await wardRepository.findOne({
        where: { id },
        relations: ['rooms', 'rooms.beds', 'rooms.beds.currentAdmission']
      });

      if (!ward) {
        return res.status(404).json({
          success: false,
          message: 'Ward not found'
        });
      }

      let totalBeds = 0;
      let occupiedBeds = 0;
      let availableBeds = 0;

      ward.rooms.forEach(room => {
        room.beds.forEach(bed => {
          totalBeds++;
          if (bed.status === 'occupied' || bed.currentAdmission) {
            occupiedBeds++;
          } else if (bed.status === 'available') {
            availableBeds++;
          }
        });
      });

      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      return res.json({
        success: true,
        occupancy: {
          wardId: ward.id,
          wardName: ward.name,
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        }
      });
    } catch (error) {
      console.error('Error fetching ward occupancy:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ward occupancy'
      });
    }
  };
}
