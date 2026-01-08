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

export enum DoctorNoteType {
  PROGRESS = 'progress',
  ADMISSION = 'admission',
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
  DISCHARGE = 'discharge',
}

@Entity('doctor_notes')
export class DoctorNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Admission, admission => admission.doctorNotes)
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
  noteDateTime!: Date;

  // SOAP Note Format
  @Column({ type: 'text' })
  subjective!: string; // Patient's complaints

  @Column({ type: 'text' })
  objective!: string; // Examination findings

  @Column({ type: 'text' })
  assessment!: string; // Diagnosis/Assessment

  @Column({ type: 'text' })
  plan!: string; // Treatment plan

  @Column({
    type: 'enum',
    enum: DoctorNoteType,
    default: DoctorNoteType.PROGRESS,
  })
  noteType!: DoctorNoteType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
