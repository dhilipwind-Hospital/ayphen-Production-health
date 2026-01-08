import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDate, IsOptional, IsString, IsEnum, IsInt } from 'class-validator';
import { Medicine } from './Medicine';
import { User } from '../User';
import { Organization } from '../Organization';

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  EXPIRED = 'expired',
  DAMAGED = 'damaged'
}

@Entity('medicine_transactions')
export class MedicineTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Medicine)
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @Column({ name: 'medicine_id', type: 'uuid' })
  medicineId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.PURCHASE
  })
  @IsEnum(TransactionType, { message: 'Invalid transaction type' })
  transactionType!: TransactionType;

  @Column('int')
  @IsInt({ message: 'Quantity must be an integer' })
  quantity!: number;

  @Column({ type: 'date' })
  @IsDate({ message: 'Transaction date must be a valid date' })
  transactionDate!: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Reference must be a string' })
  reference?: string; // e.g., prescription ID, purchase order ID

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by' })
  performedBy?: User;

  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedById?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
