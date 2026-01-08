import request from 'supertest';
import { Server } from '../../../src/server';

describe('E2E FR-001 + Referrals (real DB)', () => {
  const app = new Server(0).getApp();
  const doctorEmail = 'cardiology.practitioner@example.com';
  const doctorPassword = 'doctor123';
  const patientEmail = 'fr001.patient@example.com';

  let accessToken = '';
  let patientId = '';

  it('seeds FR-001 demo without referral (doctor: Cardiology, patient: General Medicine)', async () => {
    const res = await request(app).post('/api/dev/seed-fr001-demo?referral=0');
    expect(res.status).toBe(200);
    patientId = res.body?.patient?.id;
    expect(patientId).toBeTruthy();
  });

  it('doctor logs in', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: doctorEmail, password: doctorPassword });
    expect(login.status).toBe(200);
    accessToken = login.body?.accessToken;
    expect(accessToken).toBeTruthy();
  });

  it('reports list is denied (403) before referral', async () => {
    const res = await request(app)
      .get(`/api/patients/${patientId}/reports`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it('seed an appointment between doctor and patient, then create referral, then access is allowed', async () => {
    // Create an appointment so doctor is considered treated-patient and allowed to create referral
    const seedAppt = await request(app).post('/api/dev/seed-patient-for-doctor').send({ doctorEmail, patientEmail });
    expect(seedAppt.status).toBe(200);

    // Get doctor department id via /users/me
    const me = await request(app).get('/api/users/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    const departmentId = me.body?.department?.id;
    expect(departmentId).toBeTruthy();

    // Create referral as doctor for the patient
    const createRef = await request(app)
      .post(`/api/patients/${patientId}/referrals/doctor`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ departmentId });
    expect(createRef.status === 200 || createRef.status === 201).toBeTruthy();

    // Now access patient reports should be allowed
    const allowed = await request(app)
      .get(`/api/patients/${patientId}/reports`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body)).toBe(true);
  });
});
