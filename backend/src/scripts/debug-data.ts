import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { IsNull } from 'typeorm';

/**
 * Debug script to check what data exists in the database
 */
async function debugData() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Debugging database data...');

    const departmentRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);
    const userRepo = AppDataSource.getRepository(User);

    // Check departments
    const allDepartments = await departmentRepo.find();
    const globalDepartments = await departmentRepo.find({
      where: { organizationId: IsNull() }
    });
    
    console.log(`📊 DEPARTMENTS:`);
    console.log(`  Total departments: ${allDepartments.length}`);
    console.log(`  Global departments (no org): ${globalDepartments.length}`);
    
    if (allDepartments.length > 0) {
      console.log(`  Sample departments:`);
      allDepartments.slice(0, 5).forEach(dept => {
        console.log(`    - ${dept.name} (org: ${(dept as any).organizationId || 'NULL'})`);
      });
    }

    // Check services
    const allServices = await serviceRepo.find();
    const globalServices = await serviceRepo.find({
      where: { organizationId: IsNull() }
    });
    
    console.log(`\n🔧 SERVICES:`);
    console.log(`  Total services: ${allServices.length}`);
    console.log(`  Global services (no org): ${globalServices.length}`);
    
    if (allServices.length > 0) {
      console.log(`  Sample services:`);
      allServices.slice(0, 5).forEach(service => {
        console.log(`    - ${service.name} (org: ${(service as any).organizationId || 'NULL'})`);
      });
    }

    // Check users (excluding super admin)
    const allUsers = await userRepo.find();
    const globalUsers = await userRepo.find({
      where: { organizationId: IsNull() }
    });
    
    console.log(`\n👥 USERS:`);
    console.log(`  Total users: ${allUsers.length}`);
    console.log(`  Global users (no org): ${globalUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log(`  Sample users:`);
      allUsers.slice(0, 5).forEach(user => {
        console.log(`    - ${user.firstName} ${user.lastName} (${user.role}) (org: ${(user as any).organizationId || 'NULL'})`);
      });
    }

    // Check organizations
    const orgRepo = AppDataSource.getRepository('Organization');
    const allOrgs = await orgRepo.find();
    console.log(`\n🏢 ORGANIZATIONS:`);
    console.log(`  Total organizations: ${allOrgs.length}`);
    if (allOrgs.length > 0) {
      allOrgs.forEach((org: any) => {
        console.log(`    - ${org.name} (${org.subdomain}) - ID: ${org.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run debug
debugData();
