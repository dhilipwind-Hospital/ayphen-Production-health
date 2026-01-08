import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserResponse, UpdateProfileDto } from '../models/User';
import { Organization } from '../models/Organization';
import { Appointment } from '../models/Appointment';
import { UserRole } from '../types/roles';
import { EmailService } from '../services/email.service';

export class UserController {
  // Admin: list users with filters (role, search, status)
  static listUsers = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(User);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const {
      page = '1',
      limit = '10',
      role,
      search = '',
      status,
    } = req.query as any;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    try {
      const qb = repo.createQueryBuilder('user')
        .leftJoinAndSelect('user.department', 'department')
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(limitNum);

      // CRITICAL: Filter by organization_id for multi-tenancy isolation
      if (tenantId) {
        qb.andWhere('user.organization_id = :tenantId', { tenantId });
      } else {
        // If no tenant context, return empty result to prevent data leakage
        return res.json({ data: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
      }

      if (role) qb.andWhere('user.role = :role', { role });
      // Default to active users only unless explicitly requesting inactive
      if (status) {
        if (String(status).toLowerCase() === 'active') qb.andWhere('user.isActive = true');
        else if (String(status).toLowerCase() === 'inactive') qb.andWhere('user.isActive = false');
      } else {
        // Default: only show active users
        qb.andWhere('user.isActive = true');
      }
      if (search) {
        qb.andWhere('(LOWER(user.firstName) LIKE :q OR LOWER(user.lastName) LIKE :q OR LOWER(user.email) LIKE :q OR user.phone LIKE :q2)', {
          q: `%${String(search).toLowerCase()}%`, q2: `%${String(search)}%`
        });
      }

      const [items, total] = await qb.getManyAndCount();
      return res.json({ data: items, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (e) {
      console.error('Error listing users:', e);
      return res.status(500).json({ message: 'Error listing users' });
    }
  };

  // Self: set my organization (Option B hospital selection)
  static setMyOrganization = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { organizationId, subdomain } = (req.body || {}) as { organizationId?: string; subdomain?: string };
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    if (!organizationId && !subdomain) return res.status(400).json({ message: 'organizationId or subdomain is required' });

    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organization);
    try {
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const where: any = organizationId ? { id: organizationId } : { subdomain: String(subdomain).toLowerCase() };
      const org = await orgRepo.findOne({ where });
      if (!org || !org.isActive) return res.status(404).json({ message: 'Organization not found or inactive' });

      (user as any).organizationId = org.id;
      await userRepo.save(user);

      // Return minimal profile with org
      const { password, ...rest } = user as any;
      return res.json({ ...rest, organizationId: org.id });
    } catch (e) {
      console.error('setMyOrganization error:', e);
      return res.status(500).json({ message: 'Failed to set organization' });
    }
  };

  // Doctor: list patients under my care (seen via any appointment)
  static listDoctorPatients = async (req: Request, res: Response) => {
    const doctorId = (req as any).user?.id as string | undefined;
    const { page = '1', limit = '10', search = '', startDate, endDate } = req.query as any;
    if (!doctorId) return res.status(401).json({ message: 'Authentication required' });
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = Math.min(parseInt(String(limit), 10) || 10, 100);
    const skip = (pageNum - 1) * limitNum;
    try {
      const apptRepo = AppDataSource.getRepository(Appointment);
      const qb = apptRepo.createQueryBuilder('a')
        .leftJoin('a.patient', 'patient')
        .leftJoin('a.doctor', 'doctor')
        .where('doctor.id = :doctorId', { doctorId })
        .andWhere('patient.id IS NOT NULL')
        .select([
          'patient.id as id',
          'patient.firstName as firstName',
          'patient.lastName as lastName',
          'patient.email as email',
          'patient.phone as phone',
          'MAX(a.startTime) as lastVisit',
          'COUNT(*) as visitCount',
          "MIN(CASE WHEN a.startTime > NOW() THEN a.startTime ELSE NULL END) as nextVisit"
        ])
        .groupBy('patient.id, patient.firstName, patient.lastName, patient.email, patient.phone')
        .orderBy('lastVisit', 'DESC')
        .offset(skip)
        .limit(limitNum);
      if (startDate && endDate) {
        qb.andWhere('a.startTime BETWEEN :start AND :end', {
          start: new Date(String(startDate)),
          end: new Date(String(endDate))
        });
      }
      if (search) {
        qb.andHaving('(LOWER(patient.firstName) LIKE :q OR LOWER(patient.lastName) LIKE :q OR LOWER(patient.email) LIKE :q OR patient.phone LIKE :q2)', {
          q: `%${String(search).toLowerCase()}%`, q2: `%${String(search)}%`
        });
      }
      const rows = await qb.getRawMany();
      // Total distinct patients count
      const totalQb = apptRepo.createQueryBuilder('a')
        .leftJoin('a.patient', 'patient')
        .leftJoin('a.doctor', 'doctor')
        .where('doctor.id = :doctorId', { doctorId })
        .andWhere('patient.id IS NOT NULL')
        .andWhere(startDate && endDate ? 'a.startTime BETWEEN :start AND :end' : '1=1', startDate && endDate ? {
          start: new Date(String(startDate)),
          end: new Date(String(endDate))
        } : {})
        .select('COUNT(DISTINCT patient.id)', 'cnt');
      const total = parseInt((await totalQb.getRawOne())?.cnt || '0', 10);
      return res.json({ data: rows, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
    } catch (e) {
      console.error('List doctor patients error:', e);
      return res.status(500).json({ message: 'Failed to list patients' });
    }
  };

  // Doctor: export patients under my care to CSV
  static listDoctorPatientsCsv = async (req: Request, res: Response) => {
    const doctorId = (req as any).user?.id as string | undefined;
    const { search = '', startDate, endDate } = req.query as any;
    if (!doctorId) return res.status(401).json({ message: 'Authentication required' });
    try {
      const apptRepo = AppDataSource.getRepository(Appointment);
      const qb = apptRepo.createQueryBuilder('a')
        .leftJoin('a.patient', 'patient')
        .leftJoin('a.doctor', 'doctor')
        .where('doctor.id = :doctorId', { doctorId })
        .andWhere('patient.id IS NOT NULL')
        .select([
          'patient.firstName as firstName',
          'patient.lastName as lastName',
          'patient.email as email',
          'patient.phone as phone',
          'MAX(a.startTime) as lastVisit',
          'COUNT(*) as visitCount',
          "MIN(CASE WHEN a.startTime > NOW() THEN a.startTime ELSE NULL END) as nextVisit"
        ])
        .groupBy('patient.id, patient.firstName, patient.lastName, patient.email, patient.phone')
        .orderBy('lastVisit', 'DESC');
      if (startDate && endDate) {
        qb.andWhere('a.startTime BETWEEN :start AND :end', {
          start: new Date(String(startDate)),
          end: new Date(String(endDate))
        });
      }
      if (search) {
        qb.andHaving('(LOWER(patient.firstName) LIKE :q OR LOWER(patient.lastName) LIKE :q OR LOWER(patient.email) LIKE :q OR patient.phone LIKE :q2)', {
          q: `%${String(search).toLowerCase()}%`, q2: `%${String(search)}%`
        });
      }
      const rows = await qb.getRawMany();
      const header = ['First Name','Last Name','Email','Phone','Last Visit','Next Appointment','Visits'];
      const csv = [header, ...rows.map((r: any) => [
        r.firstname ?? r.firstName ?? '',
        r.lastname ?? r.lastName ?? '',
        r.email ?? '',
        r.phone ?? '',
        (r.lastvisit ?? r.lastVisit ?? '') && new Date(r.lastvisit ?? r.lastVisit).toISOString(),
        (r.nextvisit ?? r.nextVisit ?? '') && new Date(r.nextvisit ?? r.nextVisit).toISOString(),
        String(r.visitcount ?? r.visitCount ?? '0')
      ])]
      .map(row => row.map(v => String(v ?? '').replace(/"/g,'""')).map(v => `"${v}"`).join(','))
      .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="my-patients.csv"');
      return res.send(csv);
    } catch (e) {
      console.error('Export doctor patients CSV error:', e);
      return res.status(500).json({ message: 'Failed to export patients' });
    }
  };
  // Get current user profile
  static getCurrentUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Fetch fresh user data from database with organization relationship
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['organization']
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive information
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ message: 'Error getting user profile' });
    }
  };

  // Update user profile
  static updateProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const updateData: UpdateProfileDto = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update allowed fields
      const allowedUpdates: (keyof UpdateProfileDto)[] = [
        'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
        'address', 'city', 'state', 'country', 'postalCode', 'profileImage', 'preferences'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          (user as any)[field] = updateData[field];
        }
      });

      await userRepository.save(user);

      // Return updated user (excluding sensitive data)
      const { password, ...userData } = user;
      return res.json(userData);
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Error updating profile' });
    }
  };

  // Get user's appointments
  static getUserAppointments = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { status, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: [
          'appointments',
          'appointments.service',
          'appointments.doctor'
        ]
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let appointments = user.appointments || [];

      // Apply filters
      if (status) {
        appointments = appointments.filter(a => a.status === status);
      }

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        appointments = appointments.filter(a => {
          const apptDate = new Date(a.startTime);
          return apptDate >= start && apptDate <= end;
        });
      }

      // Sort by start time (newest first)
      appointments.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      return res.json(appointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      return res.status(500).json({ message: 'Error fetching appointments' });
    }
  };

  // Get user's medical records (placeholder - to be implemented)
  static getMedicalRecords = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // This is a placeholder implementation
    // In a real application, this would fetch medical records from a records service
    try {
      // Return empty array for now
      return res.json([]);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return res.status(500).json({ message: 'Error fetching medical records' });
    }
  };

  // Admin: update any user's profile and role/status
  static adminUpdateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: Partial<UpdateProfileDto & { role: UserRole; isActive: boolean; departmentId?: string; primaryDepartmentId?: string }> = req.body || {};
    const userRepository = AppDataSource.getRepository(User);
    try {
      const user = await userRepository.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const allowed: (keyof typeof updateData)[] = ['firstName','lastName','phone','dateOfBirth','gender','address','city','state','country','postalCode','profileImage','preferences','role','isActive','departmentId','primaryDepartmentId'];
      for (const key of allowed) {
        if ((updateData as any)[key] !== undefined) {
          (user as any)[key] = (updateData as any)[key];
        }
      }
      await userRepository.save(user);
      const { password, ...rest } = user as any;
      return res.json(rest);
    } catch (e) {
      console.error('Admin update user error:', e);
      return res.status(500).json({ message: 'Failed to update user' });
    }
  };

  // Reusable: build filtered query for users (admin)
  static buildUserQuery(repo = AppDataSource.getRepository(User), query: any) {
    const {
      role,
      search = '',
      status,
      sortBy = 'user.createdAt',
      sortOrder = 'DESC',
      tenantId,
    } = query || {};
    const qb = repo.createQueryBuilder('user').orderBy(sortBy, String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    // Filter by organization
    if (tenantId) {
      qb.andWhere('user.organizationId = :tenantId', { tenantId });
    }

    if (role) qb.andWhere('user.role = :role', { role });
    if (status) {
      if (String(status).toLowerCase() === 'active') qb.andWhere('user.isActive = true');
      else if (String(status).toLowerCase() === 'inactive') qb.andWhere('user.isActive = false');
    }
    if (search) {
      qb.andWhere('(LOWER(user.firstName) LIKE :q OR LOWER(user.lastName) LIKE :q OR LOWER(user.email) LIKE :q OR user.phone LIKE :q2)', {
        q: `%${String(search).toLowerCase()}%`, q2: `%${String(search)}%`
      });
    }
    return qb;
  }

  // Admin: get user by id
  static adminGetUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    try {
      const repo = AppDataSource.getRepository(User);
      const where: any = { id };
      // Ensure user belongs to the same organization
      if (tenantId) {
        where.organizationId = tenantId;
      }
      const user = await repo.findOne({ where });
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (e) {
      console.error('Admin get user error:', e);
      return res.status(500).json({ message: 'Failed to get user' });
    }
  };

  // Admin: create user (patient by default)
  static adminCreateUser = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(User);
    // CRITICAL: Prioritize authenticated user's organization over tenant context
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    
    if (!tenantId) {
      console.error('User creation failed: No tenant context available. User may need to log out and log back in.');
      return res.status(400).json({ 
        message: 'Organization context required. Please specify hospital subdomain or organization ID.' 
      });
    }
    
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        role = 'patient',
        isActive = true,
        password,
        departmentId,
        specialization,
        qualification,
        experience,
        consultationFee,
        licenseNumber,
        address,
        emergencyContact,
        workingDays,
        availableFrom,
        availableTo,
        joinDate
      } = req.body || {};

      if (!firstName || !lastName || !phone) {
        return res.status(400).json({ message: 'firstName, lastName and phone are required' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'email is required' });
      }
      const exists = await repo.findOne({ where: { email } });
      if (exists) return res.status(409).json({ message: 'Email already exists' });

      const user = new User();
      user.firstName = firstName;
      user.lastName = lastName;
      (user as any).email = email;
      user.phone = phone;
      (user as any).role = role;
      (user as any).isActive = Boolean(isActive);

      // CRITICAL: Set organization_id for multi-tenancy isolation
      if (tenantId) {
        user.organizationId = tenantId;
      }

      // Set doctor-specific fields
      if (departmentId) {
        user.departmentId = departmentId;
      }
      if (specialization) {
        user.specialization = specialization;
      }
      if (qualification) {
        user.qualification = qualification;
      }
      if (experience !== undefined) {
        user.experience = experience;
      }
      if (consultationFee !== undefined) {
        user.consultationFee = consultationFee;
      }
      if (licenseNumber) {
        user.licenseNumber = licenseNumber;
      }
      if (address) {
        user.address = address;
      }
      if (emergencyContact) {
        user.emergencyContact = emergencyContact;
      }
      if (workingDays) {
        user.workingDays = workingDays;
      }
      if (availableFrom) {
        user.availableFrom = availableFrom;
      }
      if (availableTo) {
        user.availableTo = availableTo;
      }
      if (joinDate) {
        user.joinDate = joinDate;
      }

      // Use provided password or generate a random one
      const tempPassword = password || (Math.random().toString(36).slice(2) + 'A1!');
      (user as any).password = tempPassword;
      if (typeof (user as any).hashPassword === 'function') await (user as any).hashPassword();
      const saved = await repo.save(user);

      // Send welcome email for ALL roles (universal system)
      if (email && role) {
        try {
          const org = await AppDataSource.getRepository(Organization).findOne({
            where: { id: tenantId }
          });

          // Use role-specific templates for existing roles, universal for others
          if (role === 'nurse') {
            await EmailService.sendNurseWelcomeEmail(
              email,
              firstName,
              tempPassword,
              org?.name || 'Hospital',
              org?.subdomain || 'hospital'
            );
            console.log(`📧 Nurse welcome email sent to ${email}`);
          } else if (role === 'receptionist') {
            await EmailService.sendReceptionistWelcomeEmail(
              email,
              firstName,
              tempPassword,
              org?.name || 'Hospital',
              org?.subdomain || 'hospital'
            );
            console.log(`📧 Receptionist welcome email sent to ${email}`);
          } else if (role === 'doctor' || role === 'staff') {
            await EmailService.sendDoctorWelcomeEmail(
              email,
              firstName,
              tempPassword,
              org?.name || 'Hospital',
              org?.subdomain || 'hospital'
            );
            console.log(`📧 ${role} welcome email sent to ${email}`);
          } else {
            // Universal email for all other roles (super_admin, admin, patient, pharmacist, lab_technician, accountant)
            await EmailService.sendUniversalWelcomeEmail(
              email,
              firstName,
              tempPassword,
              org?.name || 'Hospital',
              org?.subdomain || 'hospital',
              role
            );
            console.log(`📧 ${role} welcome email sent to ${email}`);
          }
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Continue without failing the user creation
        }
      }

      const { password: _, ...rest } = saved as any;
      return res.status(201).json(rest);
    } catch (e) {
      console.error('Admin create user error:', e);
      return res.status(500).json({ message: 'Failed to create user' });
    }
  };

  // Admin: delete user
  static adminDeleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(User);
    try {
      const user = await repo.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      await repo.remove(user);
      return res.json({ message: 'User deleted' });
    } catch (e) {
      console.error('Admin delete user error:', e);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  };

  // Admin: bulk delete users
  static adminBulkDeleteUsers = async (req: Request, res: Response) => {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids is required' });
    const repo = AppDataSource.getRepository(User);
    try {
      const users = await repo.findByIds(ids);
      if (!users.length) return res.json({ deleted: 0 });
      await repo.remove(users);
      return res.json({ deleted: users.length });
    } catch (e) {
      console.error('Admin bulk delete users error:', e);
      return res.status(500).json({ message: 'Failed to bulk delete users' });
    }
  };

  // Admin: export users CSV (defaults to role=patient)
  static exportUsersCsv = async (req: Request, res: Response) => {
    const repo = AppDataSource.getRepository(User);
    const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
    try {
      const qb = UserController.buildUserQuery(repo, {
        ...req.query,
        role: req.query.role || 'patient',
        tenantId
      });
      const users = await qb.getMany();
      const rows = [
        ['First Name','Last Name','Email','Phone','Gender','Status','Created At'],
        ...users.map(u => [u.firstName, u.lastName, (u as any).email || '', u.phone || '', (u as any).gender || '', (u as any).isActive ? 'active' : 'inactive', (u as any).createdAt?.toISOString?.() || ''])
      ];
      const csv = rows.map(r => r.map(v => String(v ?? '').replace(/"/g,'""')).map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="patients.csv"');
      return res.send(csv);
    } catch (e) {
      console.error('Export users CSV error:', e);
      return res.status(500).json({ message: 'Failed to export users' });
    }
  };

  // Admin: upload user photo
  static uploadUserPhoto = async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = (req as any).file as any;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Save relative URL for static serving
      const photoUrl = `/uploads/${file.filename}`;
      (user as any).profileImage = photoUrl;
      await repo.save(user);
      return res.json({ photoUrl });
    } catch (e) {
      console.error('Upload user photo error:', e);
      return res.status(500).json({ message: 'Failed to upload photo' });
    }
  };

  // Self: upload my photo
  static uploadMyPhoto = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const file = (req as any).file as any;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    try {
      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const photoUrl = `/uploads/${file.filename}`;
      (user as any).profileImage = photoUrl;
      await repo.save(user);
      return res.json({ photoUrl });
    } catch (e) {
      console.error('Upload my photo error:', e);
      return res.status(500).json({ message: 'Failed to upload photo' });
    }
  };

  // Update user's organization
  static updateUserOrganization = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { organizationId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!organizationId) {
        return res.status(400).json({ message: 'Organization ID is required' });
      }

      // Validate organization exists
      const orgRepo = AppDataSource.getRepository(Organization);
      const organization = await orgRepo.findOne({ where: { id: organizationId } });
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      // Update user
      const userRepo = AppDataSource.getRepository(User);
      await userRepo.update(userId, { organizationId });

      // Fetch updated user
      const updatedUser = await userRepo.findOne({ 
        where: { id: userId },
        relations: ['organization']
      });

      res.json({ 
        success: true, 
        message: 'Organization updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({ message: 'Failed to update organization' });
    }
  };

  // List doctors (public endpoint for appointment booking)
  static listDoctors = async (req: Request, res: Response) => {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const tenantId = (req as any).user?.organizationId || (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const { page = 1, limit = 50, search, departmentId } = req.query;
      const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);

      const query = userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.department', 'department')
        .where('user.role = :role', { role: 'doctor' })
        .andWhere('user.organizationId = :tenantId', { tenantId })
        .andWhere('user.isActive = :isActive', { isActive: true })
        .select([
          'user.id',
          'user.firstName', 
          'user.lastName',
          'user.email',
          'user.specialization',
          'user.consultationFee',
          'user.experience',
          'user.qualification',
          'user.availableFrom',
          'user.availableTo',
          'user.workingDays',
          'department.id',
          'department.name'
        ])
        .orderBy('user.firstName', 'ASC')
        .skip((pageNum - 1) * limitNum)
        .take(limitNum);

      // Apply search filter
      if (search) {
        const searchTerm = `%${String(search).toLowerCase()}%`;
        query.andWhere(
          '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.specialization) LIKE :search)',
          { search: searchTerm }
        );
      }

      // Apply department filter
      if (departmentId) {
        query.andWhere('user.department.id = :departmentId', { departmentId: String(departmentId) });
      }

      const [doctors, total] = await query.getManyAndCount();

      res.json({
        data: doctors,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error listing doctors:', error);
      res.status(500).json({ message: 'Error fetching doctors' });
    }
  };
}
