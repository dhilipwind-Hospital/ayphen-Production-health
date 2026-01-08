import request from 'supertest';
import { Server } from '../server';
import { AppDataSource } from '../config/database';

// In-memory tables
const users: any[] = [];
const departments: any[] = [];
const services: any[] = [];
const appointments: any[] = [];

const userRepo = {
  findOne: jest.fn(async ({ where }: any) => {
    if (where?.email) return users.find(u => u.email === where.email) || null;
    if (where?.phone) return users.find(u => u.phone === where.phone) || null;
    if (where?.id) return users.find(u => u.id === where.id) || null;
    return null;
  }),
  save: jest.fn(async (u: any) => { if (!u.id) u.id = `u_${Math.random().toString(36).slice(2)}`; users.push(u); return u; }),
};

const deptRepo = {
  createQueryBuilder: jest.fn(() => ({
    where: function(_cond: string, params: any) {
      const n = String(params.n || '').toLowerCase();
      (this as any)._match = n;
      return this;
    },
    getOne: async function() {
      return departments.find(d => String(d.name).toLowerCase() === (this as any)._match) || null;
    }
  })),
  findOne: jest.fn(async ({ where }: any) => departments.find(d => d.id === where?.id) || null),
  save: jest.fn(async (d: any) => { if (!d.id) d.id = `dep_${Math.random().toString(36).slice(2)}`; departments.push(d); return d; }),
};

const serviceRepo = {
  findOne: jest.fn(async ({ where, relations }: any) => {
    if (where?.id) return services.find(s => s.id === where.id) || null;
    if (where?.department?.id) return services.find(s => s.departmentId === where.department.id) || null;
    return null;
  }),
  save: jest.fn(async (s: any) => { if (!s.id) s.id = `svc_${Math.random().toString(36).slice(2)}`; services.push({ ...s, departmentId: s.departmentId || s.department?.id }); return s; }),
};

const apptRepo = {
  save: jest.fn(async (a: any) => { if (!a.id) a.id = `appt_${Math.random().toString(36).slice(2)}`; appointments.push(a); return a; }),
  findOne: jest.fn(async ({ where, relations }: any) => appointments.find(a => a.id === where?.id) || null),
};

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name;
      if (name === 'User') return userRepo;
      if (name === 'Department') return deptRepo;
      if (name === 'Service') return serviceRepo;
      if (name === 'Appointment') return apptRepo;
      return {};
    }),
  },
}));

beforeEach(() => {
  users.length = 0; departments.length = 0; services.length = 0; appointments.length = 0;
  jest.clearAllMocks();
});

describe('Public appointment requests', () => {
  it('creates a pending appointment from public booking (happy path)', async () => {
    const app = new Server(0).getApp();
    // Pre-seed a department to be found by name
    departments.push({ id: 'dep1', name: 'Cardiology', description: 'Cardio' });

    const res = await request(app).post('/api/public/appointment-requests').send({
      name: 'John Patient',
      phone: '9999999999',
      departmentName: 'Cardiology',
      preferredTime: new Date().toISOString(),
      notes: 'Chest pain'
    });

    expect(res.status).toBe(201);
    expect(res.body?.status).toBe('received');
    expect(appointments.length).toBe(1);
    expect(users.length).toBe(1); // patient created
    expect(services.length).toBeGreaterThanOrEqual(1); // default service created if missing
  });

  it('returns 400 when missing required fields', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).post('/api/public/appointment-requests').send({ phone: '' });
    expect(res.status).toBe(400);
  });
});
