import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('doctor_availability')
@Index(['doctorId', 'date', 'organizationId'])
export class DoctorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ type: 'date' })
  date!: Date; // e.g., 2025-12-01

  @Column({ type: 'time' })
  startTime!: string; // e.g., 09:00:00

  @Column({ type: 'time' })
  endTime!: string; // e.g., 17:00:00

  @Column({ type: 'int', default: 30 })
  slotDurationMinutes!: number; // Duration of each appointment slot

  @Column({ type: 'int', nullable: true })
  maxPatientsPerDay?: number; // Limit patients per day

  @Column({
    type: 'varchar',
    length: 20,
    default: 'available'
  })
  status!: 'available' | 'on-leave' | 'holiday' | 'blocked';

  @Column({ type: 'text', nullable: true })
  reason?: string; // Reason for leave/holiday

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean; // Repeats every week

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
