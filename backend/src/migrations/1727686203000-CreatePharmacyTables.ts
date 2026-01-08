import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePharmacyTables1727686203000 implements MigrationInterface {
    name = 'CreatePharmacyTables1727686203000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create medicines table
        await queryRunner.query(`
            CREATE TABLE "medicines" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "genericName" character varying NOT NULL,
                "brandName" character varying NOT NULL,
                "manufacturer" character varying NOT NULL,
                "category" character varying NOT NULL,
                "dosageForm" character varying NOT NULL,
                "strength" character varying NOT NULL,
                "unitPrice" numeric(10,2) NOT NULL,
                "sellingPrice" numeric(10,2) NOT NULL,
                "batchNumber" character varying NOT NULL,
                "manufactureDate" date NOT NULL,
                "expiryDate" date NOT NULL,
                "currentStock" integer NOT NULL,
                "reorderLevel" integer NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "description" text,
                "sideEffects" text,
                "contraindications" text,
                "storageInstructions" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_medicines" PRIMARY KEY ("id")
            )
        `);

        // Create prescriptions table
        await queryRunner.query(`
            CREATE TYPE "public"."prescriptions_status_enum" AS ENUM('pending', 'dispensed', 'partially_dispensed', 'cancelled')
        `);
        await queryRunner.query(`
            CREATE TABLE "prescriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "doctor_id" uuid NOT NULL,
                "patient_id" uuid NOT NULL,
                "prescriptionDate" date NOT NULL,
                "diagnosis" text,
                "notes" text,
                "status" "public"."prescriptions_status_enum" NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_prescriptions" PRIMARY KEY ("id")
            )
        `);

        // Create prescription_items table
        await queryRunner.query(`
            CREATE TYPE "public"."prescription_items_status_enum" AS ENUM('pending', 'dispensed', 'out_of_stock', 'cancelled')
        `);
        await queryRunner.query(`
            CREATE TABLE "prescription_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "prescription_id" uuid NOT NULL,
                "medicine_id" uuid NOT NULL,
                "dosage" character varying NOT NULL,
                "frequency" character varying NOT NULL,
                "duration" character varying NOT NULL,
                "instructions" text,
                "quantity" integer NOT NULL,
                "status" "public"."prescription_items_status_enum" NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_prescription_items" PRIMARY KEY ("id")
            )
        `);

        // Create medicine_transactions table
        await queryRunner.query(`
            CREATE TYPE "public"."medicine_transactions_transactiontype_enum" AS ENUM('purchase', 'sale', 'return', 'adjustment', 'expired', 'damaged')
        `);
        await queryRunner.query(`
            CREATE TABLE "medicine_transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "medicine_id" uuid NOT NULL,
                "transactionType" "public"."medicine_transactions_transactiontype_enum" NOT NULL DEFAULT 'purchase',
                "quantity" integer NOT NULL,
                "transactionDate" date NOT NULL,
                "reference" text,
                "notes" text,
                "performed_by" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_medicine_transactions" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "prescriptions" 
            ADD CONSTRAINT "FK_prescriptions_doctor" 
            FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "prescriptions" 
            ADD CONSTRAINT "FK_prescriptions_patient" 
            FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "prescription_items" 
            ADD CONSTRAINT "FK_prescription_items_prescription" 
            FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "prescription_items" 
            ADD CONSTRAINT "FK_prescription_items_medicine" 
            FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "medicine_transactions" 
            ADD CONSTRAINT "FK_medicine_transactions_medicine" 
            FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "medicine_transactions" 
            ADD CONSTRAINT "FK_medicine_transactions_user" 
            FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "medicine_transactions" DROP CONSTRAINT "FK_medicine_transactions_user"`);
        await queryRunner.query(`ALTER TABLE "medicine_transactions" DROP CONSTRAINT "FK_medicine_transactions_medicine"`);
        await queryRunner.query(`ALTER TABLE "prescription_items" DROP CONSTRAINT "FK_prescription_items_medicine"`);
        await queryRunner.query(`ALTER TABLE "prescription_items" DROP CONSTRAINT "FK_prescription_items_prescription"`);
        await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_prescriptions_patient"`);
        await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_prescriptions_doctor"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "medicine_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."medicine_transactions_transactiontype_enum"`);
        await queryRunner.query(`DROP TABLE "prescription_items"`);
        await queryRunner.query(`DROP TYPE "public"."prescription_items_status_enum"`);
        await queryRunner.query(`DROP TABLE "prescriptions"`);
        await queryRunner.query(`DROP TYPE "public"."prescriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "medicines"`);
    }
}
