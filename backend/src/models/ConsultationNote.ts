import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Appointment } from './Appointment';
import { Organization } from './Organization';

@Entity({ name: 'consultation_notes' })
export class ConsultationNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ type: 'text', nullable: true })
  chiefComplaint?: string;

  @Column({ type: 'text', nullable: true })
  historyPresentIllness?: string;

  @Column({ type: 'text', nullable: true })
  pastMedicalHistory?: string;

  @Column({ type: 'text', nullable: true })
  currentMedications?: string;

  @Column({ type: 'text', nullable: true })
  physicalExamination?: string;

  @Column({ type: 'text', nullable: true })
  assessment?: string;

  @Column({ type: 'text', nullable: true })
  plan?: string;

  @Column({ type: 'text', nullable: true })
  doctorNotes?: string;

  @Column({ type: 'timestamp', nullable: true })
  followUpDate?: Date;

  @Column({ type: 'text', nullable: true })
  followUpInstructions?: string;

  @Column({ type: 'boolean', default: false })
  isSigned!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  signedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'signed_by' })
  signedBy?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
