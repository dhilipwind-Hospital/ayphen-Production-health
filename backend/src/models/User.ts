import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { IsEmail, Length, IsDateString, IsOptional, IsString, IsDate, IsEnum } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Appointment } from './Appointment';
import { Department } from './Department';
import { RefreshToken } from './RefreshToken';
import { Organization } from './Organization';
import { Role } from './Role';
import { UserRole, Permission } from '../types/roles';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Multi-tenant: Organization relationship
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, organization => organization.users)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column()
  @Length(2, 50)
  firstName: string = '';

  @Column()
  @Length(2, 50)
  lastName: string = '';

  @Column({ unique: true })
  @IsEmail()
  email: string = '';

  @Column()
  @IsString()
  @Length(7, 20)
  phone: string = '';

  @Column()
  @Length(8)
  password: string = '';

  // Google OAuth fields
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  googleId?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @Column({
    type: 'enum',
    enum: Object.values(UserRole),
    default: UserRole.PATIENT
  })
  @IsEnum(UserRole, { message: 'Invalid role' })
  role: UserRole = UserRole.PATIENT;

  // Custom role relationship (optional, for custom roles)
  @ManyToOne(() => Role, role => role.users, { nullable: true, eager: false })
  @JoinColumn({ name: 'custom_role_id' })
  customRole?: Role;

  @Column({ name: 'custom_role_id', type: 'uuid', nullable: true, default: null })
  customRoleId?: string;

  @Column({
    type: 'enum',
    enum: Object.values(Permission),
    array: true,
    default: []
  })
  @IsOptional()
  permissions: Permission[] = [];

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ type: 'date', nullable: true })
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  gender?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  preferences?: Record<string, any>;

  // Department relationships
  // For doctors: which department they belong to
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string | null;

  // For patients: primary department assignment
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'primary_department_id' })
  primaryDepartment?: Department | null;

  @Column({ name: 'primary_department_id', type: 'uuid', nullable: true })
  primaryDepartmentId?: string | null;

  // Doctor-specific fields
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  qualification?: string;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  experience?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  consultationFee?: number;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @Column({ type: 'simple-array', nullable: true })
  @IsOptional()
  workingDays?: string[];

  @Column({ type: 'time', nullable: true })
  @IsOptional()
  availableFrom?: string;

  @Column({ type: 'time', nullable: true })
  @IsOptional()
  availableTo?: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  joinDate?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  specialization?: string;

  // Relationships
  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments!: Appointment[];

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens!: RefreshToken[];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Doctor-specific fields
  qualification?: string;
  experience?: number;
  consultationFee?: number;
  licenseNumber?: string;
  emergencyContact?: string;
  workingDays?: string[];
  availableFrom?: string;
  availableTo?: string;
  joinDate?: Date;
  specialization?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  profileImage?: string;
  preferences?: Record<string, any>;
}
