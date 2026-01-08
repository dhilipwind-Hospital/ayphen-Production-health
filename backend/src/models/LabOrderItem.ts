import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { LabOrder } from './LabOrder';
import { LabTest } from './LabTest';
import { LabSample } from './LabSample';
import { LabResult } from './LabResult';
import { Organization } from './Organization';

@Entity('lab_order_items')
export class LabOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => LabOrder, order => order.items)
  @JoinColumn({ name: 'lab_order_id' })
  labOrder!: LabOrder;

  @Column({ name: 'lab_order_id', type: 'uuid' })
  labOrderId!: string;

  @ManyToOne(() => LabTest)
  @JoinColumn({ name: 'lab_test_id' })
  labTest!: LabTest;

  @Column({ name: 'lab_test_id', type: 'uuid' })
  labTestId!: string;

  @Column({
    type: 'enum',
    enum: ['ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled'],
    default: 'ordered'
  })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToOne(() => LabSample, { nullable: true })
  @JoinColumn({ name: 'sample_id' })
  sample?: LabSample;

  @Column({ name: 'sample_id', type: 'uuid', nullable: true })
  sampleId?: string;

  @OneToOne(() => LabResult, { nullable: true })
  @JoinColumn({ name: 'result_id' })
  result?: LabResult;

  @Column({ name: 'result_id', type: 'uuid', nullable: true })
  resultId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
