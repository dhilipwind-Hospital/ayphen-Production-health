import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Visit } from './Visit';
import { Organization } from './Organization';

@Entity('triage')
export class Triage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ name: 'visit_id', type: 'uuid', unique: true })
  visitId!: string;

  @OneToOne(() => Visit)
  @JoinColumn({ name: 'visit_id' })
  visit!: Visit;

  @Column({ type: 'jsonb', nullable: true })
  vitals?: {
    temperature?: number;
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    spo2?: number;
    weight?: number;
    height?: number;
  };

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  currentMeds?: string;

  @Column({ type: 'int', nullable: true })
  painScale?: number;

  @Column({ type: 'varchar', length: 16, nullable: true })
  priority?: 'emergency' | 'urgent' | 'standard';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
