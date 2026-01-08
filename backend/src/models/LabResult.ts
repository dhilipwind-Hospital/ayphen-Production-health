import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('lab_results')
export class LabResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'text' })
  resultValue!: string;

  @Column({ type: 'text', nullable: true })
  units?: string;

  @Column({ type: 'text', nullable: true })
  referenceRange?: string;

  @Column({ type: 'text', nullable: true })
  interpretation?: string;

  @Column({
    type: 'enum',
    enum: ['normal', 'abnormal', 'critical'],
    default: 'normal'
  })
  flag!: string;

  @Column({ type: 'timestamp' })
  resultTime!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by' })
  performedBy!: User;

  @Column({ name: 'performed_by', type: 'uuid' })
  performedById!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy?: User;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedById?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTime?: Date;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'jsonb', nullable: true })
  additionalData?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
