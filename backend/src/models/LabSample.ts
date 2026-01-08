import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('lab_samples')
export class LabSample {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ unique: true })
  sampleId!: string; // Unique sample identifier (barcode)

  @Column({ type: 'text' })
  sampleType!: string; // e.g., blood, urine, stool, tissue

  @Column({ type: 'timestamp' })
  collectionTime!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'collected_by' })
  collectedBy?: User;

  @Column({ name: 'collected_by', type: 'uuid', nullable: true })
  collectedById?: string;

  @Column({
    type: 'enum',
    enum: ['collected', 'received', 'processing', 'analyzed', 'rejected', 'discarded'],
    default: 'collected'
  })
  status!: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  storageLocation?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
