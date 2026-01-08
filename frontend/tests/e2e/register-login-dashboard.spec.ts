import { test, expect } from '@playwright/test';

// E2E: Register → Login → Navigate to dashboard/portal (handles optional hospital selection)

test('Register new patient, login, then reach dashboard/portal', async ({ page }) => {
  const ts = Date.now();
  const email = `reglogin+${ts}@example.com`;
  const phone = '9876543210';
  const password = 'Strong@1234';

  // Go to register
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Create Your Account')).toBeVisible();

  // Step 1
  await page.locator('input[placeholder="John Doe"]').fill('Playwright Flow');
  await page.locator('input[placeholder="your.email@example.com"]').fill(email);
  await page.locator('input[placeholder="+91 98765 43210"]').fill(phone);
  await page.getByRole('button', { name: /Next/i }).click();

  // Step 2
  await expect(page.locator('text=Account Setup')).toBeVisible();
  await page.locator('input[placeholder*="At least 8 chars"]').fill(password);
  await page.locator('input[placeholder*="Re-enter"]').fill(password);
  // Select Patient
  const patientRadio = page.getByLabel('Patient', { exact: true });
  if (await patientRadio.count()) {
    await patientRadio.check().catch(async () => { await page.locator('text=Patient').click(); });
  } else {
    await page.locator('text=Patient').click();
  }
  await page.getByRole('button', { name: /Next/i }).click();

  // Step 3
  await expect(page.locator('text=Review & Confirm')).toBeVisible();
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /Create Account/i }).click();

  // Should land on login after success
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await expect(page.locator('text=Welcome to Ayphen Care')).toBeVisible();

  // Login with the same account
  await page.locator('input[placeholder="your.email@example.com"]').fill(email);
  await page.locator('input[placeholder="Enter your password"]').fill(password);
  await page.getByRole('button', { name: /^Login$/ }).click();

  // After login, two possible flows:
  // 1) Org selection required → ChooseHospital page appears, click Use Default Hospital.
  // 2) No org requirement → redirect to dashboard/home directly.
  try {
    await page.waitForSelector('text=Choose your hospital', { timeout: 8000 });
    await page.getByRole('button', { name: 'Use Default Hospital' }).click();
    // Patient is routed to /portal, others '/' per ChooseHospital.tsx
    await page.waitForURL(/\/(portal|dashboard|$)/, { timeout: 15000 });
  } catch {
    // No org selection. Wait for typical post-login routes
    await page.waitForURL(/\/(portal|dashboard|$)/, { timeout: 15000 });
  }

  // Basic assertion: some dashboard/portal content visible
  const possibleTexts = [
    'Dashboard',
    'Welcome',
    'Appointments',
    'Patient Portal',
  ];
  let found = false;
  for (const t of possibleTexts) {
    if (await page.locator(`text=${t}`).first().isVisible().catch(() => Promise.resolve(false))) {
      found = true; break;
    }
  }
  expect(found).toBeTruthy();
});
