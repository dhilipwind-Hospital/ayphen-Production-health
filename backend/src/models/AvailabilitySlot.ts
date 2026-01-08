import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { Organization } from './Organization';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

@Entity('availability_slots')
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({
    type: 'enum',
    enum: DayOfWeek
  })
  @IsNotEmpty()
  dayOfWeek!: DayOfWeek;

  @Column({ type: 'time' })
  @IsNotEmpty()
  @IsString()
  startTime!: string;

  @Column({ type: 'time' })
  @IsNotEmpty()
  @IsString()
  endTime!: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  specificDate?: Date;

  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
