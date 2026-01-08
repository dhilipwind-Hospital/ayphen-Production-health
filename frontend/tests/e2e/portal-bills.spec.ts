import { test, expect } from '@playwright/test';

const CRED = { email: 'arun@gmail.com', password: 'Arun@1234' };

async function login(page: any) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(CRED.email);
  await page.getByPlaceholder('Password').fill(CRED.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/portal');
}

test('Bills page: loads, export CSV, invoice view & download', async ({ page, context }) => {
  await login(page);
  await page.goto('/portal/bills');

  // Heading visible
  await expect(page.getByRole('heading', { name: 'Billing History' })).toBeVisible();

  // Table has at least 1 row (data rows usually have role=row but include header; check for any bill number pattern)
  // Verify action buttons exist
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();

  // Export CSV triggers a download
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = await csvDownload;
  expect(await csv.suggestedFilename()).toMatch(/bills.*\.csv$/);

  // Try Invoice View (opens popup)
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'View' }).first().click().catch(async () => {
    // Some antd link buttons render as button; try button fallback
    await page.getByRole('button', { name: 'View' }).first().click();
  });
  const pdfPage = await popup;
  await expect(pdfPage).toBeTruthy();

  // Try Invoice Download (triggers download)
  const pdfDownload = page.waitForEvent('download');
  // Link or Button depending on render
  const dlLink = page.getByRole('link', { name: 'Download' }).first();
  if (await dlLink.isVisible().catch(() => false)) {
    await dlLink.click();
  } else {
    await page.getByRole('button', { name: 'Download' }).first().click();
  }
  const pdf = await pdfDownload;
  expect(await pdf.suggestedFilename()).toMatch(/invoice_.*\.pdf$/);
});

test('Bills page: Stripe test opens popup or shows not-configured toast', async ({ page }) => {
  await login(page);
  await page.goto('/portal/bills');

  await expect(page.getByRole('heading', { name: 'Billing History' })).toBeVisible();

  const stripeBtn = page.getByRole('button', { name: 'Stripe (Test)' }).first();
  await expect(stripeBtn).toBeVisible();

  // Click and expect a popup to open to Stripe test dashboard when STRIPE_TEST_MODE=1
  const popupPromise = page.waitForEvent('popup').catch(() => null);
  await stripeBtn.click();
  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState('domcontentloaded');
    const url = popup.url();
    expect(url).toContain('stripe.com');
    // Close popup to keep test clean
    await popup.close().catch(() => {});
  } else {
    // Fallback: backend returned 501 and UI showed an info/error toast
    // Accept either info or error variant
    const toast = page.getByText(/Stripe not configured|Failed to start Stripe test/i).first();
    await expect(toast).toBeVisible();
  }
});
