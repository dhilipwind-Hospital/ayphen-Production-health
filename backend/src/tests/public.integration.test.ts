import request from 'supertest';
import { Server } from '../server';
import { AppDataSource } from '../config/database';

// In-memory tables
const services: any[] = [];
const departments: any[] = [];
const doctors: any[] = [];
const emergencyRequests: any[] = [];
const callbackRequests: any[] = [];

const serviceRepo = {
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: function() { return this; },
    where: function() { return this; },
    andWhere: function() { return this; },
    skip: function() { return this; },
    take: function() { return this; },
    getManyAndCount: async () => [services, services.length],
  })),
  findOne: jest.fn(async ({ where }: any) => services.find(s => s.id === where?.id) || null),
};

const deptRepo = {
  findOne: jest.fn(async ({ where }: any) => departments.find(d => d.id === where?.id) || null),
};

const emergencyRepo = {
  save: jest.fn(async (e: any) => { e.id = e.id || `er_${Math.random().toString(36).slice(2)}`; emergencyRequests.push(e); return e; }),
};

const callbackRepo = {
  save: jest.fn(async (c: any) => { c.id = c.id || `cb_${Math.random().toString(36).slice(2)}`; callbackRequests.push(c); return c; }),
};

const userRepo = {
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: function() { return this; },
    where: function() { return this; },
    select: function() { return this; },
    orderBy: function() { return this; },
    getMany: async () => doctors,
  })),
};

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name;
      if (name === 'Service') return serviceRepo;
      if (name === 'Department') return deptRepo;
      if (name === 'User') return userRepo;
      if (name === 'EmergencyRequest') return emergencyRepo;
      if (name === 'CallbackRequest') return callbackRepo;
      return {};
    }),
  },
}));

beforeEach(() => {
  services.length = 0;
  departments.length = 0;
  doctors.length = 0;
  emergencyRequests.length = 0;
  callbackRequests.length = 0;
  jest.clearAllMocks();

  // seed sample
  departments.push({ id: 'dep1', name: 'Cardiology' });
  services.push({ id: 'svc1', name: 'ECG', description: 'Test', status: 'active', department: departments[0] });
  doctors.push({ id: 'doc1', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', department: { id: 'dep1', name: 'Cardiology' } });
});

describe('Public integration tests', () => {
  it('lists services (public)', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body?.data.length).toBe(1);
    expect(res.body?.data[0]?.name).toBe('ECG');
  });

  it('creates emergency request (public)', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).post('/api/public/emergency').send({ name: 'John', phone: '123', message: 'help' });
    expect(res.status).toBe(201);
    expect(res.body?.status).toBe('received');
    expect(emergencyRequests.length).toBe(1);
  });

  it('creates callback request (public)', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).post('/api/public/request-callback').send({ name: 'John', phone: '123', department: 'Cardiology' });
    expect(res.status).toBe(201);
    expect(res.body?.status).toBe('received');
    expect(callbackRequests.length).toBe(1);
  });

  it('lists public doctors', async () => {
    const app = new Server(0).getApp();
    const res = await request(app).get('/api/public/doctors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body?.data[0]?.firstName).toBe('Jane');
  });
});
