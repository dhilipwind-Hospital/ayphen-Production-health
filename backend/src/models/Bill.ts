import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Appointment } from './Appointment';
import { Organization } from './Organization';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  INSURANCE = 'insurance',
  ONLINE = 'online'
}

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  @IsNotEmpty()
  organizationId!: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  billNumber!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsOptional()
  @IsNumber()
  paidAmount: number = 0;

  @Column({
    type: 'enum',
    enum: BillStatus,
    default: BillStatus.PENDING
  })
  @IsEnum(BillStatus)
  status: BillStatus = BillStatus.PENDING;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  itemDetails?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  @Column({ type: 'date' })
  @IsNotEmpty()
  billDate!: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  dueDate?: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  paidDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
