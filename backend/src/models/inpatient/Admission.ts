import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';
import { Bed } from './Bed';
import { NursingNote } from './NursingNote';
import { DoctorNote } from './DoctorNote';
import { VitalSign } from './VitalSign';
import { MedicationAdministration } from './MedicationAdministration';
import { DischargeSummary } from './DischargeSummary';
import { Organization } from '../Organization';

export enum AdmissionStatus {
  ADMITTED = 'admitted',
  DISCHARGED = 'discharged',
  TRANSFERRED = 'transferred',
  ABSCONDED = 'absconded',
  DECEASED = 'deceased',
}

@Entity('admissions')
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ unique: true })
  admissionNumber!: string; // Human-readable admission number (e.g., ADM-2025-0001)

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admitting_doctor_id' })
  admittingDoctor!: User;

  @Column({ name: 'admitting_doctor_id', type: 'uuid' })
  admittingDoctorId!: string;

  @OneToOne(() => Bed, bed => bed.currentAdmission)
  @JoinColumn({ name: 'bed_id' })
  bed!: Bed;

  @Column({ name: 'bed_id', type: 'uuid' })
  bedId!: string;

  @Column({ type: 'timestamp' })
  admissionDateTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  dischargeDateTime?: Date;

  @Column({ type: 'text' })
  admissionReason!: string;

  @Column({ type: 'text', nullable: true })
  admissionDiagnosis?: string;

  @Column({
    type: 'enum',
    enum: AdmissionStatus,
    default: AdmissionStatus.ADMITTED,
  })
  status!: AdmissionStatus;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  specialInstructions?: string;

  @Column({ type: 'boolean', default: false })
  isEmergency!: boolean;

  @OneToMany(() => NursingNote, note => note.admission)
  nursingNotes!: NursingNote[];

  @OneToMany(() => DoctorNote, note => note.admission)
  doctorNotes!: DoctorNote[];

  @OneToMany(() => VitalSign, vital => vital.admission)
  vitalSigns!: VitalSign[];

  @OneToMany(() => MedicationAdministration, med => med.admission)
  medications!: MedicationAdministration[];

  @OneToOne(() => DischargeSummary, summary => summary.admission, { nullable: true })
  dischargeSummary?: DischargeSummary;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
