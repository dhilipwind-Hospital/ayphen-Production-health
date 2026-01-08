import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export enum RecordType {
  CONSULTATION = 'consultation',
  LAB_REPORT = 'lab_report',
  PRESCRIPTION = 'prescription',
  DISCHARGE_SUMMARY = 'discharge_summary',
  IMAGING = 'imaging'
}

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor?: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: RecordType,
    default: RecordType.CONSULTATION
  })
  type: RecordType = RecordType.CONSULTATION;

  @Column()
  @IsNotEmpty()
  @IsString()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  treatment?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  medications?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @Column({ type: 'date' })
  @IsDateString()
  recordDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
