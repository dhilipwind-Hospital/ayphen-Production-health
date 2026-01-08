import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddOrganizationToUsers1729490500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Adding organization_id to users table...');

    // 1. Add organization_id column (nullable first for safety)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'organization_id',
        type: 'uuid',
        isNullable: true,
      })
    );
    console.log('✅ Added organization_id column to users');

    // 2. Set default organization for all existing users
    // This ensures backward compatibility - all existing users will belong to default org
    const result = await queryRunner.query(`
      UPDATE users 
      SET organization_id = 'default-org-00000000-0000-0000-0000-000000000001'
      WHERE organization_id IS NULL
    `);
    console.log(`✅ Assigned ${result[1]} existing users to default organization`);

    // 3. Make it NOT NULL (now that all records have a value)
    await queryRunner.changeColumn(
      'users',
      'organization_id',
      new TableColumn({
        name: 'organization_id',
        type: 'uuid',
        isNullable: false,
      })
    );
    console.log('✅ Made organization_id NOT NULL');

    // 4. Add foreign key constraint
    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        name: 'FK_users_organization',
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    console.log('✅ Added foreign key constraint');

    // 5. Add index for performance
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_organization_id',
        columnNames: ['organization_id'],
      })
    );
    console.log('✅ Added index on organization_id');

    // 6. Update unique constraint on email to be per organization
    // Drop old unique constraint
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS "UQ_users_email"
    `);
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_email_key"
    `);
    
    // Add new composite unique constraint (email unique per organization)
    await queryRunner.query(`
      ALTER TABLE users ADD CONSTRAINT "UQ_users_email_organization" 
      UNIQUE (email, organization_id)
    `);
    console.log('✅ Updated email constraint to be unique per organization');

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('   - All existing users assigned to default organization');
    console.log('   - Email is now unique per organization (not globally)');
    console.log('   - No breaking changes - all existing functionality preserved');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️  Rolling back organization_id from users...');

    // Remove composite unique constraint
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS "UQ_users_email_organization"
    `);

    // Restore original unique constraint on email
    await queryRunner.query(`
      ALTER TABLE users ADD CONSTRAINT "UQ_users_email" UNIQUE (email)
    `);

    // Remove index
    await queryRunner.dropIndex('users', 'IDX_users_organization_id');

    // Remove foreign key
    await queryRunner.dropForeignKey('users', 'FK_users_organization');

    // Remove column
    await queryRunner.dropColumn('users', 'organization_id');

    console.log('✅ Rollback completed');
  }
}
