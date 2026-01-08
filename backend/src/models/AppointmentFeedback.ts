import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Appointment } from './Appointment';
import { User } from './User';
import { Organization } from './Organization';

@Entity('appointment_feedback')
@Index(['doctorId', 'organizationId'])
@Index(['appointmentId'])
export class AppointmentFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // Ratings (1-5 stars)
  @Column({ type: 'int', default: 0 })
  doctorRating!: number; // 1-5 stars for doctor

  @Column({ type: 'int', default: 0 })
  facilityRating!: number; // 1-5 stars for facility/cleanliness

  @Column({ type: 'int', default: 0 })
  staffRating!: number; // 1-5 stars for staff behavior

  @Column({ type: 'int', default: 0 })
  overallRating!: number; // 1-5 stars overall

  // Comments
  @Column({ type: 'text', nullable: true })
  doctorComment?: string; // What patient liked/disliked about doctor

  @Column({ type: 'text', nullable: true })
  facilityComment?: string; // Feedback on facility

  @Column({ type: 'text', nullable: true })
  overallComment?: string; // General feedback

  // Recommendation
  @Column({ type: 'boolean', default: false })
  wouldRecommend!: boolean; // Would recommend this doctor?

  // Follow-up needed?
  @Column({ type: 'boolean', default: false })
  followUpNeeded!: boolean;

  @Column({ type: 'text', nullable: true })
  followUpReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
