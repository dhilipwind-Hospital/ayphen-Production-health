import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { IsNull } from 'typeorm';

/**
 * Clean up global sample data that was created without organizationId
 * This data appears in all organizations and should be removed
 */
async function cleanupGlobalData() {
  try {
    await AppDataSource.initialize();
    console.log('🧹 Starting cleanup of global sample data...');

    const departmentRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);
    const userRepo = AppDataSource.getRepository(User);

    // Find and delete departments without organizationId
    const globalDepartments = await departmentRepo.find({
      where: { organizationId: IsNull() }
    });
    
    if (globalDepartments.length > 0) {
      console.log(`🗑️  Found ${globalDepartments.length} global departments to delete`);
      await departmentRepo.remove(globalDepartments);
      console.log('✅ Deleted global departments');
    }

    // Find and delete services without organizationId
    const globalServices = await serviceRepo.find({
      where: { organizationId: IsNull() }
    });
    
    if (globalServices.length > 0) {
      console.log(`🗑️  Found ${globalServices.length} global services to delete`);
      await serviceRepo.remove(globalServices);
      console.log('✅ Deleted global services');
    }

    // Find and delete users without organizationId (except super admin)
    const globalUsers = await userRepo.find({
      where: { organizationId: IsNull() }
    });
    
    // Filter out super admin
    const usersToDelete = globalUsers.filter((user: any) => user.role !== 'super_admin');
    
    if (usersToDelete.length > 0) {
      console.log(`🗑️  Found ${usersToDelete.length} global users to delete`);
      await userRepo.remove(usersToDelete);
      console.log('✅ Deleted global users');
    }

    console.log('🎉 Global data cleanup completed successfully!');
    console.log('📝 New organizations should now show empty states');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run cleanup if called directly
cleanupGlobalData();

export { cleanupGlobalData };
