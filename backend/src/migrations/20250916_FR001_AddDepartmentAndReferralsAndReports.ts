import { MigrationInterface, QueryRunner } from "typeorm";

export class FR001AddDepartmentAndReferralsAndReports20250916000000 implements MigrationInterface {
  name = 'FR001AddDepartmentAndReferralsAndReports20250916000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid extension exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Add department_id and primary_department_id to users
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department_id" uuid NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "primary_department_id" uuid NULL`);

    // Add FKs for department columns (if not already present)
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_department' AND table_name = 'users'
      ) THEN
        ALTER TABLE "users" ADD CONSTRAINT fk_users_department FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL;
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_primary_department' AND table_name = 'users'
      ) THEN
        ALTER TABLE "users" ADD CONSTRAINT fk_users_primary_department FOREIGN KEY ("primary_department_id") REFERENCES "departments"("id") ON DELETE SET NULL;
      END IF;
    END $$;`);

    // Create referrals
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "referrals" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_referrals_patient FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT fk_referrals_department FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE
      )
    `);

    // Create reports
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patient_id" uuid NOT NULL,
        "type" varchar NOT NULL DEFAULT 'other',
        "title" varchar(255) NOT NULL,
        "content" text NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_reports_patient FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Useful index for access checks
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_referrals_patient_department ON referrals(patient_id, department_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reports_patient`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_referrals_patient_department`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals"`);

    // Drop FKs then columns
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_primary_department' AND table_name = 'users'
      ) THEN
        ALTER TABLE "users" DROP CONSTRAINT fk_users_primary_department;
      END IF;
    END $$;`);

    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_department' AND table_name = 'users'
      ) THEN
        ALTER TABLE "users" DROP CONSTRAINT fk_users_department;
      END IF;
    END $$;`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "primary_department_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "department_id"`);
  }
}
