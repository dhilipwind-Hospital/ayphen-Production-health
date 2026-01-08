import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../../models/User';
import { Service } from '../../models/Service';
import { Department } from '../../models/Department';
import { Appointment } from '../../models/Appointment';
import { RefreshToken } from '../../models/RefreshToken';
import { MedicalRecord } from '../../models/MedicalRecord';
import { Bill } from '../../models/Bill';
import { AvailabilitySlot } from '../../models/AvailabilitySlot';
import { Referral } from '../../models/Referral';
import { Report } from '../../models/Report';
import { EmergencyRequest } from '../../models/EmergencyRequest';
import { CallbackRequest } from '../../models/CallbackRequest';
import { Plan } from '../../models/Plan';
import { Policy } from '../../models/Policy';
import { Claim } from '../../models/Claim';

export const buildTestDataSource = () => {
  const host = process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '5432', 10);
  const username = process.env.TEST_DB_USER || process.env.DB_USER || 'postgres';
  const password = process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres';
  const database = process.env.TEST_DB_NAME || process.env.DB_NAME || 'hospital_db_test';

  return new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [User, Service, Department, Appointment, RefreshToken, MedicalRecord, Bill, AvailabilitySlot, Referral, Report, EmergencyRequest, CallbackRequest, Plan, Policy, Claim],
    synchronize: true,
    logging: false,
  });
};
