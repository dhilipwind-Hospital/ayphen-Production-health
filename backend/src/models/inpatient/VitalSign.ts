import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admission } from './Admission';
import { User } from '../User';
import { Organization } from '../Organization';

@Entity('vital_signs')
export class VitalSign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Admission, admission => admission.vitalSigns)
  @JoinColumn({ name: 'admission_id' })
  admission!: Admission;

  @Column({ name: 'admission_id', type: 'uuid' })
  admissionId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy!: User;

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedById!: string;

  @Column({ type: 'timestamp' })
  recordedAt!: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperature?: number; // in Celsius

  @Column('int', { nullable: true })
  heartRate?: number; // beats per minute

  @Column('int', { nullable: true })
  respiratoryRate?: number; // breaths per minute

  @Column('int', { nullable: true })
  systolicBP?: number; // mmHg

  @Column('int', { nullable: true })
  diastolicBP?: number; // mmHg

  @Column('int', { nullable: true })
  oxygenSaturation?: number; // SpO2 percentage

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weight?: number; // in kg

  @Column({ type: 'text', nullable: true })
  painScore?: string; // Pain scale (0-10)

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
