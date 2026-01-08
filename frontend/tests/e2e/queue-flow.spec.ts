import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';

// End-to-end Queue flow:
// 1) Login as Admin
// 2) Create a Patient via API
// 3) Reception: Create Visit via UI and capture visitId from network
// 4) Advance visit to TRIAGE via API
// 5) Triage UI: Call Next, fill vitals, Save & Send to Doctor
// 6) Login as Doctor, Doctor UI: Call Next, Send to Billing

test.describe('Queue End-to-End Flow', () => {
  test('Admin Reception -> Triage -> Doctor -> Billing', async ({ page, request }) => {
    const auth = new AuthHelper(page);

    // 1) Login as Admin
    await auth.loginAsAdmin();

    // Grab access token from browser storage
    const accessToken = await page.evaluate(() => {
      try { return localStorage.getItem('token') || sessionStorage.getItem('token'); } catch { return null; }
    });
    expect(accessToken).toBeTruthy();

    // 2) Create a Patient via API (belongs to same org as admin)
    const ts = Date.now();
    const patient = {
      firstName: 'Queue',
      lastName: `Patient${ts}`,
      email: `queue.patient+${ts}@example.com`,
      phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: 'Patient@123',
      role: 'patient',
    };

    const createRes = await request.post('/api/users', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: patient,
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    const patientId = created?.id || created?.data?.id || created?.data?.user?.id;
    expect(patientId, 'patient id from create user response').toBeTruthy();

    // 3) Reception UI: Create Visit and capture visit id from network
    await page.goto('/queue/reception');

    // Intercept the POST /api/visits response to read visitId
    const visitsRespPromise = page.waitForResponse((res) =>
      res.url().includes('/api/visits') && res.request().method() === 'POST'
    );

    // Use the Select search to find patient by email and create visit
    await page.getByRole('combobox').first().click();
    await page.getByRole('combobox').first().fill(patient.email);
    await page.waitForTimeout(400);
    // Select first option (patient we just created)
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /Create Visit/i }).click();

    const visitsResp = await visitsRespPromise;
    const visitsJson = await visitsResp.json();
    const visitId = visitsJson?.data?.visit?.id;
    expect(visitId, 'visit id from /api/visits response').toBeTruthy();

    // Wait a moment for UI to show token
    await expect(page.locator('text=Last token:')).toBeVisible({ timeout: 10000 });

    // 4) Advance visit to TRIAGE via API
    const advRes = await request.post(`/api/visits/${visitId}/advance`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { toStage: 'triage' },
    });
    expect(advRes.ok()).toBeTruthy();

    // 5) Triage UI: Call Next, fill vitals, Save & Send to Doctor
    await page.goto('/queue/triage');
    await page.getByRole('button', { name: /Call Next/i }).click();

    // Fill a subset of fields by label
    await page.getByLabel('Temperature', { exact: false }).fill('36.8').catch(() => {});
    await page.getByLabel('Systolic', { exact: false }).fill('120').catch(() => {});
    await page.getByLabel('Diastolic', { exact: false }).fill('80').catch(() => {});
    await page.getByLabel('Heart Rate', { exact: false }).fill('76').catch(() => {});
    await page.getByLabel('SpO2', { exact: false }).fill('98').catch(() => {});
    await page.getByLabel('Weight', { exact: false }).fill('70').catch(() => {});
    await page.getByLabel('Height', { exact: false }).fill('172').catch(() => {});
    await page.getByText('Priority', { exact: false }).click().catch(() => {});
    await page.locator('.ant-select-item-option').first().click().catch(() => {});

    await page.getByRole('button', { name: /Save & Send to Doctor/i }).click();
    await expect(page.locator('text=Triage saved and sent to Doctor')).toBeVisible({ timeout: 10000 });

    // 6) Login as Doctor and serve
    await auth.logout();
    await auth.loginAsDoctor();

    await page.goto('/queue/doctor');
    await page.getByRole('button', { name: /Call Next/i }).click();
    await page.getByRole('button', { name: /Send to Billing/i }).click();
    await expect(page.locator('text=Sent to Billing')).toBeVisible({ timeout: 10000 });
  });
});
