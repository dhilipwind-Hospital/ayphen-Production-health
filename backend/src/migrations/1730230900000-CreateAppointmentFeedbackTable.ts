import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppointmentFeedbackTable1730230900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'appointment_feedback',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          {
            name: 'appointment_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'patient_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'doctor_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'doctor_rating',
            type: 'smallint',
            isNullable: false,
            comment: '1-5 star rating',
          },
          {
            name: 'facility_rating',
            type: 'smallint',
            isNullable: false,
            comment: '1-5 star rating',
          },
          {
            name: 'staff_rating',
            type: 'smallint',
            isNullable: false,
            comment: '1-5 star rating',
          },
          {
            name: 'overall_rating',
            type: 'smallint',
            isNullable: false,
            comment: '1-5 star rating',
          },
          {
            name: 'doctor_comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'facility_comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'overall_comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'would_recommend',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'follow_up_needed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'follow_up_reason',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'submitted_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['appointment_id'],
            referencedTableName: 'appointments',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['patient_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['doctor_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'appointment_feedback',
      new TableIndex({
        name: 'IDX_appointment_feedback_appointment',
        columnNames: ['appointment_id'],
      })
    );

    await queryRunner.createIndex(
      'appointment_feedback',
      new TableIndex({
        name: 'IDX_appointment_feedback_doctor_org',
        columnNames: ['doctor_id', 'organization_id'],
      })
    );

    await queryRunner.createIndex(
      'appointment_feedback',
      new TableIndex({
        name: 'IDX_appointment_feedback_patient',
        columnNames: ['patient_id'],
      })
    );

    await queryRunner.createIndex(
      'appointment_feedback',
      new TableIndex({
        name: 'IDX_appointment_feedback_org',
        columnNames: ['organization_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('appointment_feedback');
  }
}
