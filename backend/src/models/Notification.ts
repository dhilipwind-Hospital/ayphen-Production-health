import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum NotificationType {
  APPOINTMENT_NEW = 'appointment_new',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  EMERGENCY_NEW = 'emergency_new',
  EMERGENCY_ASSIGNED = 'emergency_assigned',
  CALLBACK_NEW = 'callback_new',
  CALLBACK_ASSIGNED = 'callback_assigned',
  PRESCRIPTION_READY = 'prescription_ready',
  PRESCRIPTION_NEW = 'prescription_new',
  TEST_RESULT_READY = 'test_result_ready',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  GENERAL = 'general'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity({ name: 'notifications' })
export class Notification {
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
    enum: NotificationType
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM
  })
  priority!: NotificationPriority;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actionUrl?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionLabel?: string | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  emailSent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
