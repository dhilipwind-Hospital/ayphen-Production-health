import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { User } from '../models/User';

/**
 * Debug script to simulate API calls and see what data is returned
 */
async function debugApiCalls() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Debugging API calls for Newarun organization...');

    const departmentRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);
    const userRepo = AppDataSource.getRepository(User);

    // Simulate what the departments API should return for Newarun
    const newarunOrgId = 'd5b36718-9c30-4d3f-b281-f2153ac6a43d';
    
    console.log(`\n📊 Simulating API calls for Newarun (${newarunOrgId}):`);
    
    // Test 1: Departments API
    const departments = await departmentRepo.find({
      where: { organizationId: newarunOrgId },
      order: { name: 'ASC' },
      relations: ['services']
    });
    
    console.log(`\n🏢 GET /admin/departments:`);
    console.log(`   Count: ${departments.length}`);
    if (departments.length > 0) {
      console.log(`   Names: ${departments.map(d => d.name).join(', ')}`);
    } else {
      console.log(`   ✅ CORRECT: Should show empty state`);
    }

    // Test 2: Services API
    const services = await serviceRepo.find({
      where: { organizationId: newarunOrgId },
      order: { name: 'ASC' },
      relations: ['department']
    });
    
    console.log(`\n🔧 GET /admin/services:`);
    console.log(`   Count: ${services.length}`);
    if (services.length > 0) {
      console.log(`   Names: ${services.slice(0, 5).map(s => s.name).join(', ')}`);
    } else {
      console.log(`   ✅ CORRECT: Should show empty state`);
    }

    // Test 3: Users/Staff API
    const staff = await userRepo.find({
      where: { organizationId: newarunOrgId },
      order: { firstName: 'ASC' }
    });
    
    console.log(`\n👥 GET /admin/users (staff):`);
    console.log(`   Count: ${staff.length}`);
    if (staff.length > 0) {
      staff.forEach(user => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.role})`);
      });
    }

    // Test 4: Check if there's any data without organizationId (should be 0 after cleanup)
    const orphanDepartments = await departmentRepo.createQueryBuilder('dept')
      .where('dept.organizationId IS NULL')
      .getCount();
      
    const orphanServices = await serviceRepo.createQueryBuilder('service')
      .where('service.organizationId IS NULL')
      .getCount();
      
    console.log(`\n🔍 Orphan Data Check (should be 0):`);
    console.log(`   Departments without org: ${orphanDepartments}`);
    console.log(`   Services without org: ${orphanServices}`);

    // Test 5: Check Default Hospital data (what might be leaking)
    const defaultOrgId = '00000000-0000-0000-0000-000000000001';
    const defaultDepartments = await departmentRepo.find({
      where: { organizationId: defaultOrgId }
    });
    
    console.log(`\n🏥 Default Hospital Data (potential source of leak):`);
    console.log(`   Departments: ${defaultDepartments.length}`);
    if (defaultDepartments.length > 0) {
      console.log(`   Names: ${defaultDepartments.slice(0, 5).map(d => d.name).join(', ')}`);
    }

    // Test 6: Raw query to see ALL departments and their organizations
    const allDepartments = await departmentRepo.createQueryBuilder('dept')
      .select(['dept.name', 'dept.organizationId'])
      .orderBy('dept.organizationId', 'ASC')
      .addOrderBy('dept.name', 'ASC')
      .getRawMany();
      
    console.log(`\n📋 All Departments by Organization:`);
    const orgGroups: { [key: string]: string[] } = {};
    allDepartments.forEach(dept => {
      const orgId = dept.dept_organization_id || 'NULL';
      if (!orgGroups[orgId]) orgGroups[orgId] = [];
      orgGroups[orgId].push(dept.dept_name);
    });
    
    Object.keys(orgGroups).forEach(orgId => {
      console.log(`   ${orgId}: ${orgGroups[orgId].length} departments`);
      if (orgId === newarunOrgId) {
        console.log(`     ✅ Newarun: ${orgGroups[orgId].join(', ') || 'NONE'}`);
      } else if (orgId === defaultOrgId) {
        console.log(`     🏥 Default: ${orgGroups[orgId].slice(0, 3).join(', ')}...`);
      }
    });

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run debug
debugApiCalls();
