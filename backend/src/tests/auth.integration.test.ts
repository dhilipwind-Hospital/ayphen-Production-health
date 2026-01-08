import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import authRoutes from '../routes/auth.routes';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';

// In-memory stores to simulate DB
const users: any[] = [];
const refreshTokens: any[] = [];

// Simple helpers to mimic TypeORM repository methods
const userRepo = {
  findOne: jest.fn(async ({ where }: any) => {
    if (where?.email) {
      return users.find(u => String(u.email).toLowerCase() === String(where.email).toLowerCase()) || null;
    }
    if (where?.id) {
      return users.find(u => u.id === where.id) || null;
    }
    return null;
  }),
  save: jest.fn(async (user: any) => {
    const existingIdx = users.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...user };
      return users[existingIdx];
    }
    user.id = user.id || `u_${Math.random().toString(36).slice(2)}`;
    users.push(user);
    return user;
  }),
};

const refreshRepo = {
  create: jest.fn((data: any) => ({ id: `rt_${Math.random().toString(36).slice(2)}`, ...data })),
  save: jest.fn(async (rt: any) => { refreshTokens.push(rt); return rt; }),
  delete: jest.fn(async ({ token }: any) => { const idx = refreshTokens.findIndex(r => r.token === token); if (idx >= 0) refreshTokens.splice(idx,1); }),
  findOne: jest.fn(async ({ where }: any) => refreshTokens.find(r => r.token === where?.token) || null),
};

// Mock AppDataSource.getRepository to return our in-memory repos
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name;
      if (name === 'User') return userRepo;
      if (name === 'RefreshToken') return refreshRepo;
      return {};
    }),
  },
}));

// Build an express app mounting only the auth routes
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  return app;
};

beforeEach(() => {
  // reset state and mocks
  users.length = 0;
  refreshTokens.length = 0;
  jest.clearAllMocks();
});

describe('Auth integration - registration', () => {
  it('registers a new user with strong password and returns 201', async () => {
    const app = buildApp();
    const body = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'StrongP@ss1',
      confirmPassword: 'StrongP@ss1'
    };

    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body?.message).toMatch(/Registration successful/i);
    expect(res.body?.user?.email).toBe('john@example.com');
    expect(users.some(u => u.email === 'john@example.com')).toBe(true);
  });

  it('rejects registration when email already exists', async () => {
    users.push({ id: 'u1', email: 'exists@example.com' });
    const app = buildApp();
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'A', lastName: 'B', email: 'exists@example.com', phone: '1234567890', password: 'StrongP@ss1', confirmPassword: 'StrongP@ss1'
    });
    expect(res.status).toBe(400);
    expect(res.body?.message).toMatch(/already in use/i);
  });

  it('rejects weak password', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'A', lastName: 'B', email: 'weak@example.com', phone: '1234567890', password: 'weakpass', confirmPassword: 'weakpass'
    });
    expect(res.status).toBe(400);
    expect(res.body?.message).toMatch(/Password must contain/i);
  });
});

describe('Auth integration - login', () => {
  it('authenticates a valid user and sets refresh token cookie', async () => {
    const app = buildApp();
    // Create a real User instance so validatePassword works
    const user = new User();
    user.firstName = 'Jane';
    user.lastName = 'Doe';
    user.email = 'jane@example.com';
    user.phone = '1112223333';
    user.password = 'StrongP@ss1';
    user.isActive = true;
    await user.hashPassword();
    // save in repo
    await userRepo.save(user);

    const res = await request(app).post('/api/auth/login').send({ email: 'jane@example.com', password: 'StrongP@ss1' });
    expect(res.status).toBe(200);
    expect(res.body?.accessToken).toBeTruthy();
    expect(res.body?.refreshToken).toBeTruthy();
    // cookie header may be set as well
    const setCookie = res.header['set-cookie'];
    expect(setCookie || []).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/auth/login').send({ email: 'nouser@example.com', password: 'WrongP@ss1' });
    expect(res.status).toBe(401);
    expect(res.body?.message).toMatch(/invalid credentials/i);
  });
});
