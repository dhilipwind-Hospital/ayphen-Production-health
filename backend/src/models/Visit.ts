import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export type VisitStatus = 'created' | 'triage' | 'with_doctor' | 'awaiting_billing' | 'closed';

@Entity('visits')
@Index(['organizationId', 'visitNumber'], { unique: true })
@Index(['organizationId', 'status'])
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'visit_number', type: 'varchar', length: 64 })
  visitNumber!: string;

  @Column({ type: 'varchar', length: 32, default: 'created' })
  status!: VisitStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
