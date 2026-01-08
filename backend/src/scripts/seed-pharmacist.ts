import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

(async () => {
  try {
    console.log('Initializing database connection...');
    const ds = await AppDataSource.initialize();
    console.log('Database connection established.');

    const userRepo = ds.getRepository(User);
    const email = process.env.SEED_PHARMACIST_EMAIL || 'pharmacist@example.com';
    const password = process.env.SEED_PHARMACIST_PASSWORD || 'Pharmacist@123';

    let pharmacist = await userRepo.findOne({ where: { email } });
    if (!pharmacist) {
      console.log('Creating pharmacist user...');
      pharmacist = new User();
      pharmacist.firstName = 'Pharmacy';
      pharmacist.lastName = 'Manager';
      pharmacist.email = email;
      pharmacist.phone = '9999999999';
      pharmacist.password = password;
      pharmacist.role = UserRole.PHARMACIST;
      pharmacist.isActive = true;
      await pharmacist.hashPassword();
      await userRepo.save(pharmacist);
      console.log(`Created pharmacist user: ${email}`);
    } else {
      console.log(`Pharmacist user already exists: ${email}`);
      pharmacist.role = UserRole.PHARMACIST;
      pharmacist.password = password;
      await pharmacist.hashPassword();
      await userRepo.save(pharmacist);
      console.log(`Updated pharmacist user: ${email}`);
    }

    await ds.destroy();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding pharmacist:', error);
    try { await AppDataSource.destroy(); } catch {}
    process.exit(1);
  }
})();
