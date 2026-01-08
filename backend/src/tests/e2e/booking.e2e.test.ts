import request from 'supertest';
import { Server } from '../../../src/server';

describe('E2E Public Booking (real DB)', () => {
  const app = new Server(0).getApp();

  it('creates a pending appointment from public booking (departmentName flow)', async () => {
    const res = await request(app).post('/api/public/appointment-requests').send({
      name: 'E2E Patient',
      phone: '9000000000',
      departmentName: 'Cardiology',
      preferredTime: new Date().toISOString(),
      notes: 'Chest pain'
    });
    expect(res.status).toBe(201);
    expect(res.body?.status).toBe('received');
    expect(res.body?.appointmentId).toBeTruthy();
  });

  it('returns 400 on missing required fields', async () => {
    const res = await request(app).post('/api/public/appointment-requests').send({ name: '', phone: '' });
    expect(res.status).toBe(400);
  });
});
