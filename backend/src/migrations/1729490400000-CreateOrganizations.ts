import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateOrganizations1729490400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create organizations table
    await queryRunner.createTable(
      new Table({
        name: 'organizations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'subdomain',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'custom_domain',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create default organization for existing data
    // This ensures backward compatibility - all existing data will belong to this organization
    await queryRunner.query(`
      INSERT INTO organizations (id, name, subdomain, description, is_active, settings)
      VALUES (
        'default-org-00000000-0000-0000-0000-000000000001',
        'Default Hospital',
        'default',
        'Default organization for existing data - created during multi-tenant migration',
        true,
        '{"subscription": {"plan": "enterprise", "status": "active"}}'::jsonb
      )
    `);

    console.log('✅ Organizations table created successfully');
    console.log('✅ Default organization created for backward compatibility');
    console.log('   Organization ID: default-org-00000000-0000-0000-0000-000000000001');
    console.log('   Subdomain: default');
    console.log('   All existing data will be assigned to this organization');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organizations');
    console.log('⚠️  Organizations table dropped');
  }
}
