import dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { SystemRoleCustomization } from '../models/SystemRoleCustomization';
import { Notification } from '../models/Notification';
import { Service } from '../models/Service';
import { Department } from '../models/Department';
import { Appointment } from '../models/Appointment';
import { RefreshToken } from '../models/RefreshToken';
import { MedicalRecord } from '../models/MedicalRecord';
import { Bill } from '../models/Bill';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Referral } from '../models/Referral';
import { Report } from '../models/Report';
import { EmergencyRequest } from '../models/EmergencyRequest';
import { CallbackRequest } from '../models/CallbackRequest';
import { Plan } from '../models/Plan';
import { Policy } from '../models/Policy';
import { Claim } from '../models/Claim';
import { AppointmentHistory } from '../models/AppointmentHistory';
import { Medicine } from '../models/pharmacy/Medicine';
import { Prescription } from '../models/pharmacy/Prescription';
import { PrescriptionItem } from '../models/pharmacy/PrescriptionItem';
import { MedicineTransaction } from '../models/pharmacy/MedicineTransaction';
import { LabTest } from '../models/LabTest';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabSample } from '../models/LabSample';
import { LabResult } from '../models/LabResult';
import { ConsultationNote } from '../models/ConsultationNote';
import { Ward } from '../models/inpatient/Ward';
import { Room } from '../models/inpatient/Room';
import { Bed } from '../models/inpatient/Bed';
import { Admission } from '../models/inpatient/Admission';
import { NursingNote } from '../models/inpatient/NursingNote';
import { VitalSign } from '../models/inpatient/VitalSign';
import { MedicationAdministration } from '../models/inpatient/MedicationAdministration';
import { DoctorNote } from '../models/inpatient/DoctorNote';
import { DischargeSummary } from '../models/inpatient/DischargeSummary';
import { Visit } from '../models/Visit';
import { QueueItem } from '../models/QueueItem';
import { Triage } from '../models/Triage';
import { VisitCounter } from '../models/VisitCounter';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { AppointmentFeedback } from '../models/AppointmentFeedback';
import { PasswordResetToken } from '../models/PasswordResetToken';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hospital_db',
  entities: [Organization, User, Role, SystemRoleCustomization, Notification, Service, Department, Appointment, RefreshToken, MedicalRecord, Bill, AvailabilitySlot, Referral, Report, EmergencyRequest, CallbackRequest, Plan, Policy, Claim, AppointmentHistory, Medicine, Prescription, PrescriptionItem, MedicineTransaction, LabTest, LabOrder, LabOrderItem, LabSample, LabResult, ConsultationNote, Ward, Room, Bed, Admission, NursingNote, VitalSign, MedicationAdministration, DoctorNote, DischargeSummary, Visit, QueueItem, Triage, VisitCounter, DoctorAvailability, AppointmentFeedback, PasswordResetToken],
  // ⚠️ SSL is required for Supabase in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    connectionTimeoutMillis: 10000,
  },
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  // ⚠️ CAUTION: synchronize: true should be disabled after the first deployment to prevent data loss!
  synchronize: true, // Enabled for initial production deployment to create tables
  logging: process.env.NODE_ENV === 'development',
});

// Backward-compatible wrapper used by server.ts
export const createDatabaseConnection = async () => {
  try {
    // 🛡️ FORCE IPv4: Resolve hostname to IPv4 to avoid ENETUNREACH on Render (IPv6 issues)
    const host = process.env.DB_HOST;
    if (host && !host.includes('localhost') && require('net').isIP(host) === 0) {
      console.log(` 🔍 Resolving DNS for ${host}...`);
      const { promises: dns } = require('dns');
      const [ip] = await dns.resolve4(host);
      console.log(` ✅ Resolved to IPv4: ${ip}`);
      AppDataSource.setOptions({ host: ip });
    }
  } catch (error) {
    console.warn(' ⚠️ IPv4 resolution failed, falling back to original host:', error);
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
