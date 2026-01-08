import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueReferralAndIndexes20250917121600 implements MigrationInterface {
  name = 'AddUniqueReferralAndIndexes20250917121600'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Deduplicate existing referrals to avoid unique index failure
    await queryRunner.query(`
      DELETE FROM referrals r
      USING referrals r2
      WHERE r.patient_id = r2.patient_id
        AND r.department_id = r2.department_id
        AND r.id > r2.id;
    `);

    // Unique constraint (as unique index) for referrals per (patient, department)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_referrals_patient_department"
      ON referrals (patient_id, department_id);
    `);

    // Speed up lookups by patient
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_referrals_patient"
      ON referrals (patient_id);
    `);

    // Helpful indexes for overlap checks and listing by time
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_doctor_time"
      ON appointments (doctor_id, "startTime", "endTime");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_patient_time"
      ON appointments (patient_id, "startTime", "endTime");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_patient_time";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_doctor_time";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referrals_patient";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_referrals_patient_department";`);
  }
}
