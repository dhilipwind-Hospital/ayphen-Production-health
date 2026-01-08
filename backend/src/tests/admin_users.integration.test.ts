import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import userRoutes from '../routes/user.routes';
import { AppDataSource } from '../config/database';

// Mock auth to inject admin
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: (_req: any, _res: any, next: any) => { _req.user = { id: 'admin1', role: 'admin', isActive: true }; next(); },
  authorize: (_roles: any) => (_req: any, _res: any, next: any) => next(),
}));

const users: any[] = [];

const userRepo = {
  createQueryBuilder: jest.fn(() => ({
    orderBy: function() { return this; },
    skip: function() { return this; },
    take: function() { return this; },
    andWhere: function() { return this; },
    andHaving: function() { return this; },
    getManyAndCount: async () => [users, users.length],
  })),
};

jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name;
      if (name === 'User') return userRepo;
      return {};
    }),
  },
}));

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/users', userRoutes);
  return app;
};

beforeEach(() => {
  users.length = 0;
  jest.clearAllMocks();
  users.push({ id: 'u1', firstName: 'Alice', lastName: 'A', email: 'a@example.com', phone: '1', isActive: true });
  users.push({ id: 'u2', firstName: 'Bob', lastName: 'B', email: 'b@example.com', phone: '2', isActive: true });
});

describe('Admin users integration', () => {
  it('lists users as admin', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
    expect(res.body?.pagination?.total).toBe(2);
  });
});
