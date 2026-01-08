import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5001/api';
const doctorEmail = 'cardiology.practitioner@example.com';
const doctorPassword = 'doctor123';

async function seedFr001NoReferral(request: any) {
  const r = await request.post(`${API_BASE}/dev/seed-fr001-demo?referral=0&unique=1&ensureRestricted=1`);
  expect(r.ok()).toBeTruthy();
  const body = await r.json();
  return { patientId: body?.patient?.id as string, patientEmail: body?.patient?.email as string };
}

async function getAccessToken(page: any) {
  return await page.evaluate(() => window.localStorage.getItem('token'));
}

async function getDoctorDepartmentId(request: any, token: string) {
  const me = await request.get(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(me.ok()).toBeTruthy();
  const body = await me.json();
  return body?.department?.id as string;
}

test('FR-001 UI full flow: restricted → create referral via API → access granted', async ({ page, request }) => {
  // Seed without referral and get patient id
  const { patientId, patientEmail } = await seedFr001NoReferral(request);

  // Login as seeded doctor via UI
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(doctorEmail);
  await page.getByPlaceholder('Password').fill(doctorPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/availability');

  // Navigate to patient records and verify Access restricted
  await page.goto(`/doctor/patients/${patientId}/records`);
  await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible();

  // Use the in-app button to request referral access
  await page.getByRole('button', { name: 'Request Access' }).click();

  // After success, the reports table should be visible (access granted)
  await expect(page.getByText(/Referral created\. Access granted\./i)).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});
