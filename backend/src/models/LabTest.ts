import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';

@Entity('lab_tests')
export class LabTest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: string; // Unique test code

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: ['hematology', 'biochemistry', 'microbiology', 'pathology', 'immunology', 'radiology', 'other'],
    default: 'other'
  })
  category!: string;

  @Column({ type: 'text', nullable: true })
  sampleType?: string; // e.g., blood, urine, stool, tissue

  @Column({ type: 'text', nullable: true })
  sampleInstructions?: string;

  @Column({ type: 'text', nullable: true })
  normalRange?: string;

  @Column({ type: 'text', nullable: true })
  units?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  cost!: number;

  @Column('int', { default: 60 })
  turnaroundTimeMinutes!: number; // Expected time to complete the test

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
