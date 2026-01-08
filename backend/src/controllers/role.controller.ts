import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { SystemRoleCustomization } from '../models/SystemRoleCustomization';
import { UserRole, Permission, rolePermissions } from '../types/roles';
import { EmailService } from '../services/email.service';
import { In } from 'typeorm';

export class RoleController {
  
  // Get all roles (system + custom) with user counts
  static async getAllRoles(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenant?.id;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      const roleRepository = AppDataSource.getRepository(Role);
      
      // Get user counts for system roles
      const systemRoleCounts = await userRepository
        .createQueryBuilder('user')
        .select('user.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .where('user.organizationId = :tenantId', { tenantId })
        .andWhere('user.customRoleId IS NULL')
        .groupBy('user.role')
        .getRawMany();

      // Get custom roles with user counts
      const customRoles = await roleRepository
        .createQueryBuilder('role')
        .leftJoinAndSelect('role.users', 'user')
        .where('role.organizationId = :tenantId', { tenantId })
        .andWhere('role.isActive = :isActive', { isActive: true })
        .getMany();

      // Get system role customizations
      let customizations: SystemRoleCustomization[] = [];
      try {
        const customizationRepository = AppDataSource.getRepository(SystemRoleCustomization);
        customizations = await customizationRepository.find({
          where: { organizationId: tenantId }
        });
      } catch (error: any) {
        console.log('SystemRoleCustomization table not ready yet, using defaults:', error?.message || error);
        customizations = [];
      }

      // Create system role data
      const userRole = (req as any).user?.role;
      const isSaaSAdmin = userRole === UserRole.SUPER_ADMIN;
      
      // Filter system roles based on user type
      const availableRoles = isSaaSAdmin 
        ? Object.values(UserRole)
        : Object.values(UserRole).filter(role => role !== UserRole.SUPER_ADMIN);
      
      const systemRoles = availableRoles.map(role => {
        const roleCount = systemRoleCounts.find(rc => rc.role === role);
        const customization = customizations.find(c => c.systemRole === role);
        
        return {
          id: role,
          name: role,
          displayName: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `${role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} role with specific permissions`,
          permissions: customization?.customPermissions || rolePermissions[role] || [],
          userCount: parseInt(roleCount?.count || '0'),
          isSystemRole: true,
          color: customization?.customColor || getRoleColor(role),
          createdAt: customization?.createdAt || new Date(),
          updatedAt: customization?.updatedAt || new Date()
        };
      });

      // Create custom role data
      const customRoleData = customRoles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description || '',
        permissions: role.permissions,
        userCount: role.users?.length || 0,
        isSystemRole: false,
        color: role.color,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }));

      const allRoles = [...systemRoles, ...customRoleData];

      res.json({
        success: true,
        data: allRoles
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch roles' 
      });
    }
  }

  // Create a new custom role
  static async createRole(req: Request, res: Response) {
    try {
      const { displayName, description, permissions, color } = req.body;
      const tenantId = (req as any).tenant?.id;
      const userId = (req as any).user?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      if (!displayName || !description) {
        return res.status(400).json({ 
          success: false, 
          message: 'Display name and description are required' 
        });
      }

      const roleRepository = AppDataSource.getRepository(Role);
      
      // Check if role name already exists in this organization
      const roleName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const existingRole = await roleRepository.findOne({
        where: {
          name: roleName,
          organizationId: tenantId,
          isActive: true
        }
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }

      // Create new custom role
      const newRole = roleRepository.create({
        name: roleName,
        displayName,
        description,
        permissions: Array.isArray(permissions) ? permissions : [],
        organizationId: tenantId,
        isSystemRole: false,
        isActive: true,
        color: color || '#1890ff',
        userCount: 0,
        createdBy: userId
      });

      const savedRole = await roleRepository.save(newRole);

      res.json({
        success: true,
        message: 'Custom role created successfully',
        data: {
          id: savedRole.id,
          name: savedRole.name,
          displayName: savedRole.displayName,
          description: savedRole.description,
          permissions: savedRole.permissions,
          userCount: 0,
          isSystemRole: false,
          color: savedRole.color,
          createdAt: savedRole.createdAt,
          updatedAt: savedRole.updatedAt
        }
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create role' 
      });
    }
  }

  // Update role (system or custom)
  static async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { displayName, description, permissions, color } = req.body;
      const tenantId = (req as any).tenant?.id;
      const userId = (req as any).user?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      // Check if this is a system role (enum value) or custom role (UUID)
      const systemRoleValues = Object.values(UserRole);
      const isSystemRoleId = systemRoleValues.includes(id as UserRole);
      
      console.log('Role ID:', id);
      console.log('System role values:', systemRoleValues);
      console.log('Is system role?', isSystemRoleId);
      
      if (isSystemRoleId) {
        // Handle system role update - for now just return success
        const systemRole = id as UserRole;
        console.log('Updating system role:', systemRole, 'with permissions:', permissions, 'count:', Array.isArray(permissions) ? permissions.length : 0);
        
        // Get user count for this system role
        const userRepository = AppDataSource.getRepository(User);
        const userCount = await userRepository.count({
          where: {
            organizationId: tenantId,
            role: systemRole
          }
        });

        const responseData = {
          id: systemRole,
          name: systemRole,
          displayName: displayName || systemRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: description || `${systemRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} role with specific permissions`,
          permissions: Array.isArray(permissions) ? permissions : rolePermissions[systemRole] || [],
          userCount: userCount,
          isSystemRole: true,
          color: color || getRoleColor(systemRole),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Returning response data:', responseData, 'permission count:', responseData.permissions.length);
        
        res.json({
          success: true,
          message: 'System role permissions updated successfully',
          data: responseData
        });
        return;
      }

      // Handle custom role update
      console.log('Updating custom role:', id, 'with permissions:', permissions, 'count:', Array.isArray(permissions) ? permissions.length : 0);
      
      const roleRepository = AppDataSource.getRepository(Role);
      
      const role = await roleRepository.findOne({
        where: {
          id,
          organizationId: tenantId,
          isActive: true
        }
      });

      console.log('Found role in database:', role ? 'YES' : 'NO');
      if (role) {
        console.log('Current role permissions:', role.permissions, 'length:', role.permissions?.length || 0);
      }

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Update role properties
      if (displayName) {
        role.displayName = displayName;
        role.name = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
      if (description !== undefined) role.description = description;
      if (Array.isArray(permissions)) {
        console.log('Setting new permissions:', permissions, 'length:', permissions.length);
        role.permissions = permissions;
      }
      if (color) role.color = color;
      role.updatedBy = userId;

      const updatedRole = await roleRepository.save(role);

      res.json({
        success: true,
        message: 'Custom role updated successfully',
        data: {
          id: updatedRole.id,
          name: updatedRole.name,
          displayName: updatedRole.displayName,
          description: updatedRole.description,
          permissions: updatedRole.permissions,
          userCount: updatedRole.userCount,
          isSystemRole: false,
          color: updatedRole.color,
          createdAt: updatedRole.createdAt,
          updatedAt: updatedRole.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update role' 
      });
    }
  }

  // Delete custom role
  static async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      const roleRepository = AppDataSource.getRepository(Role);
      const userRepository = AppDataSource.getRepository(User);
      
      const role = await roleRepository.findOne({
        where: {
          id,
          organizationId: tenantId,
          isActive: true
        }
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      if (role.isSystemRole) {
        return res.status(400).json({
          success: false,
          message: 'System roles cannot be deleted'
        });
      }

      // Check if any users are assigned to this role
      const usersWithRole = await userRepository.count({
        where: {
          customRoleId: id,
          organizationId: tenantId,
          isActive: true
        }
      });

      if (usersWithRole > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role. ${usersWithRole} user(s) are currently assigned to this role.`
        });
      }

      // Soft delete the role
      role.isActive = false;
      await roleRepository.save(role);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete role' 
      });
    }
  }

  // Get user role assignments
  static async getUserRoleAssignments(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenant?.id;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      const users = await userRepository.find({
        where: { organizationId: tenantId },
        select: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'isActive']
      });

      const assignments = users.map(user => ({
        id: user.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        role: user.role,
        assignedDate: user.createdAt.toLocaleDateString(),
        assignedBy: 'System',
        status: user.isActive ? 'Active' : 'Inactive'
      }));

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching user role assignments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user role assignments' 
      });
    }
  }

  // Assign role to user (create new user)
  static async assignUserRole(req: Request, res: Response) {
    try {
      const { userName, userEmail, role, userPhone } = req.body;
      const tenantId = (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      if (!userName || !userEmail || !role) {
        return res.status(400).json({ 
          success: false, 
          message: 'User name, email, and role are required' 
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userEmail, organizationId: tenantId }
      });

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email already exists' 
        });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create new user
      const newUser = userRepository.create({
        firstName: userName.split(' ')[0] || userName,
        lastName: userName.split(' ').slice(1).join(' ') || 'User',
        email: userEmail,
        phone: userPhone || '0000000000',
        password: hashedPassword,
        role: role as UserRole,
        organizationId: tenantId,
        isActive: true,
        isEmailVerified: false
      });

      const savedUser = await userRepository.save(newUser);

      // Send welcome email
      try {
        const organization = (req as any).tenant;
        if (role === UserRole.NURSE) {
          await EmailService.sendNurseWelcomeEmail(
            userEmail,
            `${savedUser.firstName} ${savedUser.lastName}`,
            tempPassword,
            organization?.name || 'Hospital',
            organization?.subdomain || 'hospital'
          );
        } else if (role === UserRole.RECEPTIONIST) {
          await EmailService.sendReceptionistWelcomeEmail(
            userEmail,
            `${savedUser.firstName} ${savedUser.lastName}`,
            tempPassword,
            organization?.name || 'Hospital',
            organization?.subdomain || 'hospital'
          );
        } else if (role === UserRole.DOCTOR || role === 'staff') {
          await EmailService.sendDoctorWelcomeEmail(
            userEmail,
            `${savedUser.firstName} ${savedUser.lastName}`,
            tempPassword,
            organization?.name || 'Hospital',
            organization?.subdomain || 'hospital'
          );
        } else {
          // Use universal email for other roles
          await EmailService.sendUniversalWelcomeEmail(
            userEmail,
            `${savedUser.firstName} ${savedUser.lastName}`,
            tempPassword,
            organization?.name || 'Hospital',
            organization?.subdomain || 'hospital',
            role
          );
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the user creation if email fails
      }

      res.json({
        success: true,
        message: 'User created successfully and welcome email sent',
        data: {
          id: savedUser.id,
          userId: savedUser.id,
          userName: `${savedUser.firstName} ${savedUser.lastName}`,
          userEmail: savedUser.email,
          role: savedUser.role,
          assignedDate: savedUser.createdAt.toLocaleDateString(),
          assignedBy: 'Admin',
          status: 'Active'
        }
      });
    } catch (error) {
      console.error('Error assigning user role:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to assign user role' 
      });
    }
  }

  // Update user role assignment
  static async updateUserRoleAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const tenantId = (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      const user = await userRepository.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      user.role = role as UserRole;
      await userRepository.save(user);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          id: user.id,
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          role: user.role,
          assignedDate: user.createdAt.toLocaleDateString(),
          assignedBy: 'Admin',
          status: user.isActive ? 'Active' : 'Inactive'
        }
      });
    } catch (error) {
      console.error('Error updating user role assignment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update user role assignment' 
      });
    }
  }

  // Revoke user role (deactivate user)
  static async revokeUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      const user = await userRepository.findOne({
        where: { id, organizationId: tenantId }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      user.isActive = false;
      await userRepository.save(user);

      res.json({
        success: true,
        message: 'User role revoked successfully'
      });
    } catch (error) {
      console.error('Error revoking user role:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to revoke user role' 
      });
    }
  }

  // Bulk revoke user roles
  static async bulkRevokeUserRoles(req: Request, res: Response) {
    try {
      const { userIds } = req.body;
      const tenantId = (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization context required' 
        });
      }

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ 
          success: false, 
          message: 'User IDs array is required' 
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      
      await userRepository
        .createQueryBuilder()
        .update(User)
        .set({ isActive: false })
        .where('id IN (:...userIds)', { userIds })
        .andWhere('organizationId = :tenantId', { tenantId })
        .execute();

      res.json({
        success: true,
        message: `${userIds.length} user roles revoked successfully`
      });
    } catch (error) {
      console.error('Error bulk revoking user roles:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to bulk revoke user roles' 
      });
    }
  }
}

// Helper function to get role colors
function getRoleColor(role: UserRole): string {
  const colors: { [key in UserRole]: string } = {
    [UserRole.SUPER_ADMIN]: '#722ed1',
    [UserRole.ADMIN]: '#e91e63',
    [UserRole.DOCTOR]: '#f5222d',
    [UserRole.NURSE]: '#1890ff',
    [UserRole.PATIENT]: '#52c41a',
    [UserRole.RECEPTIONIST]: '#13c2c2',
    [UserRole.PHARMACIST]: '#fa8c16',
    [UserRole.LAB_TECHNICIAN]: '#722ed1',
    [UserRole.ACCOUNTANT]: '#8c8c8c'
  };
  return colors[role] || '#1890ff';
}
