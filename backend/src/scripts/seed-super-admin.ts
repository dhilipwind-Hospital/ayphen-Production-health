import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../config/database';

dotenv.config();
import { User } from '../models/User';
import { DeepPartial } from 'typeorm';
import { UserRole } from '../types/roles';

// Load environment variables
if (!process.env.DB_HOST) {
  dotenv.config({ path: '.env' });
}

(async () => {
  try {
    const ds = await AppDataSource.initialize();
    const repo = ds.getRepository(User);

    const email = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@hospital.com';
    const password = process.env.SEED_SUPER_ADMIN_PASSWORD || 'SuperAdmin@2025';
    const firstName = process.env.SEED_SUPER_ADMIN_FIRST_NAME || 'Super';
    const lastName = process.env.SEED_SUPER_ADMIN_LAST_NAME || 'Admin';

    const existing = await repo.findOne({ where: { email } });
    let superAdmin: User;

    if (!existing) {
      const payload: DeepPartial<User> = {
        firstName,
        lastName,
        email,
        phone: '9999999999',
        password,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      };
      superAdmin = repo.create(payload);
      await superAdmin.hashPassword();
      await repo.save(superAdmin);
      console.log(`✅ Created super admin user: ${email}`);
      console.log(`   Name: ${firstName} ${lastName}`);
      console.log(`   Role: ${UserRole.SUPER_ADMIN}`);
      console.log(`   Password: ${password}`);
    } else {
      superAdmin = existing as User;
      if (superAdmin.role !== UserRole.SUPER_ADMIN) {
        superAdmin.role = UserRole.SUPER_ADMIN;
        superAdmin.password = password;
        await superAdmin.hashPassword();
        await repo.save(superAdmin);
        console.log(`✅ Updated user to super admin: ${email}`);
      } else {
        console.log(`ℹ️  Super admin already exists: ${email}`);
      }
    }

    await ds.destroy();
    console.log('✅ Super admin seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Super admin seeding failed:', error);
    try {
      await AppDataSource.destroy();
    } catch {}
    process.exit(1);
  }
})();
