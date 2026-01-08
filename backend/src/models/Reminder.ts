import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Appointment } from './Appointment';
import { Organization } from './Organization';

export enum ReminderType {
  APPOINTMENT = 'appointment',
  MEDICATION = 'medication',
  FOLLOWUP = 'followup',
  LAB_RESULT = 'lab_result',
  CUSTOM = 'custom'
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity({ name: 'reminders' })
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: ReminderType
  })
  type!: ReminderType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'timestamp' })
  scheduledFor!: Date;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING
  })
  status!: ReminderStatus;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @Column({ type: 'varchar', length: 255, nullable: true })
  medicationName?: string;

  @Column({ type: 'boolean', default: false })
  sendEmail!: boolean;

  @Column({ type: 'boolean', default: false })
  sendSms!: boolean;

  @Column({ type: 'boolean', default: true })
  sendNotification!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
