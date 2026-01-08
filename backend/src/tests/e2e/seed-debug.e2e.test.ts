import request from 'supertest';
import { Server } from '../../../src/server';

describe('DEBUG seed doctor endpoint', () => {
  const app = new Server(0).getApp();
  it('prints seed response', async () => {
    const email = `debug_doc_${Date.now()}@example.com`;
    const res = await request(app).post('/api/dev/seed-doctor').send({ email, password: 'doctor123', firstName: 'Debug', lastName: 'Doc' });
    // eslint-disable-next-line no-console
    console.log('SEED STATUS:', res.status);
    // eslint-disable-next-line no-console
    console.log('SEED BODY:', res.body);
    expect([200,500]).toContain(res.status);
  });
});
