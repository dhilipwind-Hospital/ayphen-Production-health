import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

/**
 * Debug script to check user authentication and organization assignment
 */
async function debugUserAuth() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Debugging user authentication...');

    const userRepo = AppDataSource.getRepository(User);

    // Find the Newarun admin user
    const newarunUser = await userRepo.findOne({
      where: { 
        firstName: 'new',
        lastName: 'arun'
      },
      relations: ['organization']
    });
    
    if (!newarunUser) {
      console.log('❌ Newarun admin user not found!');
      return;
    }
    
    console.log(`✅ Found Newarun admin user:`);
    console.log(`   ID: ${newarunUser.id}`);
    console.log(`   Name: ${newarunUser.firstName} ${newarunUser.lastName}`);
    console.log(`   Email: ${newarunUser.email}`);
    console.log(`   Role: ${newarunUser.role}`);
    console.log(`   Organization ID: ${(newarunUser as any).organizationId}`);
    
    if ((newarunUser as any).organization) {
      console.log(`   Organization Name: ${(newarunUser as any).organization.name}`);
      console.log(`   Organization Subdomain: ${(newarunUser as any).organization.subdomain}`);
    } else {
      console.log(`   Organization: NOT LOADED`);
    }

    // Check if organization_id matches Newarun
    const expectedOrgId = 'd5b36718-9c30-4d3f-b281-f2153ac6a43d';
    const actualOrgId = (newarunUser as any).organizationId;
    
    console.log(`\n🔍 Organization ID Check:`);
    console.log(`   Expected (Newarun): ${expectedOrgId}`);
    console.log(`   Actual (User):      ${actualOrgId}`);
    console.log(`   Match: ${actualOrgId === expectedOrgId ? '✅ YES' : '❌ NO'}`);
    
    if (actualOrgId !== expectedOrgId) {
      console.log(`\n🚨 PROBLEM FOUND: User's organizationId doesn't match Newarun organization!`);
      
      // Find what organization the user is actually assigned to
      const orgRepo = AppDataSource.getRepository('Organization');
      const actualOrg = await orgRepo.findOne({
        where: { id: actualOrgId }
      });
      
      if (actualOrg) {
        console.log(`   User is assigned to: ${actualOrg.name} (${actualOrg.subdomain})`);
        console.log(`   This explains why they see that organization's data!`);
      }
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run debug
debugUserAuth();
