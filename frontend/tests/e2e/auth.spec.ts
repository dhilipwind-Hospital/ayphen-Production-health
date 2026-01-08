import { test, expect } from '@playwright/test';

const email = `e2e_${Date.now()}@example.com`;
const password = 'StrongP@ss1';

test('Register (patient) then Login -> redirect to /portal', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.getByPlaceholder('First Name').fill('E2E');
  await page.getByPlaceholder('Last Name').fill('User');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Phone Number').fill('9000000000');
  await page.getByPlaceholder('Password').first().fill(password);
  await page.getByPlaceholder('Confirm Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  // After successful registration, app redirects to /login
  await page.waitForURL('**/login');

  // Login
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Patient role defaults after register -> should go to /portal
  await page.waitForURL('**/portal');
  await expect(page).toHaveURL(/.*\/portal$/);
});
