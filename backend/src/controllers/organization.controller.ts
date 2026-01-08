import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { getTenant, getTenantId } from '../middleware/tenant.middleware';
import { NotFoundException, BadRequestException, ForbiddenException } from '../exceptions/http.exception';
import * as bcrypt from 'bcryptjs';

/**
 * Get current organization details
 * GET /api/organization
 */
export const getOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = getTenant(req);
    
    res.json({
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        subdomain: organization.subdomain,
        customDomain: organization.customDomain,
        description: organization.description,
        address: organization.address,
        phone: organization.phone,
        email: organization.email,
        settings: organization.settings,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update organization settings
 * PUT /api/organization
 */
export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);
    const { name, description, address, phone, email, settings } = req.body;

    // Only admins can update organization
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Only admins can update organization settings');
    }

    const orgRepository = AppDataSource.getRepository(Organization);
    const organization = await orgRepository.findOne({ where: { id: tenantId } });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Update fields
    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;
    if (address !== undefined) organization.address = address;
    if (phone !== undefined) organization.phone = phone;
    if (email !== undefined) organization.email = email;
    if (settings) {
      organization.settings = {
        ...organization.settings,
        ...settings
      };
    }

    await orgRepository.save(organization);

    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get organization statistics
 * GET /api/organization/stats
 */
export const getOrganizationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantId(req);

    const userRepository = AppDataSource.getRepository(User);
    
    // Count users by role
    const totalUsers = await userRepository.count({ where: { organizationId: tenantId } });
    const admins = await userRepository.count({ where: { organizationId: tenantId, role: 'admin' as any } });
    const doctors = await userRepository.count({ where: { organizationId: tenantId, role: 'doctor' as any } });
    const patients = await userRepository.count({ where: { organizationId: tenantId, role: 'patient' as any } });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins,
          doctors,
          patients,
        },
        // Add more stats as needed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new organization (Super Admin only)
 * POST /api/organizations
 */
export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, subdomain, description, adminEmail, adminPassword, adminFirstName, adminLastName } = req.body;

    // Validate required fields
    if (!name || !subdomain || !adminEmail || !adminPassword) {
      throw new BadRequestException('Name, subdomain, admin email, and admin password are required');
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      throw new BadRequestException('Subdomain must contain only lowercase letters, numbers, and hyphens');
    }

    // Reserved subdomains
    const reservedSubdomains = ['www', 'api', 'admin', 'app', 'default', 'mail', 'ftp'];
    if (reservedSubdomains.includes(subdomain)) {
      throw new BadRequestException(`Subdomain '${subdomain}' is reserved`);
    }

    const orgRepository = AppDataSource.getRepository(Organization);
    const userRepository = AppDataSource.getRepository(User);

    // Check if subdomain already exists
    const existingOrg = await orgRepository.findOne({ where: { subdomain } });
    if (existingOrg) {
      throw new BadRequestException(`Subdomain '${subdomain}' is already taken`);
    }

    // Check if admin email already exists
    const existingUser = await userRepository.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      throw new BadRequestException(`Email '${adminEmail}' is already registered`);
    }

    // Create organization
    const organization = orgRepository.create({
      name,
      subdomain,
      description,
      settings: {
        subscription: {
          plan: 'trial',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
        features: {
          pharmacy: true,
          laboratory: true,
          inpatient: true,
          radiology: true,
        },
        limits: {
          maxUsers: 50,
          maxPatients: 1000,
          maxStorage: 10, // GB
        }
      },
      isActive: true,
    });

    await orgRepository.save(organization);

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName || 'Admin',
      lastName: adminLastName || 'User',
      phone: '0000000000',
      role: 'admin' as any,
      organizationId: organization.id,
      isActive: true,
    });

    await userRepository.save(adminUser);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          subdomain: organization.subdomain,
          url: `https://${subdomain}.yourhospital.com`,
        },
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all organizations (Super Admin only)
 * GET /api/organizations
 */
export const listOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgRepository = AppDataSource.getRepository(Organization);
    
    const organizations = await orgRepository.find({
      order: { createdAt: 'DESC' }
    });

    res.json({
      success: true,
      data: organizations.map(org => ({
        id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        isActive: org.isActive,
        subscription: org.settings?.subscription,
        createdAt: org.createdAt,
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate organization (Super Admin only)
 * DELETE /api/organizations/:id
 */
export const deactivateOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const orgRepository = AppDataSource.getRepository(Organization);
    const organization = await orgRepository.findOne({ where: { id } });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Don't allow deactivating default organization
    if (organization.subdomain === 'default') {
      throw new BadRequestException('Cannot deactivate default organization');
    }

    organization.isActive = false;
    await orgRepository.save(organization);

    res.json({
      success: true,
      message: 'Organization deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};
