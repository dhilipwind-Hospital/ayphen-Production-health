import request from 'supertest';
import { Server } from '../../../src/server';

describe('E2E Auth (real DB)', () => {
  const app = new Server(0).getApp();
  const email = `e2e_user_${Date.now()}@example.com`;
  const password = 'StrongP@ss1';

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'E2E',
      lastName: 'User',
      email,
      phone: '1000000000',
      password,
      confirmPassword: password,
    });
    expect(res.status).toBe(201);
    expect(res.body?.user?.email).toBe(email);
  });

  it('logins, refreshes token, and logs out', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const accessToken = login.body?.accessToken as string;
    const refreshToken = login.body?.refreshToken as string;
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // refresh
    const refresh = await request(app).post('/api/auth/refresh-token').send({ refreshToken });
    expect(refresh.status).toBe(200);
    expect(refresh.body?.accessToken).toBeTruthy();

    // logout
    const logout = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(logout.status).toBe(200);
  });
});
