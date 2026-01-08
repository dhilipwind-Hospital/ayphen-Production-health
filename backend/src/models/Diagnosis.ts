import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { ConsultationNote } from './ConsultationNote';
import { Organization } from './Organization';

export enum DiagnosisType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

export enum DiagnosisStatus {
  PROVISIONAL = 'provisional',
  CONFIRMED = 'confirmed',
  RULED_OUT = 'ruled_out'
}

export enum DiagnosisSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe'
}

@Entity({ name: 'diagnoses' })
export class Diagnosis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => ConsultationNote, { nullable: true })
  @JoinColumn({ name: 'consultation_id' })
  consultation?: ConsultationNote;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ type: 'varchar', length: 10, nullable: true })
  icd10Code?: string;

  @Column({ type: 'varchar', length: 255 })
  diagnosisName!: string;

  @Column({
    type: 'enum',
    enum: DiagnosisType,
    default: DiagnosisType.PRIMARY
  })
  diagnosisType!: DiagnosisType;

  @Column({
    type: 'enum',
    enum: DiagnosisStatus,
    default: DiagnosisStatus.PROVISIONAL
  })
  status!: DiagnosisStatus;

  @Column({
    type: 'enum',
    enum: DiagnosisSeverity,
    nullable: true
  })
  severity?: DiagnosisSeverity;

  @Column({ type: 'date', nullable: true })
  onsetDate?: Date;

  @Column({ type: 'date', nullable: true })
  resolvedDate?: Date;

  @Column({ type: 'boolean', default: false })
  isChronic!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'diagnosed_by' })
  diagnosedBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
