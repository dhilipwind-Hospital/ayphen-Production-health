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

@Entity('medication_administrations')
export class MedicationAdministration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Admission, admission => admission.medications)
  @JoinColumn({ name: 'admission_id' })
  admission!: Admission;

  @Column({ name: 'admission_id', type: 'uuid' })
  admissionId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'administered_by' })
  administeredBy!: User;

  @Column({ name: 'administered_by', type: 'uuid' })
  administeredById!: string;

  @Column({ type: 'timestamp' })
  administeredAt!: Date;

  @Column({ type: 'text' })
  medication!: string;

  @Column({ type: 'text' })
  dosage!: string;

  @Column({ type: 'text' })
  route!: string; // Oral, IV, IM, SC, etc.

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
