import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum CallbackStatus {
  PENDING = 'pending',
  CALLED = 'called',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_ANSWER = 'no_answer'
}

@Entity({ name: 'callback_requests' })
export class CallbackRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 40 })
  phone!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  department?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  preferredTime?: string | null;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @Column({
    type: 'enum',
    enum: CallbackStatus,
    default: CallbackStatus.PENDING
  })
  status!: CallbackStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo?: User | null;

  @Column({ type: 'text', nullable: true })
  callNotes?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  callOutcome?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  calledAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  followUpDate?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
