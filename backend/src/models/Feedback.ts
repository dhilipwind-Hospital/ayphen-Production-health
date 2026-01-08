import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum FeedbackType {
  GENERAL = 'general',
  APPOINTMENT = 'appointment',
  DOCTOR = 'doctor',
  FACILITY = 'facility',
  STAFF = 'staff',
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint'
}

export enum FeedbackStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

@Entity({ name: 'feedback' })
export class Feedback {
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
    enum: FeedbackType
  })
  type!: FeedbackType;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'integer', nullable: true })
  rating?: number; // 1-5 stars

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING
  })
  status!: FeedbackStatus;

  @Column({ type: 'text', nullable: true })
  response?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responded_by' })
  respondedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
