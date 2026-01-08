import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDoctorAvailabilityTable1730230800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'doctor_availability',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            default: "uuid_generate_v4()",
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
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'varchar',
            isNullable: false,
            comment: 'Time in HH:mm format',
          },
          {
            name: 'end_time',
            type: 'varchar',
            isNullable: false,
            comment: 'Time in HH:mm format',
          },
          {
            name: 'slot_duration_minutes',
            type: 'int',
            isNullable: false,
            default: 30,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'on-leave', 'holiday', 'blocked'],
            default: "'available'",
            isNullable: false,
          },
          {
            name: 'is_recurring',
            type: 'boolean',
            default: false,
            isNullable: false,
            comment: 'If true, applies this availability for 12 weeks',
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
      'doctor_availability',
      new TableIndex({
        name: 'IDX_doctor_availability_doctor_date_org',
        columnNames: ['doctor_id', 'date', 'organization_id'],
      })
    );

    await queryRunner.createIndex(
      'doctor_availability',
      new TableIndex({
        name: 'IDX_doctor_availability_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'doctor_availability',
      new TableIndex({
        name: 'IDX_doctor_availability_org',
        columnNames: ['organization_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('doctor_availability');
  }
}
