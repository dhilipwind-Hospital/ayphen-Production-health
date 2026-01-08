import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

dotenv.config();

(async () => {
  try {
    const ds = await AppDataSource.initialize();
    const userRepo = ds.getRepository(User);

    // Update user role to nurse
    const email = 'sarah.johnson@hospital.com'; // Replace with your nurse email
    
    console.log(`🔍 Looking for user: ${email}`);
    
    const user = await userRepo.findOne({ where: { email } });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`📋 Current user details:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organizationId}`);

    // Update role to nurse
    user.role = 'nurse' as any;
    await userRepo.save(user);

    console.log(`✅ User role updated successfully!`);
    console.log(`   New Role: ${user.role}`);
    console.log(`   User can now access:`);
    console.log(`   - Triage Station (/queue/triage)`);
    console.log(`   - Inpatient Nursing Care (/inpatient/nursing)`);
    console.log(`   - Bed Management (/inpatient/beds)`);
    console.log(`   - Ward Overview (/inpatient/wards)`);

    await ds.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    try {
      await AppDataSource.destroy();
    } catch {}
    process.exit(1);
  }
})();
