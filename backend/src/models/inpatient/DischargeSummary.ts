import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Admission } from './Admission';
import { User } from '../User';
import { Organization } from '../Organization';

@Entity('discharge_summaries')
export class DischargeSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @OneToOne(() => Admission, admission => admission.dischargeSummary)
  @JoinColumn({ name: 'admission_id' })
  admission!: Admission;

  @Column({ name: 'admission_id', type: 'uuid' })
  admissionId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @Column({ type: 'timestamp' })
  dischargeDateTime!: Date;

  @Column({ type: 'text' })
  admissionDiagnosis!: string;

  @Column({ type: 'text' })
  dischargeDiagnosis!: string;

  @Column({ type: 'text' })
  briefSummary!: string;

  @Column({ type: 'text' })
  treatmentGiven!: string;

  @Column({ type: 'text' })
  conditionAtDischarge!: string;

  @Column({ type: 'text' })
  followUpInstructions!: string;

  @Column({ type: 'text' })
  medicationsAtDischarge!: string;

  @Column({ type: 'text', nullable: true })
  dietaryInstructions?: string;

  @Column({ type: 'text', nullable: true })
  activityInstructions?: string;

  @Column({ type: 'text', nullable: true })
  specialInstructions?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
