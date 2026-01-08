import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Service } from './Service';
import { Organization } from './Organization';
import { IsNotEmpty, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NOSHOW = 'no_show',
  IN_PROGRESS = 'in_progress'
}

export enum AppointmentMode {
  IN_PERSON = 'in-person',
  TELEMEDICINE = 'telemedicine',
  HOME_VISIT = 'home-visit'
}

export enum AppointmentType {
  STANDARD = 'standard',
  EMERGENCY = 'emergency'
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Multi-tenant: Organization relationship
  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @ManyToOne(() => User, user => user.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor?: User;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  @Column({ type: 'timestamp' })
  @IsDateString()
  @IsNotEmpty()
  startTime!: Date;

  @Column({ type: 'timestamp' })
  @IsDateString()
  @IsNotEmpty()
  endTime!: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus = AppointmentStatus.PENDING;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;

  @Column({ type: 'text', nullable: true })
  consultationNotes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellationReason?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledBy?: User | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  rescheduledFrom?: string | null;

  @Column({ type: 'uuid', nullable: true })
  rescheduledTo?: string | null;

  // NEW FIELDS FOR APPOINTMENT MANAGEMENT
  @Column({
    type: 'varchar',
    length: 20,
    default: AppointmentMode.IN_PERSON
  })
  mode!: AppointmentMode; // 'in-person' | 'telemedicine' | 'home-visit'

  @Column({
    type: 'varchar',
    length: 20,
    default: AppointmentType.STANDARD
  })
  appointmentType!: AppointmentType; // 'standard' | 'emergency'

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  telemedicineLink?: string; // Zoom/Google Meet link for virtual appointments

  @Column({ type: 'timestamp', nullable: true })
  cancellationDate?: Date; // When was it cancelled

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancellationCharge?: number; // Cancellation fee applied

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Add any additional methods or validations here
  validateTiming(): boolean {
    return this.endTime > this.startTime;
  }
}
