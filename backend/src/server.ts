import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createDatabaseConnection, AppDataSource } from './config/database';
import { errorMiddleware } from './middleware/error.middleware';
import { tenantContext, optionalTenantContext } from './middleware/tenant.middleware';
import { setupSwagger } from './config/swagger';
import { User } from './models/User';
import { UserRole } from './types/roles';
import { Appointment, AppointmentStatus } from './models/Appointment';
import { Service } from './models/Service';
import { Department } from './models/Department';
import { Report } from './models/Report';
import { MedicalRecord, RecordType } from './models/MedicalRecord';
import { Bill, BillStatus } from './models/Bill';
import { Referral } from './models/Referral';
import { AvailabilitySlot, DayOfWeek } from './models/AvailabilitySlot';
import { Plan } from './models/Plan';
import { EmergencyRequest } from './models/EmergencyRequest';
import { CallbackRequest } from './models/CallbackRequest';
import { authenticate, authorize } from './middleware/auth.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import googleAuthRoutes from './routes/google-auth.routes';
import serviceRoutes from './routes/service.routes';
import departmentRoutes from './routes/department.routes';
import appointmentRoutes from './routes/appointment.routes';
import userRoutes from './routes/user.routes';
import reportRoutes from './routes/report.routes';
import patientPortalRoutes from './routes/patient-portal.routes';
import referralRoutes from './routes/referral.routes';
import availabilityRoutes from './routes/availability.routes';
import insuranceRoutes from './routes/insurance.routes';
import pharmacyRoutes from './routes/pharmacy';
import emergencyRoutes from './routes/emergency.routes';
import callbackRoutes from './routes/callback.routes';
import notificationRoutes from './routes/notification.routes';
import dotenv from 'dotenv';

// Load environment variables (ensures DB_* from backend/.env are applied when running locally)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import consultationRoutes from './routes/consultation.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import vitalSignsRoutes from './routes/vital-signs.routes';
import allergyRoutes from './routes/allergy.routes';
import inventoryRoutes from './routes/inventory.routes';
import supplierRoutes from './routes/supplier.routes';
import purchaseOrderRoutes from './routes/purchase-order.routes';
import messagingRoutes from './routes/messaging.routes';
import reminderRoutes from './routes/reminder.routes';
import healthArticleRoutes from './routes/health-article.routes';
import otRoutes from './routes/ot.routes';
import appointmentRemindersRoutes from './routes/appointment-reminders.routes';
import ambulanceRoutes from './routes/ambulance.routes';
import billingRoutes from './routes/billing.routes';
import feedbackRoutes from './routes/feedback.routes';
import medicalRecordsRoutes from './routes/medicalRecords.routes';
import inpatientRoutes from './routes/inpatient.routes';
import organizationRoutes from './routes/organization.routes';
import visitRoutes from './routes/visit.routes';
import rolesRoutes from './routes/roles.routes';
// import telemedicineRoutes from './routes/telemedicineRoutes'; // TODO: Convert to TypeORM

export class Server {
  private app: express.Application;
  private port: number;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeEmailService();
  }

  private initializeEmailService() {
    try {
      const { EmailService } = require('./services/email.service');
      EmailService.initialize();
      console.log('✅ Email service initialized');
    } catch (error) {
      console.warn('⚠️  Email service initialization failed:', error);
    }
  }

  // Expose app for integration testing
  public getApp(): express.Application {
    return this.app;
  }

  private initializeMiddlewares() {
    // Security headers
    this.app.use(helmet());
    
    // Enable CORS
    this.app.use(cors());
    
    // Parse JSON bodies
    this.app.use(express.json());
    // Parse cookies for auth flows (refresh/logout)
    this.app.use(cookieParser());
    // Ensure DB connection is initialized for integration flows where start() isn't called.
    // Skip in NODE_ENV==='test' to allow unit/integration tests that mock AppDataSource to run without real DB.
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(async (_req: Request, _res: Response, next: NextFunction) => {
        try {
          if (!AppDataSource.isInitialized) {
            await createDatabaseConnection();
          }
          next();
        } catch (e) {
          next(e);
        }
      });

    // Dev-only: seed patient portal data (medical records + bills) for a patient
    this.app.post('/api/dev/seed-patient-portal', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const { patientEmail = 'portal.demo.patient@example.com', createIfMissing = true } = req.body || {};
        const userRepo = AppDataSource.getRepository(User);
        const recRepo = AppDataSource.getRepository(MedicalRecord);
        const billRepo = AppDataSource.getRepository(Bill);

        let patient = await userRepo.findOne({ where: { email: patientEmail } });
        if (!patient && createIfMissing) {
          patient = new User();
          (patient as any).email = patientEmail;
          (patient as any).firstName = 'Portal';
          (patient as any).lastName = 'Demo';
          (patient as any).role = UserRole.PATIENT;
          (patient as any).password = 'patient123';
          (patient as any).isActive = true;
          if (typeof (patient as any).hashPassword === 'function') await (patient as any).hashPassword();
          patient = await userRepo.save(patient);
        }
        if (!patient) return res.status(404).json({ message: 'Patient not found by email' });

        // Ensure there is at least one doctor; create demo doctor if missing
        let doctor = await userRepo.createQueryBuilder('u').where('u.role = :r', { r: UserRole.DOCTOR }).getOne();
        if (!doctor) {
          const d = new User() as any;
          d.firstName = 'Demo';
          d.lastName = 'Doctor';
          d.email = 'doctor.demo@example.com';
          d.role = UserRole.DOCTOR;
          d.isActive = true;
          d.password = 'doctor123';
          if (typeof d.hashPassword === 'function') await d.hashPassword();
          doctor = await userRepo.save(d) as any;
        }

        // Seed a few medical records (skip duplicates by title), and backfill doctor if missing
        const ensureRecord = async (title: string, type: RecordType, plusDays = 0) => {
          let rec = await recRepo.createQueryBuilder('r').where('r.patient_id = :pid AND r.title = :t', { pid: (patient as any).id, t: title }).getOne();
          if (!rec) {
            rec = new MedicalRecord();
            (rec as any).patient = patient;
            (rec as any).type = type;
            (rec as any).title = title;
            (rec as any).recordDate = new Date(Date.now() + plusDays * 86400000);
            (rec as any).description = `${title} description`;
          }
        
          // attach a doctor if missing
          if (!(rec as any).doctor && doctor) {
            (rec as any).doctor = doctor;
          }
          await recRepo.save(rec);
        };
        await ensureRecord('Consultation - General', RecordType.CONSULTATION, -14);
        await ensureRecord('Lab Report - CBC', RecordType.LAB_REPORT, -7);
        await ensureRecord('Prescription - Antibiotics', RecordType.PRESCRIPTION, -6);
        await ensureRecord('Discharge Summary - Day Care', RecordType.DISCHARGE_SUMMARY, -2);

        // Seed a few bills (skip duplicates by billNumber)
        const ensureBill = async (billNumber: string, amount: number, status: BillStatus, plusDays = 0) => {
          const exists = await billRepo.findOne({ where: { billNumber } });
          if (!exists) {
            const b = new Bill();
            (b as any).patient = patient;
            (b as any).billNumber = billNumber;
            (b as any).amount = amount;
            (b as any).paidAmount = status === BillStatus.PAID ? amount : 0;
            (b as any).status = status;
            (b as any).billDate = new Date(Date.now() + plusDays * 86400000);
            (b as any).dueDate = new Date(Date.now() + (plusDays + 10) * 86400000);
            await billRepo.save(b);
          }
        };
        await ensureBill('INV-1001', 120.0, BillStatus.PAID, -30);
        await ensureBill('INV-1002', 80.0, BillStatus.PENDING, -5);
        await ensureBill('INV-1003', 200.0, BillStatus.OVERDUE, -20);

        const recCount = await recRepo.count({ where: { patient: { id: (patient as any).id } } as any });
        const billCount = await billRepo.count({ where: { patient: { id: (patient as any).id } } as any });
        return res.json({ message: 'Seeded patient portal data', patient: { email: (patient as any).email, id: (patient as any).id }, counts: { medicalRecords: recCount, bills: billCount } });
      } catch (e) {
        console.error('Seed patient portal error:', e);
        return res.status(500).json({ message: 'Failed to seed patient portal data' });
      }
    });
    
    // Dev-only: reset a user's password by email (for quick local testing)
    this.app.post('/api/dev/reset-password', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const { email, newPassword } = req.body || {};
        if (!email || !newPassword) return res.status(400).json({ message: 'email and newPassword are required' });
        const repo = AppDataSource.getRepository(User);
        const user = await repo.findOne({ where: { email: String(email).trim().toLowerCase() } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (String(newPassword).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
        (user as any).password = String(newPassword);
        if (typeof (user as any).hashPassword === 'function') await (user as any).hashPassword();
        await repo.save(user);
        return res.json({ message: 'Password reset', email: (user as any).email });
      } catch (e) {
        console.error('Dev reset-password error:', e);
        return res.status(500).json({ message: 'Failed to reset password' });
      }
    });
    }
    // Serve uploaded files
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
    this.app.use('/uploads', express.static(uploadDir));
    
    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  private initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date() });
    });

    // Main API routes - auth routes don't need tenant context
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/google-auth', googleAuthRoutes);
    this.app.use('/api/organizations', organizationRoutes);
    
    // Protected API routes with tenant context (applied after authentication in individual routes)
    this.app.use('/api/services', serviceRoutes);
    this.app.use('/api/departments', departmentRoutes);
    this.app.use('/api/appointments', appointmentRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/reports', reportRoutes);
    this.app.use('/api/patient-portal', patientPortalRoutes);
    this.app.use('/api/referrals', referralRoutes);
    this.app.use('/api/availability', availabilityRoutes);
    this.app.use('/api/insurance', insuranceRoutes);
    this.app.use('/api/pharmacy', pharmacyRoutes);
    this.app.use('/api/emergency', emergencyRoutes);
    this.app.use('/api/callback', callbackRoutes);
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/consultations', consultationRoutes);
    this.app.use('/api/diagnosis', diagnosisRoutes);
    this.app.use('/api/vital-signs', vitalSignsRoutes);
    this.app.use('/api/allergies', allergyRoutes);
    this.app.use('/api/inventory', inventoryRoutes);
    this.app.use('/api/suppliers', supplierRoutes);
    this.app.use('/api/purchase-orders', purchaseOrderRoutes);
    this.app.use('/api/messaging', messagingRoutes);
    this.app.use('/api/reminders', reminderRoutes);
    this.app.use('/api/health-articles', healthArticleRoutes);
    this.app.use('/api/ot', otRoutes);
    this.app.use('/api/appointment-reminders', appointmentRemindersRoutes);
    this.app.use('/api/ambulance', ambulanceRoutes);
    this.app.use('/api/billing', billingRoutes);
    this.app.use('/api/feedback', feedbackRoutes);
    this.app.use('/api/medical-records', medicalRecordsRoutes);
    this.app.use('/api/inpatient', inpatientRoutes);
    this.app.use('/api/visits', visitRoutes);
    this.app.use('/api/roles', rolesRoutes);

    // Dev-only: seed demo insurance plans (with countries)
    this.app.post('/api/dev/seed-plans', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const repo = AppDataSource.getRepository(Plan);
        let created = 0;
        const ensure = async (name: string, insurer: string, coverageLevel: string, priceMonthly: number, waitingPeriod: string, benefits: string[], country: string) => {
          const exists = await repo.createQueryBuilder('p')
            .where('LOWER(p.name) = :n', { n: name.toLowerCase() })
            .andWhere('LOWER(p.insurer) = :i', { i: insurer.toLowerCase() })
            .andWhere('p.country = :c', { c: country })
            .getOne();
          if (!exists) {
            const p = repo.create({ name, insurer, coverageLevel, priceMonthly, waitingPeriod, benefits, status: 'active', country } as any);
            await repo.save(p);
            created++;
          }
        };
        await ensure('Essential Care', 'Vhi', 'Basic', 49.99, '26 weeks', ['GP x2','ER Cover','Day-care'], 'IE');
        await ensure('Silver Plus', 'Laya', 'Standard', 79.99, '16 weeks', ['GP x4','Physio x3','ER Cover','Day-care'], 'IE');
        await ensure('Prime Advantage', 'Irish Life', 'Premium', 119.99, '8 weeks', ['GP unlimited','Physio x6','Private Room','ER Cover'], 'IE');
        await ensure('Care Basic', 'BlueShield', 'Basic', 59.99, '12 weeks', ['PCP x2','ER Cover'], 'US');
        await ensure('Arogya Plus', 'StarHealth', 'Standard', 24.99, '30 days', ['OPD x3','Day-care','AYUSH'], 'IN');
        const count = await repo.count();
        return res.json({ message: created ? 'Seeded plans' : 'Plans already exist', created, count });
      } catch (e) {
        console.error('Seed plans error:', e);
        return res.status(500).json({ message: 'Failed to seed plans' });
      }
    });

    // Dev-only: seed baseline services for each department so public pages can display services
    this.app.post('/api/dev/seed-services-by-department', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const deptRepo = AppDataSource.getRepository(Department);
        const svcRepo = AppDataSource.getRepository(Service);
        const departments = await deptRepo.find();
        const created: Array<{ department: string; services: string[] }> = [];
        const ensure = async (dept: Department, names: string[]) => {
          const made: string[] = [];
          for (const name of names) {
            const exists = await svcRepo.createQueryBuilder('s')
              .leftJoin('s.department','d')
              .where('LOWER(s.name) = :n', { n: name.toLowerCase() })
              .andWhere('d.id = :id', { id: (dept as any).id })
              .getOne();
            if (!exists) {
              const s = new Service() as any;
              s.name = name;
              s.description = `${name} under ${dept.name}`;
              s.status = 'active';
              s.averageDuration = 30;
              s.department = dept as any;
              s.departmentId = (dept as any).id;
              await svcRepo.save(s);
              made.push(name);
            }
          }
          if (made.length) created.push({ department: dept.name, services: made });
        };
        for (const d of departments) {
          const n = (d.name || '').toLowerCase();
          if (n.includes('cardio')) await ensure(d, ['General Consultation','ECG','Echocardiography']);
          else if (n.includes('ortho')) await ensure(d, ['General Consultation','Physiotherapy','Arthroscopy']);
          else if (n.includes('pedia')) await ensure(d, ['Well-baby Clinic','Vaccinations','Growth Assessment']);
          else if (n.includes('derma')) await ensure(d, ['Acne Care','Dermatosurgery','Allergy Testing']);
          else if (n.includes('ophthal') || n.includes('eye')) await ensure(d, ['Eye Exam','Cataract Surgery','Glaucoma Clinic']);
          else if (n.includes('neuro')) await ensure(d, ['EEG','Stroke Clinic','Movement Disorders']);
          else if (n.includes('ent')) await ensure(d, ['Sinus Clinic','Audiology','Tonsillectomy']);
          else if (n.includes('gastro')) await ensure(d, ['Endoscopy','Colonoscopy','Liver Clinic']);
          else if (n.includes('gyn')) await ensure(d, ['Prenatal Care','Fertility Counseling','Menstrual Disorders']);
          else if (n.includes('uro')) await ensure(d, ['Prostate Clinic','Stone Management','Endoscopy']);
          else if (n.includes('onco')) await ensure(d, ['Chemotherapy','Radiation','Immunotherapy']);
          else if (n.includes('radio')) await ensure(d, ['X-Ray','MRI','CT Scan']);
          else if (n.includes('pulmo')) await ensure(d, ['PFT','Asthma Clinic','Sleep Study']);
          else if (n.includes('nephro')) await ensure(d, ['Dialysis','CKD Clinic','Transplant Evaluation']);
          else await ensure(d, ['General Consultation']);
        }
        return res.json({ message: 'Seeded services by department', created });
      } catch (e) {
        console.error('Seed services error:', e);
        return res.status(500).json({ message: 'Failed to seed services' });
      }
    });

    // Dev-only: seed availability slots for all doctors (avoids duplicates)
    this.app.post('/api/dev/seed-availability', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const userRepo = AppDataSource.getRepository(User);
        const slotRepo = AppDataSource.getRepository(AvailabilitySlot);

        const doctors = await userRepo.createQueryBuilder('u')
          .where('u.role = :role', { role: UserRole.DOCTOR })
          .andWhere('u.isActive = true')
          .getMany();

        // Template: Mon–Fri 09:00–12:00 & 14:00–17:00; Sat 10:00–13:00
        const weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
        const saturday = [DayOfWeek.SATURDAY];
        const weekdaySlots = [
          { start: '09:00', end: '12:00' },
          { start: '14:00', end: '17:00' },
        ];
        const saturdaySlots = [ { start: '10:00', end: '13:00' } ];

        let created = 0;

        for (const d of doctors) {
          for (const day of weekdays) {
            for (const tpl of weekdaySlots) {
              const exists = await slotRepo.createQueryBuilder('s')
                .leftJoin('s.doctor', 'doc')
                .where('doc.id = :id', { id: (d as any).id })
                .andWhere('s.dayOfWeek = :day', { day })
                .andWhere('s.startTime = :start AND s.endTime = :end', { start: tpl.start, end: tpl.end })
                .getOne();
              if (!exists) {
                const slot = new AvailabilitySlot();
                (slot as any).doctor = d;
                slot.dayOfWeek = day;
                slot.startTime = tpl.start;
                slot.endTime = tpl.end;
                slot.isActive = true;
                await slotRepo.save(slot);
                created++;
              }
            }
          }
          for (const day of saturday) {
            for (const tpl of saturdaySlots) {
              const exists = await slotRepo.createQueryBuilder('s')
                .leftJoin('s.doctor', 'doc')
                .where('doc.id = :id', { id: (d as any).id })
                .andWhere('s.dayOfWeek = :day', { day })
                .andWhere('s.startTime = :start AND s.endTime = :end', { start: tpl.start, end: tpl.end })
                .getOne();
              if (!exists) {
                const slot = new AvailabilitySlot();
                (slot as any).doctor = d;
                slot.dayOfWeek = day;
                slot.startTime = tpl.start;
                slot.endTime = tpl.end;
                slot.isActive = true;
                await slotRepo.save(slot);
                created++;
              }
            }
          }
        }

        return res.json({ message: 'Availability seeded', created, doctors: doctors.length });
      } catch (e) {
        console.error('Seed availability error:', e);
        return res.status(500).json({ message: 'Failed to seed availability' });
      }
    });

    // Dev-only: seed dummy doctors for each department (Chief, Senior, Consultant, Practitioner)
    this.app.post('/api/dev/seed-doctors-by-department', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);

        let departments = await deptRepo.createQueryBuilder('d').getMany();
        const defaults = [
          'General Medicine','Cardiology','Orthopedics','Pediatrics','Dermatology',
          'Ophthalmology','Neurology','ENT','Gastroenterology','Gynecology','Urology','Oncology','Radiology','Psychiatry','Pulmonology','Nephrology'
        ];
        // Insert any missing default departments
        const existingNames = new Set((departments || []).map((x: any) => String(x.name).toLowerCase()));
        for (const name of defaults) {
          if (!existingNames.has(name.toLowerCase())) {
            const d = new Department() as any;
            d.name = name;
            d.description = name + ' department';
            d.status = 'active';
            const saved = await deptRepo.save(d);
            departments.push(saved as any);
          }
        }

        const password = 'doctor123';
        const seniorities = ['chief','senior','consultant','practitioner'] as const;
        const toTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
        const slug = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

        const result: Array<{ department: { id: string; name: string }, doctors: Array<{ firstName: string; lastName: string; email: string; password: string; seniority: string }> }> = [];

        for (const d of departments) {
          const dep = d as any;
          const depSlug = slug(dep.name);
          const doctorsForDept: Array<{ firstName: string; lastName: string; email: string; password: string; seniority: string }> = [];
          for (const s of seniorities) {
            const email = `${depSlug}.${s}@example.com`;
            const firstName = toTitle(depSlug.replace(/-/g, ' ').split(' ')[0] || 'Doctor');
            const lastName = toTitle(s);
            let u = await userRepo.findOne({ where: { email } });
            if (!u) {
              u = new User();
              u.email = email;
              u.firstName = firstName;
              u.lastName = lastName;
            }
            u.role = UserRole.DOCTOR;
            u.isActive = true;
            (u as any).department = dep;
            (u as any).departmentId = dep.id;
            u.preferences = Object.assign({}, u.preferences, { seniority: s });
            (u as any).password = password;
            if (typeof (u as any).hashPassword === 'function') {
              await (u as any).hashPassword();
            }
            await userRepo.save(u);
            doctorsForDept.push({ firstName: u.firstName, lastName: u.lastName, email, password, seniority: s });
          }
          result.push({ department: { id: dep.id, name: dep.name }, doctors: doctorsForDept });
        }

        return res.json({ message: 'Seeded doctors by department', password, departments: result });
      } catch (e) {
        console.error('Seed doctors by department error:', e);
        return res.status(500).json({ message: 'Failed to seed doctors by department' });
      }
    });

    // Dev-only: seed a demo patient and create an appointment with a doctor (by email)
    this.app.post('/api/dev/seed-patient-for-doctor', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const { doctorEmail = 'doctor@example.com', patientEmail = 'patient.demo@example.com', firstName = 'Patient', lastName = 'Demo' } = req.body || {};
        const userRepo = AppDataSource.getRepository(User);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const serviceRepo = AppDataSource.getRepository(Service);
        const deptRepo = AppDataSource.getRepository(Department);

        const doctor = await userRepo.findOne({ where: { email: doctorEmail } });
        if (!doctor) return res.status(404).json({ message: 'Doctor not found by email' });

        let patient = await userRepo.findOne({ where: { email: patientEmail } });
        if (!patient) {
          patient = new User();
          patient.firstName = firstName;
          patient.lastName = lastName;
          (patient as any).email = patientEmail;
          patient.phone = '0000000000';
          (patient as any).role = UserRole.PATIENT;
          (patient as any).password = 'patient123';
          if (typeof (patient as any).hashPassword === 'function') await (patient as any).hashPassword();
          patient.isActive = true;
          patient = await userRepo.save(patient);
        }

        // Ensure we have at least one service under some department
        let service = await serviceRepo.createQueryBuilder('s').getOne();
        if (!service) {
          let dept = await deptRepo.createQueryBuilder('d').getOne();
          if (!dept) {
            const nd = new Department() as any;
            nd.name = 'General Medicine';
            nd.description = 'General department for demo';
            const savedDept = await deptRepo.save(nd);
            dept = savedDept as any;
          }
          const s = new Service() as any;
          s.name = 'General Consultation';
          s.description = 'Demo service';
          s.status = 'active';
          s.averageDuration = 30;
          s.department = dept as any;
          s.departmentId = (dept as any).id;
          service = await serviceRepo.save(s);
        }

        // Create an appointment in the next hour
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const end = new Date(Date.now() + 90 * 60 * 1000);
        const a = new Appointment();
        (a as any).patient = patient;
        (a as any).doctor = doctor;
        (a as any).service = service as any;
        (a as any).startTime = start;
        (a as any).endTime = end;
        (a as any).status = AppointmentStatus.CONFIRMED;
        await apptRepo.save(a);

        return res.json({ message: 'Seeded patient and appointment', doctor: { email: doctorEmail }, patient: { email: patientEmail, password: 'patient123' }, appointment: { id: a.id, startTime: start, endTime: end } });
      } catch (e) {
        console.error('Seed patient for doctor error:', e);
        return res.status(500).json({ message: 'Failed to seed patient for doctor' });
      }
    });

    // Dev-only: seed or update a doctor user with a known password for local testing
    this.app.post('/api/dev/seed-doctor', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        if (process.env.NODE_ENV === 'test') {
          console.log('[seed-doctor] body:', req.body);
        }
        const { email = 'doctor@example.com', password = 'doctor123', firstName = 'Doctor', lastName = 'User' } = req.body || {};
        if (!password) return res.status(400).json({ message: 'password is required' });
        const repo = AppDataSource.getRepository(User);
        if (process.env.NODE_ENV === 'test') {
          console.log('[seed-doctor] repo ready');
        }
        let user = await repo.findOne({ where: { email } });
        if (process.env.NODE_ENV === 'test') {
          console.log('[seed-doctor] existing user?', !!user);
        }
        if (!user) {
          user = new User();
          user.email = email;
          user.firstName = firstName;
          user.lastName = lastName;
        }
        // Ensure required fields
        if (!user.phone) user.phone = '0000000000';
        user.role = UserRole.DOCTOR;
        user.isActive = true;
        (user as any).password = password;
        if (typeof (user as any).hashPassword === 'function') {
          if (process.env.NODE_ENV === 'test') {
            console.log('[seed-doctor] hashing password');
          }
          await (user as any).hashPassword();
        }
        if (process.env.NODE_ENV === 'test') {
          console.log('[seed-doctor] saving user');
        }
        await repo.save(user);
        if (process.env.NODE_ENV === 'test') {
          console.log('[seed-doctor] saved with id:', (user as any).id);
        }
        return res.json({ message: 'Doctor seeded', email, id: (user as any).id });
      } catch (e) {
        console.error('Seed doctor error:', e);
        return res.status(500).json({ 
          message: 'Failed to seed doctor',
          ...(process.env.NODE_ENV === 'test' && { error: (e as any)?.message || String(e) })
        });
      }
    });

    // Dev-only: seed FR-001 demo data
    this.app.post('/api/dev/seed-fr001-demo', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const grantReferral = String(req.query.referral || req.body?.referral || '').toLowerCase() === '1' || String(req.body?.grantReferral || '') === '1';
        const uniquePatient = String(req.query.unique || req.body?.unique || '').toLowerCase() === '1';
        const ensureRestricted = String(req.query.ensureRestricted || req.body?.ensureRestricted || '').toLowerCase() === '1';
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const reportRepo = AppDataSource.getRepository(Report);
        const referralRepo = AppDataSource.getRepository(Referral);

        // Ensure departments
        const ensureDept = async (name: string) => {
          let d = await deptRepo.createQueryBuilder('d').where('LOWER(d.name) = :n', { n: name.toLowerCase() }).getOne();
          if (!d) {
            const nd = new Department() as any;
            nd.name = name;
            nd.description = name + ' department';
            nd.status = 'active';
            d = await deptRepo.save(nd) as any;
          }
          return d as any;
        };

        const cardio = await ensureDept('Cardiology');
        const genmed = await ensureDept('General Medicine');

        // Ensure doctor in Cardiology
        let doctor = await userRepo.findOne({ where: { email: 'cardiology.practitioner@example.com' } });
        if (!doctor) {
          doctor = new User();
          doctor.firstName = 'Cardio';
          doctor.lastName = 'Practitioner';
          (doctor as any).email = 'cardiology.practitioner@example.com';
        }
        (doctor as any).role = UserRole.DOCTOR;
        (doctor as any).department = cardio as any;
        (doctor as any).departmentId = (cardio as any).id;
        doctor.isActive = true;
        (doctor as any).password = 'doctor123';
        if (typeof (doctor as any).hashPassword === 'function') await (doctor as any).hashPassword();
        doctor = await userRepo.save(doctor);

        // Ensure patient in General Medicine
        const patientEmailSeed = uniquePatient ? `fr001.patient.${Date.now()}@example.com` : 'fr001.patient@example.com';
        let patient = uniquePatient ? undefined : await userRepo.findOne({ where: { email: 'fr001.patient@example.com' } });
        if (!patient) {
          patient = new User();
          patient.firstName = 'FR001';
          patient.lastName = 'Patient';
          (patient as any).email = patientEmailSeed;
          patient.phone = '9999999999';
          (patient as any).role = UserRole.PATIENT;
          (patient as any).password = 'patient123';
          if (typeof (patient as any).hashPassword === 'function') await (patient as any).hashPassword();
          patient.isActive = true;
        }
        (patient as any).primaryDepartment = genmed as any;
        (patient as any).primaryDepartmentId = (genmed as any).id;
        patient = await userRepo.save(patient);

        // Ensure a sample report for the patient
        let existingReport = await reportRepo.createQueryBuilder('r').where('r.patientId = :pid', { pid: (patient as any).id }).getOne();
        if (!existingReport) {
          const r = new Report();
          (r as any).patientId = (patient as any).id;
          (r as any).type = 'note';
          (r as any).title = 'FR-001 Demo Report';
          (r as any).content = 'Sample content for FR-001 access control demo.';
          await reportRepo.save(r);
        }

        // Ensure restricted: remove any existing referrals for this patient so cross-dept access is denied
        if (ensureRestricted) {
          await referralRepo.createQueryBuilder()
            .delete()
            .from(Referral)
            .where('patient_id = :pid', { pid: (patient as any).id })
            .execute();
        }

        // Optionally grant referral
        if (grantReferral) {
          let ref = await referralRepo.findOne({ where: { patientId: (patient as any).id, departmentId: (cardio as any).id } as any });
          if (!ref) {
            const nr = new Referral();
            (nr as any).patientId = (patient as any).id;
            (nr as any).departmentId = (cardio as any).id;
            await referralRepo.save(nr);
          }
        }

        return res.json({
          message: 'Seeded FR-001 demo data',
          doctor: { email: (doctor as any).email, password: 'doctor123', id: (doctor as any).id, department: { id: (cardio as any).id, name: (cardio as any).name } },
          patient: { email: (patient as any).email, password: 'patient123', id: (patient as any).id, primaryDepartment: { id: (genmed as any).id, name: (genmed as any).name } },
          referralGranted: grantReferral
        });
      } catch (e) {
        console.error('Seed FR-001 demo error:', e);
        return res.status(500).json({ message: 'Failed to seed FR-001 demo' });
      }
    });

    this.app.post('/api/public/appointment-requests', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, phone, email, serviceId, departmentId, departmentName, doctorId, preferredTime, notes } = req.body || {};
        if (!name || !phone) {
          return res.status(400).json({ message: 'name and phone are required' });
        }
        const userRepo = AppDataSource.getRepository(User);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const serviceRepo = AppDataSource.getRepository(Service);
        const deptRepo = AppDataSource.getRepository(Department);

        // Find or create patient by email or phone
        let patient: User | undefined = undefined;
        if (email) {
          patient = await userRepo.findOne({ where: { email } }) as User | undefined;
        }
        if (!patient) {
          patient = await userRepo.findOne({ where: { phone } }) as User | undefined;
        }
        if (!patient) {
          const [firstName, ...rest] = String(name).trim().split(' ');
          const lastName = rest.join(' ') || 'Patient';
          const newUser = new User();
          newUser.firstName = firstName || 'Patient';
          newUser.lastName = lastName || 'User';
          newUser.email = email || `guest_${Date.now()}@example.com`;
          newUser.phone = phone;
          newUser.password = Math.random().toString(36).slice(2) + 'A1!';
          newUser.role = UserRole.PATIENT;
          newUser.isActive = true;
          await newUser.hashPassword();
          patient = await userRepo.save(newUser);
        }

        // Validate or infer service
        let service: Service | undefined = undefined;
        if (serviceId) {
          service = await serviceRepo.findOne({ where: { id: serviceId }, relations: ['department'] }) as Service | undefined;
        } else if (departmentId || departmentName) {
          // Resolve department by ID or by name (case-insensitive)
          let dept = departmentId ? await deptRepo.findOne({ where: { id: departmentId } }) : undefined;
          if (!dept && departmentName) {
            dept = await deptRepo.createQueryBuilder('d')
              .where('LOWER(d.name) = :n', { n: String(departmentName).toLowerCase() })
              .getOne() as any;
          }
          // If still not found and a name exists, create it
          if (!dept && departmentName) {
            const created = new Department() as any;
            created.name = departmentName;
            created.description = departmentName + ' department';
            created.status = 'active';
            dept = await deptRepo.save(created) as any;
          }

          if (dept) {
            // Pick the first service under this department
            service = await serviceRepo.findOne({ where: { department: { id: (dept as any).id } } as any, relations: ['department'] }) as Service | undefined;
            // If no service exists for this department, create a default one
            if (!service) {
              const defaultSvc = new Service() as any;
              defaultSvc.name = 'General Consultation';
              defaultSvc.description = 'Default service for department appointments';
              defaultSvc.status = 'active';
              defaultSvc.averageDuration = 30;
              defaultSvc.department = dept as any;
              defaultSvc.departmentId = (dept as any).id;
              const savedSvc = await serviceRepo.save(defaultSvc);
              service = await serviceRepo.findOne({ where: { id: savedSvc.id }, relations: ['department'] }) as Service | undefined;
            }
          }
        }

        // Compute start/end
        const start = preferredTime ? new Date(preferredTime) : new Date();
        const durationMinutes = (service as any)?.averageDuration || 30;
        const end = new Date(start.getTime() + durationMinutes * 60000);

        // Auto-assign doctor if not specified
        let assignedDoctor = null;
        if (doctorId) {
          assignedDoctor = { id: doctorId } as any;
        } else if (service?.department) {
          // Auto-assign based on department and seniority
          const doctorRepo = AppDataSource.getRepository(User);
          const availableDoctors = await doctorRepo
            .createQueryBuilder('user')
            .where('user.role = :role', { role: 'doctor' })
            .andWhere('user.departmentId = :deptId', { deptId: service.department.id })
            .andWhere('user.isActive = :active', { active: true })
            .getMany();
          
          if (availableDoctors.length > 0) {
            // Prioritize by seniority: chief > senior > consultant > practitioner
            const seniorityOrder = ['chief', 'senior', 'consultant', 'practitioner'];
            availableDoctors.sort((a, b) => {
              const aSeniority = (a as any).preferences?.seniority || 'practitioner';
              const bSeniority = (b as any).preferences?.seniority || 'practitioner';
              const aIndex = seniorityOrder.indexOf(aSeniority);
              const bIndex = seniorityOrder.indexOf(bSeniority);
              return aIndex - bIndex;
            });
            assignedDoctor = availableDoctors[0];
          }
        }

        // Create appointment (pending)
        const appointment = new Appointment();
        appointment.patient = patient;
        if (service) appointment.service = service;
        if (assignedDoctor) (appointment as any).doctor = assignedDoctor;
        appointment.startTime = start;
        appointment.endTime = end;
        appointment.status = AppointmentStatus.PENDING;
        appointment.notes = notes;

        const saved = await apptRepo.save(appointment);
        const full = await apptRepo.findOne({ where: { id: saved.id }, relations: ['patient','doctor','service'] });

        return res.status(201).json({ status: 'received', appointmentId: saved.id, appointment: full });
      } catch (err) {
        next(err);
      }
    });

    // Apply tenant context middleware to all API routes
    // This extracts the organization/tenant from subdomain, header, or query parameter
    this.app.use('/api', optionalTenantContext);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/auth', googleAuthRoutes);
    this.app.use('/api/services', serviceRoutes);
    this.app.use('/api/departments', departmentRoutes);
    this.app.use('/api/appointments', appointmentRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api', reportRoutes);
    this.app.use('/api/patient-portal', patientPortalRoutes);
    this.app.use('/api/availability', availabilityRoutes);
    this.app.use('/api', referralRoutes);
    this.app.use('/api', insuranceRoutes);
    this.app.use('/api/pharmacy', pharmacyRoutes);
    this.app.use('/api/emergency', emergencyRoutes);
    this.app.use('/api/callback', callbackRoutes);
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/consultations', consultationRoutes);
    this.app.use('/api/diagnoses', diagnosisRoutes);
    this.app.use('/api/vital-signs', vitalSignsRoutes);
    this.app.use('/api/allergies', allergyRoutes);
    this.app.use('/api/inventory', inventoryRoutes);
    this.app.use('/api/suppliers', supplierRoutes);
    this.app.use('/api/purchase-orders', purchaseOrderRoutes);
    this.app.use('/api/messages', messagingRoutes);
    this.app.use('/api/reminders', reminderRoutes);
    this.app.use('/api/health-articles', healthArticleRoutes);
    this.app.use('/api/feedback', feedbackRoutes);
    this.app.use('/api/medical-records', medicalRecordsRoutes);
    this.app.use('/api/inpatient', inpatientRoutes);
    this.app.use('/api/organization', organizationRoutes);
    this.app.use('/api/organizations', organizationRoutes);
    this.app.use('/api/ot', otRoutes);
    this.app.use('/api/appointment-reminders', appointmentRemindersRoutes);
    this.app.use('/api/ambulance', ambulanceRoutes);
    this.app.use('/api/billing', billingRoutes);
    // Visit & Queue (feature-flagged)
    try {
      const visitRoutes = require('./routes/visit.routes').default;
      this.app.use('/api/visits', visitRoutes);
    } catch (e) {
      console.warn('visit.routes not loaded:', (e as any)?.message || e);
    }
    try {
      const queueRoutes = require('./routes/queue.routes').default;
      this.app.use('/api/queue', queueRoutes);
    } catch (e) {
      console.warn('queue.routes not loaded:', (e as any)?.message || e);
    }
    try {
      const triageRoutes = require('./routes/triage.routes').default;
      this.app.use('/api/triage', triageRoutes);
    } catch (e) {
      console.warn('triage.routes not loaded:', (e as any)?.message || e);
    }
    // Telemedicine routes - Temporary mock endpoints (TODO: Convert to TypeORM)
    this.app.post('/api/telemedicine/sessions', authenticate, async (req: Request, res: Response) => {
      try {
        const session = {
          id: Date.now().toString(),
          sessionId: `TM-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          ...req.body,
          patientAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.body.patientName}`,
          doctorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.body.doctorName}`,
          status: 'Scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        res.status(201).json({ success: true, message: 'Session created', data: session });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.app.get('/api/telemedicine/sessions', authenticate, async (_req: Request, res: Response) => {
      try {
        res.status(200).json({ success: true, data: [] });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.app.put('/api/telemedicine/sessions/:id', authenticate, async (req: Request, res: Response) => {
      try {
        const session = {
          id: req.params.id,
          ...req.body,
          updatedAt: new Date(),
        };
        res.status(200).json({ success: true, message: 'Session updated', data: session });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    this.app.delete('/api/telemedicine/sessions/:id', authenticate, async (req: Request, res: Response) => {
      try {
        res.status(200).json({ success: true, message: 'Session deleted successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    });
    
    // Laboratory Management routes
    const labRoutes = require('./routes/lab.routes').default;
    this.app.use('/api/lab', labRoutes);

    // Analytics routes
    const analyticsRoutes = require('./routes/analytics.routes').default;
    this.app.use('/api/analytics', analyticsRoutes);

    // Public routes (no auth)
    this.app.get('/api/public/doctors', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const repo = AppDataSource.getRepository(User);
        const qb = repo.createQueryBuilder('u')
          .leftJoinAndSelect('u.department', 'department')
          .where('u.role = :role', { role: UserRole.DOCTOR })
          .andWhere('u.isActive = :isActive', { isActive: true });

        // Filter by organization/tenant if available
        // Priority: user's organization_id > tenant from context
        const orgId = (req as any).user?.organization_id || (req as any).tenant?.id;
        if (orgId) {
          qb.andWhere('u.organization_id = :orgId', { orgId });
        }

        qb.select(['u.id','u.firstName','u.lastName','u.email','u.phone','u.profileImage','u.preferences','department.id','department.name'])
          .orderBy('u.firstName','ASC');
        const doctors = await qb.getMany();
        const payload = doctors.map((d: any) => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phone: d.phone,
          profileImage: d.profileImage,
          department: d.department ? { id: d.department.id, name: d.department.name } : null,
          // Expose seniority directly for simpler frontend filtering
          seniority: (d.preferences?.seniority ? String(d.preferences.seniority) : undefined)
        }));
        res.json({ data: payload });
      } catch (err) {
        next(err);
      }
    });

    this.app.post('/api/public/emergency', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, phone, message, location } = req.body || {};
        if (!name || !phone) {
          return res.status(400).json({ message: 'name and phone are required' });
        }
        const repo = AppDataSource.getRepository(EmergencyRequest);
        const er = new EmergencyRequest();
        er.name = name;
        er.phone = phone;
        er.message = message;
        er.location = location;
        const saved = await repo.save(er);
        res.status(201).json({ status: 'received', id: saved.id });
      } catch (err) {
        next(err);
      }
    });

    this.app.post('/api/public/request-callback', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, phone, department, preferredTime, message } = req.body || {};
        if (!name || !phone) {
          return res.status(400).json({ message: 'name and phone are required' });
        }
        const repo = AppDataSource.getRepository(CallbackRequest);
        const cr = new CallbackRequest();
        cr.name = name;
        cr.phone = phone;
        cr.department = department;
        cr.preferredTime = preferredTime;
        cr.message = message;
        const saved = await repo.save(cr);
        res.status(201).json({ status: 'received', id: saved.id });
      } catch (err) {
        next(err);
      }
    });

    // Simple public chat endpoint (MVP) with file-based persistence
    const chatStorePath = path.resolve(process.cwd(), 'uploads', 'chat-sessions.json');
    const loadChatStore = (): Record<string, Array<{ role: string; text: string; ts: number }>> => {
      try {
        const raw = fs.readFileSync(chatStorePath, 'utf8');
        return JSON.parse(raw) || {};
      } catch {
        return {};
      }
    };
    const saveChatStore = (obj: any) => {
      try { fs.writeFileSync(chatStorePath, JSON.stringify(obj)); } catch {}
    };

    this.app.post('/api/public/chat', async (req: Request, res: Response) => {
      try {
        const { message = '', sessionId } = req.body || {};
        const text = String(message || '').toLowerCase();

        type Suggestion = { label: string; url?: string; message?: string };
        const suggestions: Suggestion[] = [
          { label: 'Book Appointment', url: '/appointments/book' },
          { label: 'Find Doctors', url: '/doctors' },
          { label: 'Services', url: '/services' },
          { label: 'Request Callback', url: '/request-callback' },
          { label: 'Emergency 24/7', url: '/emergency' },
        ];

        let reply = 'I can help with appointments, doctors, services, and emergencies. Ask me anything!';

        // Persist USER message
        if (sessionId) {
          const store = loadChatStore();
          store[sessionId] = store[sessionId] || [];
          store[sessionId].push({ role: 'user', text: String(message || ''), ts: Date.now() });
          saveChatStore(store);
        }

        // Emergency first
        if (/(emergency|help now|urgent|bleeding|unconscious)/.test(text)) {
          reply = 'If this is an emergency, please call 1800-000-9999 immediately or visit /emergency.';
          // Persist ASSISTANT reply
          if (sessionId) {
            const store = loadChatStore();
            store[sessionId] = store[sessionId] || [];
            store[sessionId].push({ role: 'assistant', text: reply, ts: Date.now() });
            saveChatStore(store);
          }
          return res.json({ reply, suggestions, sessionId });
        }

        // Generic intents
        if (/(book|appointment|schedule)/.test(text)) {
          reply = 'To book an appointment, go to /appointments/book. Tell me your symptoms if you want a department suggestion.';
          return res.json({ reply, suggestions, sessionId });
        }
        if (/(doctor|specialist|physician)/.test(text)) {
          reply = 'Find doctors and filter by department at /doctors. Share your symptoms to get a department suggestion.';
          return res.json({ reply, suggestions, sessionId });
        }
        if (/(service|treatment|procedure)/.test(text)) {
          reply = 'Browse all services at /services. You can search and filter by department or status.';
          return res.json({ reply, suggestions, sessionId });
        }
        if (/(time|hours|open|opening|closing)/.test(text)) {
          reply = 'We operate 24/7 for emergencies. OPD hours vary by department; please check /services or /doctors for availability.';
          return res.json({ reply, suggestions, sessionId });
        }
        if (/(contact|phone|call|number)/.test(text)) {
          reply = 'You can reach us at 1800-000-9999 or request a callback at /request-callback.';
          if (sessionId) {
            const store = loadChatStore();
            store[sessionId] = store[sessionId] || [];
            store[sessionId].push({ role: 'assistant', text: reply, ts: Date.now() });
            saveChatStore(store);
          }
          return res.json({ reply, suggestions, sessionId });
        }

        // Symptom to department mapping
        const maps: Array<{ rx: RegExp; dept: string; note?: string }> = [
          { rx: /(chest pain|palpitation|breathless|ecg|bp high)/, dept: 'Cardiology' },
          { rx: /(fracture|bone|joint|sprain|knee|shoulder|back pain)/, dept: 'Orthopedics' },
          { rx: /(fever|cough|cold|flu|general check|headache)/, dept: 'General Medicine' },
          { rx: /(pregnan|gyneco|gynaeco|menstru|period|women|obstetric)/, dept: 'Gynecology' },
          { rx: /(kidney|urine|urology|stones)/, dept: 'Urology' },
          { rx: /(cancer|tumor|oncology)/, dept: 'Oncology' },
          { rx: /(mental|anxiety|depress|psychiat)/, dept: 'Psychiatry' },
          { rx: /(skin|derma|rash|acne|eczema)/, dept: 'Dermatology' },
          { rx: /(child|pediatric|kid)/, dept: 'Pediatrics' },
          { rx: /(stroke|numb|weak side|slurred speech|seizure|epilepsy)/, dept: 'Neurology' },
        ];
        const found = maps.find(m => m.rx.test(text));
        if (found) {
          reply = `Based on your symptoms, ${found.dept} may be appropriate. You can find doctors under this department at /doctors and book an appointment at /appointments/book.`;
          if (sessionId) {
            const store = loadChatStore();
            store[sessionId] = store[sessionId] || [];
            store[sessionId].push({ role: 'assistant', text: reply, ts: Date.now() });
            saveChatStore(store);
          }
          return res.json({ reply, suggestions, department: found.dept, sessionId });
        }

        // Default
        if (sessionId) {
          const store = loadChatStore();
          store[sessionId] = store[sessionId] || [];
          store[sessionId].push({ role: 'assistant', text: reply, ts: Date.now() });
          saveChatStore(store);
        }
        return res.json({ reply, suggestions, sessionId });
      } catch (e) {
        return res.status(200).json({ reply: 'Sorry, something went wrong. Please try again.' });
      }
    });

    // Retrieve chat history for a session
    this.app.get('/api/public/chat/history', async (req: Request, res: Response) => {
      const sessionId = String(req.query.sessionId || '');
      if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });
      const store = loadChatStore();
      const history = store[sessionId] || [];
      return res.json({ sessionId, history });
    });

    // Clear chat session
    this.app.delete('/api/public/chat/session', async (req: Request, res: Response) => {
      const sessionId = String(req.query.sessionId || '');
      if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });
      const store = loadChatStore();
      delete store[sessionId];
      saveChatStore(store);
      return res.json({ status: 'cleared', sessionId });
    });

    // Admin listings
    this.app.get('/api/admin/emergency-requests', authenticate as any, authorize(['admin','super_admin']) as any, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const page = Math.max(1, parseInt(String((req.query.page ?? '1')), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String((req.query.limit ?? '20')), 10) || 20));
        const repo = AppDataSource.getRepository(EmergencyRequest);
        const [data, total] = await repo.findAndCount({ order: { createdAt: 'DESC' }, skip: (page-1)*limit, take: limit });
        res.json({ data, meta: { page, limit, total } });
      } catch (err) {
        next(err);
      }
    });

    this.app.get('/api/admin/callback-requests', authenticate as any, authorize(['admin','super_admin']) as any, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const page = Math.max(1, parseInt(String((req.query.page ?? '1')), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String((req.query.limit ?? '20')), 10) || 20));
        const repo = AppDataSource.getRepository(CallbackRequest);
        const [data, total] = await repo.findAndCount({ order: { createdAt: 'DESC' }, skip: (page-1)*limit, take: limit });
        res.json({ data, meta: { page, limit, total } });
      } catch (err) {
        next(err);
      }
    });

    // Dev-only: seed or update an admin user with a known password for local bootstrap
    this.app.post('/api/dev/seed-admin', async (req: Request, res: Response) => {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Disabled in production' });
      }
      try {
        const { email = 'admin@example.com', password = 'admin123', firstName = 'Admin', lastName = 'User' } = req.body || {};
        if (!password) return res.status(400).json({ message: 'password is required' });
        const repo = AppDataSource.getRepository(User);
        let user = await repo.findOne({ where: { email } });
        if (!user) {
          user = new User();
          user.email = email;
          user.firstName = firstName;
          user.lastName = lastName;
        }
        user.role = UserRole.ADMIN;
        user.isActive = true;
        (user as any).password = password;
        if (typeof (user as any).hashPassword === 'function') {
          await (user as any).hashPassword();
        }
        await repo.save(user);
        return res.json({ message: 'Admin seeded', email });
      } catch (e) {
        console.error('Seed admin error:', e);
        return res.status(500).json({ message: 'Failed to seed admin' });
      }
    });

    // Apply error middleware
    this.app.use(errorMiddleware);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ message: 'Not Found' });
    });
  }

  private initializeErrorHandling() {
    // Error handling middleware
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      const status = err.status || 500;
      res.status(status).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
      next(); // Call next to continue the error handling chain
    });
  }

  public async start() {
    try {
      // Initialize database connection, but don't block server start if it fails (dev fallback)
      try {
        await createDatabaseConnection();
      } catch (dbErr) {
        console.warn('⚠️  Database initialization failed. Starting server without DB (dev fallback).', dbErr);
      }

      // Initialize email service
      try {
        const { EmailService } = require('./services/email.service');
        EmailService.initialize();
        console.log('✅ Email service initialized');
      } catch (error) {
        console.warn('⚠️  Email service initialization failed:', error);
      }
      
      // Setup Swagger documentation
      if (process.env.NODE_ENV !== 'production') {
        setupSwagger(this.app);
      }
      
      this.app.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`API Documentation available at http://localhost:${this.port}/api-docs`);
        }
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000');
  const server = new Server(port);
  server.start();
}
