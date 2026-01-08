import dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Organization } from '../models/Organization';

async function seedSuperAdmin() {
    console.log('🔧 Initializing database connection...');
    await AppDataSource.initialize();

    console.log('🏥 Creating Platform Owner / Super Admin...');

    const orgRepo = AppDataSource.getRepository(Organization);
    const userRepo = AppDataSource.getRepository(User);

    // Create Platform Organization if not exists
    let platformOrg = await orgRepo.findOne({ where: { subdomain: 'platform' } });
    if (!platformOrg) {
        platformOrg = new Organization();
        platformOrg.name = 'Ayphen Platform';
        platformOrg.subdomain = 'platform';
        platformOrg.isActive = true;
        platformOrg.description = 'Platform management organization';
        platformOrg.settings = {
            subscription: {
                plan: 'enterprise',
                status: 'active'
            }
        };
        platformOrg = await orgRepo.save(platformOrg);
        console.log('✅ Platform organization created');
    }

    // Create Super Admin user
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@ayphen.care';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

    let superAdmin = await userRepo.findOne({ where: { email: superAdminEmail } });
    if (!superAdmin) {
        superAdmin = new User();
        superAdmin.email = superAdminEmail;
        superAdmin.firstName = 'Platform';
        superAdmin.lastName = 'Admin';
        superAdmin.role = UserRole.SUPER_ADMIN;
        superAdmin.isActive = true;
        superAdmin.organization = platformOrg;
        (superAdmin as any).password = superAdminPassword;
        await (superAdmin as any).hashPassword();
        superAdmin = await userRepo.save(superAdmin);
        console.log('✅ Super Admin created');
        console.log(`   Email: ${superAdminEmail}`);
        console.log(`   Password: ${superAdminPassword}`);
    } else {
        console.log('ℹ️  Super Admin already exists');
        console.log(`   Email: ${superAdminEmail}`);
    }

    console.log('\n🎉 Setup complete!');
    console.log('='.repeat(50));
    console.log('You can now log in with:');
    console.log(`  Email: ${superAdminEmail}`);
    console.log(`  Password: ${superAdminPassword}`);
    console.log('='.repeat(50));

    await AppDataSource.destroy();
    process.exit(0);
}

seedSuperAdmin().catch((error) => {
    console.error('❌ Failed to seed super admin:', error);
    process.exit(1);
});
