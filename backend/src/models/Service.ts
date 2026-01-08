import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from './Department';
import { Organization } from './Organization';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Multi-tenant: Organization relationship
  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @Column('text')
  @IsNotEmpty()
  @IsString()
  description!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  procedures?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  equipment?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  certifications?: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  @IsString()
  status: 'active' | 'inactive' | 'maintenance' = 'active';

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  averageDuration?: number; // in minutes

  @Column({ name: 'department_id' })
  departmentId!: string;

  @ManyToOne(() => Department, department => department.services)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Add any additional methods or relationships here
}
