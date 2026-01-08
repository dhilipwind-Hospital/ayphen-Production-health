import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Organization } from './Organization';
import { Visit } from './Visit';
import { User } from './User';

export type QueueStage = 'reception' | 'triage' | 'doctor' | 'pharmacy' | 'lab' | 'billing';
export type QueueStatus = 'waiting' | 'called' | 'served' | 'skipped';
export type QueuePriority = 'emergency' | 'urgent' | 'standard';

@Entity('queue_items')
@Index(['organizationId', 'stage', 'status'])
export class QueueItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'visit_id', type: 'uuid' })
  visitId!: string;

  @ManyToOne(() => Visit)
  @JoinColumn({ name: 'visit_id' })
  visit!: Visit;

  @Column({ type: 'varchar', length: 32 })
  stage!: QueueStage;

  @Column({ type: 'varchar', length: 16, default: 'standard' })
  priority!: QueuePriority;

  @Column({ name: 'token_number', type: 'varchar', length: 64 })
  tokenNumber!: string;

  @Column({ name: 'assigned_doctor_id', type: 'uuid', nullable: true })
  assignedDoctorId?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_doctor_id' })
  assignedDoctor?: User | null;

  @Column({ type: 'varchar', length: 16, default: 'waiting' })
  status!: QueueStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
