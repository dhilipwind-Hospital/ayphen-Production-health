import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { DeepPartial } from 'typeorm';
import { UserRole } from '../types/roles';

(async () => {
  const ds = await AppDataSource.initialize();
  const repo = ds.getRepository(User);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  const existing = await repo.findOne({ where: { email } });
  let admin: User;
  if (!existing) {
    const payload: DeepPartial<User> = {
      firstName: 'Admin',
      lastName: 'User',
      email,
      phone: '9999999999',
      password,
      role: UserRole.ADMIN,
      isActive: true,
    };
    admin = repo.create(payload);
    await admin.hashPassword();
    await repo.save(admin);
    console.log(`Created admin user: ${email}`);
  } else {
    admin = existing as User;
    admin.role = UserRole.ADMIN;
    admin.password = password;
    await admin.hashPassword();
    await repo.save(admin);
    console.log(`Updated admin user: ${email}`);
  }

  await ds.destroy();
})().catch(async (e) => {
  console.error('Admin seeding failed:', e);
  try { await AppDataSource.destroy(); } catch {}
  process.exit(1);
});
