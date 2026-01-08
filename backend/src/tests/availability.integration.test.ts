import request from 'supertest';
import { Server } from '../server';
import { AppDataSource } from '../config/database';

// Mock auth to switch roles per test
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => { req.user = req.user || { id: 'doc-uuid-1111-4aaa-8bbb-cccccccccccc', role: 'doctor', isActive: true }; next(); },
  authorize: (_roles: any) => (_req: any, _res: any, next: any) => next(),
}));

// In-memory tables
const availabilitySlots: any[] = [];
const users: any[] = [];

const availRepo = {
  find: jest.fn(async ({ where, order }: any) => {
    const doctorId = where?.doctor?.id;
    const active = where?.isActive;
    let list = availabilitySlots.filter(s => (!doctorId || s.doctor?.id === doctorId) && (typeof active === 'undefined' || s.isActive === active));
    if (order?.startTime === 'ASC') list = list.sort((a,b) => String(a.startTime).localeCompare(String(b.startTime)));
    return list;
  }),
  findOne: jest.fn(async ({ where }: any) => availabilitySlots.find(s => s.id === where?.id) || null),
  create: jest.fn((slot: any) => ({ id: slot.id || `slot_${Math.random().toString(36).slice(2)}`, isActive: true, ...slot })),
  save: jest.fn(async (slot: any) => { const idx = availabilitySlots.findIndex(s => s.id === slot.id); if (idx >= 0) availabilitySlots[idx] = { ...availabilitySlots[idx], ...slot }; else availabilitySlots.push(slot); return slot; }),
  remove: jest.fn(async (slot: any) => { const idx = availabilitySlots.findIndex(s => s.id === slot.id); if (idx >= 0) availabilitySlots.splice(idx,1); }),
};

const userRepo = {
  findOne: jest.fn(async ({ where }: any) => users.find(u => u.id === where?.id && (!where?.role || u.role === where.role)) || null),
};

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name;
      if (name === 'AvailabilitySlot') return availRepo;
      if (name === 'User') return userRepo;
      return {};
    }),
  },
}));

beforeEach(() => {
  availabilitySlots.length = 0;
  users.length = 0;
  jest.clearAllMocks();

  // seed a doctor
  users.push({ id: 'doc-uuid-1111-4aaa-8bbb-cccccccccccc', role: 'doctor' });
  // seed a public slot for GET
  availabilitySlots.push({ id: 's1', doctor: { id: 'doc-uuid-1111-4aaa-8bbb-cccccccccccc' }, isActive: true, dayOfWeek: 'monday', startTime: '09:00', endTime: '12:00' });
});

describe('Availability integration', () => {
  it('public: lists doctor slots by UUID', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).get('/api/availability/doctors/doc-uuid-1111-4aaa-8bbb-cccccccccccc');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body?.data.length).toBeGreaterThan(0);
  });

  it('doctor: can create own availability slot', async () => {
    const app = new Server(0).getApp();
    const body = { doctorId: 'doc-uuid-1111-4aaa-8bbb-cccccccccccc', dayOfWeek: 'tuesday', startTime: '10:00', endTime: '12:00' };
    // authenticate mock sets req.user with same id by default
    const res = await request(app).post('/api/availability').set('Authorization', 'Bearer t').send(body);
    expect(res.status).toBe(201);
    expect(res.body?.data?.doctor?.id).toBe(body.doctorId);
  });

  it('doctor: cannot create slot for another doctor (403)', async () => {
    const app = new Server(0).getApp();
    // another doctor id
    users.push({ id: 'doc-uuid-2222-4aaa-8bbb-cccccccccccc', role: 'doctor' });
    const body = { doctorId: 'doc-uuid-2222-4aaa-8bbb-cccccccccccc', dayOfWeek: 'wednesday', startTime: '13:00', endTime: '15:00' };
    const res = await request(app).post('/api/availability').set('Authorization', 'Bearer t').send(body);
    expect(res.status).toBe(403);
  });

  it('doctor: can view my-schedule', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).get('/api/availability/my-schedule').set('Authorization', 'Bearer t');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });
});
