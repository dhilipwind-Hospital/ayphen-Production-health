import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Appointment } from './Appointment';
import { Organization } from './Organization';

export type AppointmentAction =
  | 'created'
  | 'rescheduled'
  | 'cancelled'
  | 'confirmed'
  | 'notes_updated'
  | 'service_assigned'
  | 'follow_up_created';

@Entity()
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @Column({ type: 'varchar', length: 64 })
  action!: AppointmentAction;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
