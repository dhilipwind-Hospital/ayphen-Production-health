import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { Organization } from './Organization';
import { Permission, UserRole } from '../types/roles';

@Entity('system_role_customizations')
export class SystemRoleCustomization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Multi-tenant: Organization relationship
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, organization => organization.systemRoleCustomizations)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({
    type: 'enum',
    enum: Object.values(UserRole)
  })
  @IsString()
  systemRole: UserRole = UserRole.PATIENT;

  @Column({
    type: 'enum',
    enum: Object.values(Permission),
    array: true,
    default: []
  })
  @IsArray()
  customPermissions: Permission[] = [];

  @Column({ default: '#1890ff' })
  @IsString()
  @IsOptional()
  customColor?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}
