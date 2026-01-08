import { test, expect } from '@playwright/test';

// This spec covers the current RegisterFixed.tsx 3-step wizard and the "No account? Sign up" link on /login
// It creates a new patient user without organization and verifies redirect back to login after successful registration.

test.describe('Patient Self-Registration (No account? Sign up)', () => {
  test('Register new patient via login -> sign up link', async ({ page }) => {
    const ts = Date.now();
    const email = `patient+${ts}@example.com`;
    const phone = '9876543210';
    const password = 'Strong@1234';

    // Go to login and click the minimal sign-up link we added
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('a:has-text("No account? Sign up")').click();

    // Expect Register wizard
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    await expect(page.locator('text=Personal Info')).toBeVisible();

    // Step 1: Personal Info
    await page.locator('input[placeholder="John Doe"]').fill('Playwright Patient');
    await page.locator('input[placeholder="your.email@example.com"]').fill(email);
    await page.locator('input[placeholder="+91 98765 43210"]').fill(phone);
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 2: Account Setup
    await expect(page.locator('text=Account Setup')).toBeVisible();
    await page.locator('input[placeholder*="At least 8 chars"]').fill(password);
    await page.locator('input[placeholder*="Re-enter"]').fill(password);
    await page.getByLabel('Patient', { exact: true }).check().catch(async () => {
      // Fallback if label mapping fails due to AntD structure
      await page.locator('text=Patient').click();
    });
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 3: Review & Confirm
    await expect(page.locator('text=Review & Confirm')).toBeVisible();
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Expect success -> navigate back to login
    // Backend returns 201, frontend shows toast and navigate('/login')
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page.locator('text=Welcome to Ayphen Care')).toBeVisible();
  });
});
