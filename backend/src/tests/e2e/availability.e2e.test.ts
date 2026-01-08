import request from 'supertest';
import { Server } from '../../../src/server';

describe('E2E Availability (real DB)', () => {
  const app = new Server(0).getApp();
  const email = `doc_av_${Date.now()}@example.com`;
  const password = 'doctor123';
  let doctorId = '';
  let accessToken = '';
  let slotId = '';

  it('seeds a doctor and logs in', async () => {
    // seed a doctor
    const seed = await request(app).post('/api/dev/seed-doctor').send({ email, password, firstName: 'Doc', lastName: 'Avail' });
    expect(seed.status).toBe(200);

    // find the doctor id by public doctors list
    const doctors = await request(app).get('/api/public/doctors');
    expect(doctors.status).toBe(200);
    const found = (doctors.body?.data || []).find((d: any) => d.email === email);
    expect(found).toBeDefined();
    doctorId = found.id;

    // login
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    accessToken = login.body?.accessToken;
    expect(accessToken).toBeTruthy();
  });

  it('public GET: doctor availability (initially empty or seeded)', async () => {
    const res = await request(app).get(`/api/availability/doctors/${doctorId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('doctor creates own availability slot', async () => {
    const res = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ doctorId, dayOfWeek: 'monday', startTime: '10:00', endTime: '12:00' });
    expect(res.status).toBe(201);
    slotId = res.body?.data?.id;
    expect(slotId).toBeTruthy();
  });

  it('doctor updates own availability slot', async () => {
    const res = await request(app)
      .put(`/api/availability/${slotId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ notes: 'E2E updated' });
    expect(res.status).toBe(200);
    expect(res.body?.data?.notes).toBe('E2E updated');
  });

  it('doctor views my-schedule', async () => {
    const res = await request(app)
      .get('/api/availability/my-schedule')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.data)).toBe(true);
  });

  it('doctor deletes own availability slot', async () => {
    const res = await request(app)
      .delete(`/api/availability/${slotId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);
  });
});
