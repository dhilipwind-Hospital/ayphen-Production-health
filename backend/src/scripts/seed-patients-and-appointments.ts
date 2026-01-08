import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { Service } from '../models/Service';
import { UserRole } from '../types/roles';
import { Organization } from '../models/Organization';

(async () => {
  try {
    const ENABLE_SAMPLE_DATA = String(process.env.ENABLE_SAMPLE_DATA || 'false').toLowerCase() === 'true';
    if (!ENABLE_SAMPLE_DATA) {
      console.log('ENABLE_SAMPLE_DATA is false. Skipping seed-patients-and-appointments.');
      process.exit(0);
    }

    console.log('Initializing database connection...');
    const ds = await AppDataSource.initialize();
    console.log('Database connection established.');

    const userRepo = ds.getRepository(User);
    const appointmentRepo = ds.getRepository(Appointment);
    const serviceRepo = ds.getRepository(Service);
    const orgRepo = ds.getRepository(Organization);

    // Resolve target organization for seeded data
    // Priority: DEFAULT org by subdomain 'default' → first active org → abort
    const targetOrg = await orgRepo.findOne({ where: [{ subdomain: 'default' }, { name: 'Ayphen Care' }] as any });
    if (!targetOrg) {
      console.log('No default organization found. Please create an organization (e.g., subdomain="default"). Aborting seeds.');
      process.exit(0);
    }

    // Create patients - ALWAYS assign organizationId to targetOrg
    const patients = [
      {
        email: 'raja.patient@example.com',
        firstName: 'raja',
        lastName: 'patient',
        phone: '+91-9876543001',
        age: 35,
        gender: 'Male'
      },
      {
        email: 'arun.bharati@example.com',
        firstName: 'arun',
        lastName: 'bharati',
        phone: '+91-9876543002',
        age: 28,
        gender: 'Male'
      },
      {
        email: 'priya.sharma@example.com',
        firstName: 'Priya',
        lastName: 'Sharma',
        phone: '+91-9876543003',
        age: 32,
        gender: 'Female'
      },
      {
        email: 'ravi.kumar@example.com',
        firstName: 'Ravi',
        lastName: 'Kumar',
        phone: '+91-9876543004',
        age: 45,
        gender: 'Male'
      }
    ];

    console.log('Creating patients for org:', targetOrg.name, targetOrg.id);
    const createdPatients = [];
    for (const patientData of patients) {
      let patient = await userRepo.findOne({ where: { email: patientData.email, organizationId: targetOrg.id } as any });
      if (!patient) {
        patient = new User();
        patient.email = patientData.email;
        patient.firstName = patientData.firstName;
        patient.lastName = patientData.lastName;
        patient.phone = patientData.phone;
        patient.password = 'Patient@123';
        patient.role = UserRole.PATIENT;
        patient.isActive = true;
        patient.gender = patientData.gender;
        patient.dateOfBirth = new Date(1990 - patientData.age + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        patient.organizationId = targetOrg.id;
        await patient.hashPassword();
        await userRepo.save(patient);
        console.log(`Created patient: ${patient.firstName} ${patient.lastName} (org=${targetOrg.id})`);
      }
      createdPatients.push(patient);
    }

    // Get doctors
    const cardiologyDoctor = await userRepo.findOne({ where: { email: 'cardiology.consultant@example.com' } });
    const orthopedicsDoctor = await userRepo.findOne({ where: { email: 'orthopedics.chief@example.com' } });
    const generalMedicineDoctor = await userRepo.findOne({ where: { email: 'general-medicine.senior@example.com' } });

    // Get departments first
    const departments = await ds.getRepository('Department').find();
    const defaultDepartment = departments[0] || { id: '1' }; // Use first department or fallback

    // Get or create services (scoped to org)
    let ecgService = await serviceRepo.findOne({ where: { name: 'ECG', organizationId: targetOrg.id } as any });
    if (!ecgService) {
      ecgService = new Service();
      ecgService.name = 'ECG';
      ecgService.description = 'Electrocardiogram test';
      ecgService.averageDuration = 30;
      ecgService.status = 'active';
      ecgService.departmentId = defaultDepartment.id;
      (ecgService as any).organizationId = targetOrg.id;
      await serviceRepo.save(ecgService);
    }

    let physiotherapyService = await serviceRepo.findOne({ where: { name: 'Physiotherapy', organizationId: targetOrg.id } as any });
    if (!physiotherapyService) {
      physiotherapyService = new Service();
      physiotherapyService.name = 'Physiotherapy';
      physiotherapyService.description = 'Therapeutic exercises and treatments';
      physiotherapyService.averageDuration = 45;
      physiotherapyService.status = 'active';
      physiotherapyService.departmentId = defaultDepartment.id;
      (physiotherapyService as any).organizationId = targetOrg.id;
      await serviceRepo.save(physiotherapyService);
    }

    let consultationService = await serviceRepo.findOne({ where: { name: 'General Consultation' } });
    if (!consultationService) {
      consultationService = new Service();
      consultationService.name = 'General Consultation';
      consultationService.description = 'General medical consultation';
      consultationService.averageDuration = 30;
      consultationService.status = 'active';
      consultationService.departmentId = defaultDepartment.id;
      await serviceRepo.save(consultationService);
    }

    // Create appointments
    const appointments = [
      {
        patient: createdPatients[0], // raja patient
        doctor: cardiologyDoctor,
        service: ecgService,
        startTime: new Date('2025-10-03T10:00:00'),
        endTime: new Date('2025-10-03T10:30:00'),
        status: 'confirmed'
      },
      {
        patient: createdPatients[1], // arun bharati
        doctor: cardiologyDoctor,
        service: ecgService,
        startTime: new Date('2025-09-26T06:00:00'),
        endTime: new Date('2025-09-26T06:30:00'),
        status: 'confirmed'
      },
      {
        patient: createdPatients[0], // raja patient
        doctor: orthopedicsDoctor,
        service: physiotherapyService,
        startTime: new Date('2025-10-02T14:00:00'),
        endTime: new Date('2025-10-02T15:00:00'),
        status: 'confirmed'
      },
      {
        patient: createdPatients[2], // Priya Sharma
        doctor: generalMedicineDoctor,
        service: consultationService,
        startTime: new Date('2025-10-04T11:00:00'),
        endTime: new Date('2025-10-04T11:30:00'),
        status: 'confirmed'
      }
    ];

    console.log('Creating appointments...');
    for (const appointmentData of appointments) {
      if (appointmentData.doctor && appointmentData.patient) {
        const existingAppointment = await appointmentRepo.findOne({
          where: {
            patient: { id: appointmentData.patient.id },
            doctor: { id: appointmentData.doctor.id },
            startTime: appointmentData.startTime
          }
        });

        if (!existingAppointment) {
          const appointment = new Appointment();
          appointment.patient = appointmentData.patient;
          appointment.doctor = appointmentData.doctor;
          appointment.service = appointmentData.service;
          appointment.startTime = appointmentData.startTime;
          appointment.endTime = appointmentData.endTime;
          appointment.status = appointmentData.status as any;
          await appointmentRepo.save(appointment);
          console.log(`Created appointment: ${appointmentData.patient.firstName} ${appointmentData.patient.lastName} with Dr. ${appointmentData.doctor.firstName} ${appointmentData.doctor.lastName}`);
        }
      }
    }

    await ds.destroy();
    console.log('Database connection closed.');
    console.log('✅ Patients and appointments seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding patients and appointments:', error);
    try { await AppDataSource.destroy(); } catch {}
    process.exit(1);
  }
})();
