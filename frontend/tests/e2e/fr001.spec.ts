import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5001/api';

// Doctor from seed-fr001-demo
const doctorEmail = 'cardiology.practitioner@example.com';
const doctorPassword = 'doctor123';

test('FR-001 UI: Access restricted before referral', async ({ page, request }) => {
  // Seed FR-001 demo without referral and capture patientId
  const seed = await request.post(`${API_BASE}/dev/seed-fr001-demo?referral=0&unique=1&ensureRestricted=1`);
  expect(seed.ok()).toBeTruthy();
  const body = await seed.json();
  const patientId = body?.patient?.id as string;
  expect(patientId).toBeTruthy();

  // Login as the seeded doctor
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(doctorEmail);
  await page.getByPlaceholder('Password').fill(doctorPassword);
  await page.getByRole('button', { name: 'Log in' }).click();

  // After login, wait for the availability page heading (more robust than URL wait)
  await page.waitForLoadState('networkidle');

  // Navigate to patient records (doctor-facing route)
  await page.goto(`/doctor/patients/${patientId}/records`);
  const restrictedHeading = page.getByRole('heading', { name: 'Access restricted' });
  const reportsTable = page.getByRole('table');
  // Wait for either restricted heading OR reports table (diagnostic), but assert restricted for this spec
  const seen = await Promise.race([
    restrictedHeading.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'restricted'),
    reportsTable.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'allowed'),
  ]).catch(() => 'none');
  expect(seen).toBe('restricted');
});
