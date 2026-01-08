import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Prescription } from './Prescription';
import { Medicine } from './Medicine';
import { Organization } from '../Organization';

export enum PrescriptionItemStatus {
  PENDING = 'pending',
  DISPENSED = 'dispensed',
  OUT_OF_STOCK = 'out_of_stock',
  CANCELLED = 'cancelled'
}

@Entity('prescription_items')
export class PrescriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Prescription, prescription => prescription.items)
  @JoinColumn({ name: 'prescription_id' })
  prescription!: Prescription;

  @Column({ name: 'prescription_id', type: 'uuid' })
  prescriptionId!: string;

  @ManyToOne(() => Medicine)
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @Column({ name: 'medicine_id', type: 'uuid' })
  medicineId!: string;

  @Column()
  @IsNotEmpty({ message: 'Dosage is required' })
  dosage!: string; // e.g., "1 tablet"

  @Column()
  @IsNotEmpty({ message: 'Frequency is required' })
  frequency!: string; // e.g., "3 times a day"

  @Column()
  @IsNotEmpty({ message: 'Duration is required' })
  duration!: string; // e.g., "7 days"

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Instructions must be a string' })
  instructions?: string; // e.g., "Take after meals"

  @Column('int')
  @IsInt({ message: 'Quantity must be an integer' })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: PrescriptionItemStatus,
    default: PrescriptionItemStatus.PENDING
  })
  @IsEnum(PrescriptionItemStatus, { message: 'Invalid prescription item status' })
  status!: PrescriptionItemStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
