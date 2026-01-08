import { test, expect } from '@playwright/test';

test.describe('Quick Smoke Tests', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('http://localhost:3000/landing');
    await expect(page.locator('h1')).toContainText('Modern Hospital Management');
    await expect(page.locator('text=Ayphen Care')).toBeVisible();
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('http://localhost:3000/signup');
    await expect(page.locator('h2')).toContainText('Join Ayphen Care');
    await expect(page.locator('text=Hospital Info')).toBeVisible();
  });

  test('should load onboarding page', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    await expect(page.locator('h2')).toContainText('Welcome to Ayphen Care');
  });

  test('should load telemedicine hub', async ({ page }) => {
    await page.goto('http://localhost:3000/telemedicine');
    await expect(page.locator('h2')).toContainText('Telemedicine Hub');
  });

  test('should load billing management', async ({ page }) => {
    await page.goto('http://localhost:3000/billing/management');
    await expect(page.locator('h2')).toContainText('Billing Management');
  });

  test('should load training center', async ({ page }) => {
    await page.goto('http://localhost:3000/training');
    await expect(page.locator('h2')).toContainText('Training Center');
  });
});
