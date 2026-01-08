import { test, expect } from '@playwright/test';

const CRED = { email: 'arun@gmail.com', password: 'Arun@1234' };

async function login(page: any) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(CRED.email);
  await page.getByPlaceholder('Password').fill(CRED.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/portal');
}

test('Medical Records: loads, doctor name visible, details modal, export CSV', async ({ page }) => {
  await login(page);
  await page.goto('/portal/records');

  await expect(page.getByRole('heading', { name: 'Medical Records' })).toBeVisible();

  // Doctor column should show a name (contains 'Dr.') in at least one row
  await expect(page.getByText('Dr.', { exact: false })).toBeVisible();

  // View details modal
  const viewBtn = page.getByRole('button', { name: 'View' }).first();
  await viewBtn.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Export CSV triggers download
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = await csvDownload;
  expect(await csv.suggestedFilename()).toMatch(/medical_records.*\.csv$/);
});
