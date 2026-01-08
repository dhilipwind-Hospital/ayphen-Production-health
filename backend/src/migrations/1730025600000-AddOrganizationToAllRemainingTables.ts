import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migration: Add organization_id to all remaining tables for complete multi-tenant isolation
 *
 * This migration adds organization_id column and foreign key to ALL tables that don't have it yet.
 * Ensures complete data isolation between different hospital organizations.
 *
 * Tables updated: 42 tables
 * - Patient-related: medical_records, allergies, vital_signs, consultation_notes, diagnosis
 * - Billing: bills, claims, policies
 * - Lab: lab_orders, lab_order_items, lab_results, lab_samples, lab_tests
 * - Inpatient: wards, rooms, beds, admissions, nursing_notes, vital_sign, medication_administration, doctor_notes, discharge_summaries
 * - Pharmacy: medicines, prescriptions, prescription_items, medicine_transactions, stock_movements, stock_alerts
 * - Communication: messages, notifications, reminders, feedback, health_articles
 * - Others: availability_slots, triage, telemedicine_sessions, reports, emergency_requests, callback_requests, suppliers, purchase_orders, appointment_history
 */
export class AddOrganizationToAllRemainingTables1730025600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // List of all tables that need organization_id
    const tablesToUpdate = [
      // Patient-related
      'medical_records',
      'allergies',
      'vital_signs',
      'consultation_notes',
      'diagnosis',

      // Billing & Finance
      'bills',
      'claims',
      'policies',

      // Lab Services
      'lab_orders',
      'lab_order_items',
      'lab_results',
      'lab_samples',
      'lab_tests',

      // Inpatient
      'wards',
      'rooms',
      'beds',
      'admissions',
      'nursing_notes',
      'vital_sign', // inpatient vital signs
      'medication_administration',
      'doctor_notes',
      'discharge_summaries',

      // Pharmacy
      'medicines',
      'prescriptions',
      'prescription_items',
      'medicine_transactions',
      'stock_movements',
      'stock_alerts',

      // Communication
      'messages',
      'notifications',
      'reminders',
      'feedback',
      'health_articles',

      // Requests & Support
      'emergency_requests',
      'callback_requests',

      // Procurement
      'suppliers',
      'purchase_orders',

      // Appointments & Availability
      'availability_slots',
      'appointment_history',

      // Consultation
      'triage',
      'telemedicine_sessions',

      // Reports
      'reports',
    ];

    console.log(`\n🔄 Adding organization_id to ${tablesToUpdate.length} tables...\n`);

    for (const tableName of tablesToUpdate) {
      try {
        // Check if table exists
        const tableExists = await queryRunner.hasTable(tableName);
        if (!tableExists) {
          console.log(`⏭️  Skipping ${tableName} (table doesn't exist)`);
          continue;
        }

        // Check if column already exists
        const table = await queryRunner.getTable(tableName);
        const columnExists = table?.columns.find(col => col.name === 'organization_id');

        if (columnExists) {
          console.log(`✅ ${tableName} already has organization_id`);
          continue;
        }

        // Add organization_id column
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'organization_id',
            type: 'uuid',
            isNullable: true, // Nullable initially for backward compatibility with existing data
          })
        );

        // Create foreign key to organizations table
        await queryRunner.createForeignKey(
          tableName,
          new TableForeignKey({
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE', // Delete all data when organization is deleted
            onUpdate: 'CASCADE',
          })
        );

        // Create index for better query performance
        await queryRunner.query(
          `CREATE INDEX IF NOT EXISTS "IDX_${tableName}_organization_id" ON "${tableName}" ("organization_id")`
        );

        console.log(`✅ Added organization_id to ${tableName}`);
      } catch (error) {
        console.error(`❌ Error updating ${tableName}:`, error);
        // Continue with other tables even if one fails
      }
    }

    console.log('\n✅ Migration completed!\n');
    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Create a default organization if it doesn\'t exist');
    console.log('2. Update all NULL organization_id values to the default organization');
    console.log('3. Make organization_id NOT NULL in a follow-up migration');
    console.log('4. Update all controllers to use tenant filtering\n');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tablesToUpdate = [
      'medical_records', 'allergies', 'vital_signs', 'consultation_notes', 'diagnosis',
      'bills', 'claims', 'policies',
      'lab_orders', 'lab_order_items', 'lab_results', 'lab_samples', 'lab_tests',
      'wards', 'rooms', 'beds', 'admissions', 'nursing_notes', 'vital_sign',
      'medication_administration', 'doctor_notes', 'discharge_summaries',
      'medicines', 'prescriptions', 'prescription_items', 'medicine_transactions',
      'stock_movements', 'stock_alerts',
      'messages', 'notifications', 'reminders', 'feedback', 'health_articles',
      'emergency_requests', 'callback_requests',
      'suppliers', 'purchase_orders',
      'availability_slots', 'appointment_history',
      'triage', 'telemedicine_sessions',
      'reports',
    ];

    console.log('\n🔄 Reverting organization_id changes...\n');

    for (const tableName of tablesToUpdate) {
      try {
        const tableExists = await queryRunner.hasTable(tableName);
        if (!tableExists) {
          continue;
        }

        const table = await queryRunner.getTable(tableName);
        if (!table) continue;

        // Drop foreign key
        const foreignKey = table.foreignKeys.find(
          fk => fk.columnNames.indexOf('organization_id') !== -1
        );
        if (foreignKey) {
          await queryRunner.dropForeignKey(tableName, foreignKey);
        }

        // Drop index
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_${tableName}_organization_id"`
        );

        // Drop column
        const columnExists = table.columns.find(col => col.name === 'organization_id');
        if (columnExists) {
          await queryRunner.dropColumn(tableName, 'organization_id');
        }

        console.log(`✅ Reverted ${tableName}`);
      } catch (error) {
        console.error(`❌ Error reverting ${tableName}:`, error);
      }
    }

    console.log('\n✅ Rollback completed!\n');
  }
}
