import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { IsString, Length, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { User } from './User';
import { Organization } from './Organization';
import { Permission } from '../types/roles';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Multi-tenant: Organization relationship
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, organization => organization.roles)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ unique: false }) // Not globally unique, but unique per organization
  @IsString()
  @Length(2, 50)
  name: string = '';

  @Column()
  @IsString()
  @Length(2, 100)
  displayName: string = '';

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({
    type: 'enum',
    enum: Object.values(Permission),
    array: true,
    default: []
  })
  @IsArray()
  permissions: Permission[] = [];

  @Column({ default: false })
  @IsBoolean()
  isSystemRole: boolean = false;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean = true;

  @Column({ default: '#1890ff' })
  @IsString()
  color: string = '#1890ff';

  @Column({ type: 'int', default: 0 })
  userCount: number = 0;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  // Relationships
  @OneToMany(() => User, user => user.customRole)
  users?: User[];
}
