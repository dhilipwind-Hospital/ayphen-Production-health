import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { User } from '../models/User';

/**
 * Debug script to check Newarun organization specifically
 */
async function debugNewarun() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Debugging Newarun organization...');

    const orgRepo = AppDataSource.getRepository('Organization');
    const departmentRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);
    const userRepo = AppDataSource.getRepository(User);

    // Find Newarun organization
    const newarunOrg = await orgRepo.findOne({
      where: { subdomain: 'newarun' }
    });
    
    if (!newarunOrg) {
      console.log('❌ Newarun organization not found!');
      return;
    }
    
    console.log(`✅ Found Newarun organization:`);
    console.log(`   ID: ${newarunOrg.id}`);
    console.log(`   Name: ${newarunOrg.name}`);
    console.log(`   Subdomain: ${newarunOrg.subdomain}`);

    // Check data for Newarun organization
    const newarunDepartments = await departmentRepo.find({
      where: { organizationId: newarunOrg.id }
    });
    
    const newarunServices = await serviceRepo.find({
      where: { organizationId: newarunOrg.id }
    });
    
    const newarunUsers = await userRepo.find({
      where: { organizationId: newarunOrg.id }
    });

    console.log(`\n📊 Newarun Data:`);
    console.log(`   Departments: ${newarunDepartments.length}`);
    console.log(`   Services: ${newarunServices.length}`);
    console.log(`   Users: ${newarunUsers.length}`);

    if (newarunDepartments.length > 0) {
      console.log(`   Department names: ${newarunDepartments.map(d => d.name).join(', ')}`);
    }

    if (newarunServices.length > 0) {
      console.log(`   Service names: ${newarunServices.slice(0, 5).map(s => s.name).join(', ')}`);
    }

    if (newarunUsers.length > 0) {
      console.log(`   Users: ${newarunUsers.map(u => `${u.firstName} ${u.lastName} (${u.role})`).join(', ')}`);
    }

    // Check Default Hospital data (what might be leaking)
    const defaultOrg = await orgRepo.findOne({
      where: { subdomain: 'default' }
    });
    
    if (defaultOrg) {
      const defaultDepartments = await departmentRepo.find({
        where: { organizationId: defaultOrg.id }
      });
      
      console.log(`\n🏢 Default Hospital Data (might be leaking):`);
      console.log(`   ID: ${defaultOrg.id}`);
      console.log(`   Departments: ${defaultDepartments.length}`);
      if (defaultDepartments.length > 0) {
        console.log(`   Department names: ${defaultDepartments.slice(0, 5).map(d => d.name).join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run debug
debugNewarun();
