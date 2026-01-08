import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAppointmentManagementFields1730231000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add appointment mode column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'mode',
        type: 'enum',
        enum: ['in-person', 'telemedicine', 'home-visit'],
        default: "'in-person'",
        isNullable: false,
        comment: 'Type of appointment delivery',
      })
    );

    // Add appointment type column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'appointment_type',
        type: 'enum',
        enum: ['standard', 'emergency'],
        default: "'standard'",
        isNullable: false,
        comment: 'Whether this is a standard or emergency appointment',
      })
    );

    // Add telemedicine link column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'telemedicine_link',
        type: 'varchar',
        isNullable: true,
        comment: 'Zoom/Google Meet link for telemedicine appointments',
      })
    );

    // Add cancellation date column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'cancellation_date',
        type: 'timestamp',
        isNullable: true,
        comment: 'When the appointment was cancelled',
      })
    );

    // Add cancellation reason column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'cancellation_reason',
        type: 'text',
        isNullable: true,
        comment: 'Reason for cancellation',
      })
    );

    // Add cancellation charge column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'cancellation_charge',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Cancellation fee charged to patient',
      })
    );

    // Add completed_at column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'completed_at',
        type: 'timestamp',
        isNullable: true,
        comment: 'When the appointment was completed',
      })
    );

    // Add consultation notes column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'consultation_notes',
        type: 'text',
        isNullable: true,
        comment: 'Notes from the doctor consultation',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('appointments', 'consultation_notes');
    await queryRunner.dropColumn('appointments', 'completed_at');
    await queryRunner.dropColumn('appointments', 'cancellation_charge');
    await queryRunner.dropColumn('appointments', 'cancellation_reason');
    await queryRunner.dropColumn('appointments', 'cancellation_date');
    await queryRunner.dropColumn('appointments', 'telemedicine_link');
    await queryRunner.dropColumn('appointments', 'appointment_type');
    await queryRunner.dropColumn('appointments', 'mode');
  }
}
