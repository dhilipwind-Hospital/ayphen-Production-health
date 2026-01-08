import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import reportRoutes from '../routes/report.routes';
import { AppDataSource } from '../config/database';

// Mock auth middleware to inject a doctor user and bypass role check
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (_req: any, _res: any, next: any) => { _req.user = { id: 'doc1', role: 'doctor', isActive: true }; next(); },
  authorize: (_roles: any) => (_req: any, _res: any, next: any) => next(),
}));

// In-memory stores to simulate DB tables
const users: any[] = [];
const referrals: any[] = [];
const appointments: any[] = [];
const reports: any[] = [];

// Simple helpers to mimic TypeORM repository methods used in code
const userRepo = {
  findOne: jest.fn(async ({ where }: any) => {
    if (where?.email) return users.find(u => u.email === where.email) || null;
    if (where?.id) return users.find(u => u.id === where.id) || null;
    return null;
  }),
  save: jest.fn(async (u: any) => {
    const idx = users.findIndex(x => x.id === u.id);
    if (idx >= 0) { users[idx] = { ...users[idx], ...u }; return users[idx]; }
    u.id = u.id || `u_${Math.random().toString(36).slice(2)}`;
    users.push(u);
    return u;
  }),
};

const referralRepo = {
  findOne: jest.fn(async ({ where }: any) => referrals.find(r => r.patientId === where?.patientId && r.departmentId === where?.departmentId) || null),
  find: jest.fn(async ({ where }: any) => referrals.filter(r => r.patientId === where?.patientId)),
  save: jest.fn(async (r: any) => { r.id = r.id || `ref_${Math.random().toString(36).slice(2)}`; referrals.push(r); return r; }),
};

const apptRepo = {
  createQueryBuilder: jest.fn(() => ({
    leftJoin: function() { return this; },
    where: function() { return this; },
    andWhere: function() { return this; },
    limit: function() { return this; },
    getOne: async () => appointments[0] || null,
  })),
};

const reportRepo = {
  find: jest.fn(async ({ where, order }: any) => {
    const list = reports.filter(r => r.patientId === where?.patientId);
    if (order?.createdAt === 'DESC') list.sort((a,b) => (b.createdAt?.getTime?.()||0) - (a.createdAt?.getTime?.()||0));
    return list;
  }),
  findOne: jest.fn(async ({ where }: any) => reports.find(r => r.id === where?.id) || null),
  save: jest.fn(async (r: any) => { r.id = r.id || `rep_${Math.random().toString(36).slice(2)}`; r.createdAt = r.createdAt || new Date(); r.updatedAt = new Date(); reports.push(r); return r; }),
};

// Mock AppDataSource.getRepository to return our in-memory repos for relevant entities
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name;
      if (name === 'User') return userRepo;
      if (name === 'Referral') return referralRepo;
      if (name === 'Appointment') return apptRepo;
      if (name === 'Report') return reportRepo;
      return {};
    }),
  },
}));

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', reportRoutes as any);
  return app;
};

beforeEach(() => {
  users.length = 0;
  referrals.length = 0;
  appointments.length = 0;
  reports.length = 0;
  jest.clearAllMocks();

  // Seed doctor and patients
  users.push({ id: 'doc1', role: 'doctor', isActive: true, departmentId: 'D1' });
  users.push({ id: 'patA', role: 'patient', isActive: true, primaryDepartmentId: 'D1' }); // same department
  users.push({ id: 'patB', role: 'patient', isActive: true, primaryDepartmentId: 'D2' }); // different department

  // Seed reports
  reports.push({ id: 'rA1', patientId: 'patA', type: 'note', title: 'A1', content: '...', createdAt: new Date(), updatedAt: new Date() });
  reports.push({ id: 'rB1', patientId: 'patB', type: 'note', title: 'B1', content: '...', createdAt: new Date(), updatedAt: new Date() });
});

describe('Report routes (FR-001) integration', () => {
  it('allows doctor to list reports for patient in same department', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/patients/patA/reports').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].patientId).toBe('patA');
  });

  it('denies doctor from listing reports for patient in other department without referral', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/patients/patB/reports').set('Authorization', 'Bearer test');
    expect(res.status).toBe(403);
  });

  it('allows doctor to list reports for patient in other department when referral exists', async () => {
    const app = buildApp();
    // grant referral to doc1.departmentId = D1 for patient patB
    await referralRepo.save({ patientId: 'patB', departmentId: 'D1' });
    const res = await request(app).get('/api/patients/patB/reports').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].patientId).toBe('patB');
  });

  it('allows doctor to get a report by id for allowed patient', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/reports/rA1').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(res.body?.id).toBe('rA1');
  });

  it('denies doctor to get a report by id for non-allowed patient without referral', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/reports/rB1').set('Authorization', 'Bearer test');
    expect(res.status).toBe(403);
  });

  it('allows doctor to create a report for allowed patient and denies for non-allowed without referral', async () => {
    const app = buildApp();
    // Allowed create for patA (same department)
    let res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer test')
      .send({ patientId: 'patA', type: 'note', title: 'New Note', content: 'C' });
    expect(res.status).toBe(201);
    expect(res.body?.patientId).toBe('patA');

    // Denied create for patB (no referral yet)
    res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer test')
      .send({ patientId: 'patB', type: 'note', title: 'New Note 2', content: 'D' });
    expect(res.status).toBe(403);

    // Grant referral and try again
    await referralRepo.save({ patientId: 'patB', departmentId: 'D1' });
    res = await request(app)
      .post('/api/reports')
      .set('Authorization', 'Bearer test')
      .send({ patientId: 'patB', type: 'note', title: 'New Note 3', content: 'E' });
    expect(res.status).toBe(201);
  });
});
