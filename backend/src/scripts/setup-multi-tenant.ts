import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';

/**
 * Multi-Tenant Setup Script
 *
 * This script:
 * 1. Creates a default organization if it doesn't exist
 * 2. Migrates all existing data to the default organization
 * 3. Ensures all users have organization_id set
 *
 * Run this after the AddOrganizationToAllRemainingTables migration
 *
 * Usage:
 * npx ts-node src/scripts/setup-multi-tenant.ts
 */

async function setupMultiTenant() {
  try {
    console.log('\n🚀 Starting Multi-Tenant Setup...\n');

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established\n');
    }

    // Step 1: Create default organization
    console.log('📋 Step 1: Creating default organization...');
    const orgRepository = AppDataSource.getRepository(Organization);

    let defaultOrg = await orgRepository.findOne({
      where: { subdomain: 'default' }
    });

    if (!defaultOrg) {
      defaultOrg = orgRepository.create({
        name: 'Default Hospital',
        subdomain: 'default',
        description: 'Default organization for existing data migration',
        isActive: true,
        settings: {
          branding: {
            primaryColor: '#1890ff',
            secondaryColor: '#52c41a',
          },
          features: {
            pharmacy: true,
            laboratory: true,
            inpatient: true,
            radiology: true,
          },
          subscription: {
            plan: 'enterprise',
            status: 'active',
          },
          limits: {
            maxUsers: 1000,
            maxPatients: 10000,
            maxStorage: 100,
          },
        },
      });

      await orgRepository.save(defaultOrg);
      console.log(`✅ Created default organization: ${defaultOrg.id}\n`);
    } else {
      console.log(`✅ Default organization already exists: ${defaultOrg.id}\n`);
    }

    const defaultOrgId = defaultOrg.id;

    // Step 2: Get all tables with organization_id column
    const tablesWithOrgId = await queryRunner.query(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE column_name = 'organization_id'
        AND table_schema = 'public'
        AND table_name NOT IN ('organizations', 'refresh_tokens', 'plans', 'referrals')
      ORDER BY table_name;
    `);

    console.log(`📋 Step 2: Migrating data for ${tablesWithOrgId.length} tables...\n`);

    const queryRunner = AppDataSource.createQueryRunner();

    // Step 3: Update all NULL organization_id to default organization
    let totalUpdated = 0;
    for (const row of tablesWithOrgId) {
      const tableName = row.table_name;

      try {
        // Count rows with NULL organization_id
        const [countResult] = await queryRunner.query(
          `SELECT COUNT(*) as count FROM "${tableName}" WHERE organization_id IS NULL`
        );
        const nullCount = parseInt(countResult.count);

        if (nullCount > 0) {
          // Update NULL values to default organization
          await queryRunner.query(
            `UPDATE "${tableName}" SET organization_id = $1 WHERE organization_id IS NULL`,
            [defaultOrgId]
          );

          console.log(`✅ Updated ${nullCount} rows in ${tableName}`);
          totalUpdated += nullCount;
        } else {
          console.log(`✅ ${tableName} (no updates needed)`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${tableName}:`, error);
      }
    }

    console.log(`\n✅ Total rows updated: ${totalUpdated}\n`);

    // Step 4: Update users without organization_id
    console.log('📋 Step 3: Ensuring all users have organization_id...');
    const userUpdateResult = await queryRunner.query(
      `UPDATE users SET organization_id = $1 WHERE organization_id IS NULL`,
      [defaultOrgId]
    );
    console.log(`✅ Updated ${userUpdateResult[1]} users\n`);

    // Step 5: Verification
    console.log('📋 Step 4: Verification...');
    let hasNullValues = false;

    for (const row of tablesWithOrgId) {
      const tableName = row.table_name;
      const [countResult] = await queryRunner.query(
        `SELECT COUNT(*) as count FROM "${tableName}" WHERE organization_id IS NULL`
      );
      const nullCount = parseInt(countResult.count);

      if (nullCount > 0) {
        console.error(`❌ ${tableName} still has ${nullCount} NULL organization_id values`);
        hasNullValues = true;
      }
    }

    if (!hasNullValues) {
      console.log('✅ All tables have valid organization_id values\n');
    }

    // Step 6: Statistics
    console.log('📊 Statistics:');
    console.log(`   Organizations: ${await orgRepository.count()}`);
    console.log(`   Default Org ID: ${defaultOrgId}`);
    console.log(`   Tables with org_id: ${tablesWithOrgId.length}`);
    console.log(`   Rows migrated: ${totalUpdated}\n`);

    console.log('✅ Multi-Tenant Setup Complete!\n');
    console.log('📋 NEXT STEPS:');
    console.log('1. Run follow-up migration to make organization_id NOT NULL');
    console.log('2. Update all controllers to use TenantRepository');
    console.log('3. Test multi-tenant data isolation');
    console.log('4. Create additional test organizations\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Multi-Tenant Setup Failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// Run the setup
setupMultiTenant();
