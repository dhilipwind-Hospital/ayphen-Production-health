import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../models/Appointment';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsNotEmpty()
  endTime!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  // Optional preferences for auto-assign logic
  @IsOptional()
  preferences?: {
    urgency?: 'routine' | 'urgent' | 'emergency';
    doctorPreference?: { seniority?: 'chief' | 'senior' | 'consultant' | 'practitioner' | 'any' };
  };
}

export class UpdateAppointmentDto {
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;
}
