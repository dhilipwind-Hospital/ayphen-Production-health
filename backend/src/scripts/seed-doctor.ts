import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { DeepPartial } from 'typeorm';
import { UserRole } from '../types/roles';

(async () => {
  const ds = await AppDataSource.initialize();
  const userRepo = ds.getRepository(User);
  const deptRepo = ds.getRepository(Department);

  const email = process.env.SEED_DOCTOR_EMAIL || 'doc@example.com';
  const password = process.env.SEED_DOCTOR_PASSWORD || 'Doctor@123';

  // Ensure a department exists
  let department = await deptRepo.findOne({ where: { name: 'General Medicine' } });
  if (!department) {
    const newDept = new Department();
    newDept.name = 'General Medicine';
    newDept.description = 'General medical services';
    department = await deptRepo.save(newDept);
    console.log('Created General Medicine department');
  }

  const existing = await userRepo.findOne({ where: { email } });
  let doctor: User;
  if (!existing) {
    const payload: DeepPartial<User> = {
      firstName: 'Doctor',
      lastName: 'User',
      email,
      phone: '9999999998',
      password,
      role: UserRole.DOCTOR,
      isActive: true,
      departmentId: department!.id,
    };
    doctor = userRepo.create(payload);
    await doctor.hashPassword();
    await userRepo.save(doctor);
    console.log(`Created doctor user: ${email}`);
  } else {
    doctor = existing as User;
    doctor.role = UserRole.DOCTOR;
    doctor.password = password;
    doctor.departmentId = department!.id;
    doctor.isActive = true;
    await doctor.hashPassword();
    await userRepo.save(doctor);
    console.log(`Updated doctor user: ${email}`);
  }

  await ds.destroy();
})().catch(async (e) => {
  console.error('Doctor seeding failed:', e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});
