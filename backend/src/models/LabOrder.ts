import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { LabOrderItem } from './LabOrderItem';
import { Organization } from './Organization';

@Entity('lab_orders')
export class LabOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ unique: true })
  orderNumber!: string; // Human-readable order number (e.g., LAB-2025-0001)

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @Column({ type: 'date' })
  orderDate!: Date;

  @Column({ type: 'text', nullable: true })
  clinicalNotes?: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({
    type: 'enum',
    enum: ['ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled'],
    default: 'ordered'
  })
  status!: string;

  @Column({ type: 'boolean', default: false })
  isUrgent!: boolean;

  @OneToMany(() => LabOrderItem, item => item.labOrder, { cascade: true })
  items!: LabOrderItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
