import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { User } from './User';
import { Role } from './Role';
import { SystemRoleCustomization } from './SystemRoleCustomization';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name!: string; // "Apollo Hospital", "Max Healthcare"

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  subdomain!: string; // "apollo", "max", "default"

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  customDomain?: string; // "apollo-hospital.com" (optional)

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: {
    branding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      favicon?: string;
    };
    features?: {
      pharmacy?: boolean;
      laboratory?: boolean;
      inpatient?: boolean;
      radiology?: boolean;
    };
    subscription?: {
      plan?: 'basic' | 'professional' | 'enterprise';
      status?: 'active' | 'trial' | 'suspended' | 'cancelled';
      startDate?: Date;
      endDate?: Date;
    };
    limits?: {
      maxUsers?: number;
      maxPatients?: number;
      maxStorage?: number; // in GB
    };
  };

  @Column({ default: true })
  @IsBoolean()
  isActive!: boolean;

  // Relationships
  @OneToMany(() => User, user => user.organization)
  users!: User[];

  @OneToMany(() => Role, role => role.organization)
  roles!: Role[];

  @OneToMany(() => SystemRoleCustomization, customization => customization.organization)
  systemRoleCustomizations!: SystemRoleCustomization[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
