import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Organization } from '../Organization';

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column()
  @IsNotEmpty({ message: 'Medicine name is required' })
  name!: string;

  @Column()
  @IsNotEmpty({ message: 'Generic name is required' })
  genericName!: string;

  @Column()
  @IsNotEmpty({ message: 'Brand name is required' })
  brandName!: string;

  @Column()
  @IsNotEmpty({ message: 'Manufacturer is required' })
  manufacturer!: string;

  @Column()
  @IsNotEmpty({ message: 'Category is required' })
  category!: string;

  @Column()
  @IsNotEmpty({ message: 'Dosage form is required' })
  dosageForm!: string; // tablet, capsule, syrup, injection, etc.

  @Column()
  @IsNotEmpty({ message: 'Strength is required' })
  strength!: string; // e.g., "500mg", "10mg/ml"

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber({}, { message: 'Unit price must be a number' })
  unitPrice!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber({}, { message: 'Selling price must be a number' })
  sellingPrice!: number;

  @Column()
  @IsNotEmpty({ message: 'Batch number is required' })
  batchNumber!: string;

  @Column({ type: 'date' })
  @IsDate({ message: 'Manufacture date must be a valid date' })
  manufactureDate!: Date;

  @Column({ type: 'date' })
  @IsDate({ message: 'Expiry date must be a valid date' })
  expiryDate!: Date;

  @Column('int')
  @IsNumber({}, { message: 'Current stock must be a number' })
  currentStock!: number;

  @Column('int')
  @IsNumber({}, { message: 'Reorder level must be a number' })
  reorderLevel!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Side effects must be a string' })
  sideEffects?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Contraindications must be a string' })
  contraindications?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Storage instructions must be a string' })
  storageInstructions?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
