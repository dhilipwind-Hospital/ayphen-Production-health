import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5001/api';

const doctorEmail = `doc_av_ui_${Date.now()}@example.com`;
const doctorPassword = 'doctor123';

async function seedDoctor(request: any) {
  const r = await request.post(`${API_BASE}/dev/seed-doctor`, {
    data: { email: doctorEmail, password: doctorPassword, firstName: 'Doc', lastName: 'UI' },
  });
  expect(r.ok()).toBeTruthy();
}

test('Doctor Availability UI: add slot and verify in My Schedule', async ({ page, request }) => {
  await seedDoctor(request);

  // Login as doctor
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(doctorEmail);
  await page.getByPlaceholder('Password').fill(doctorPassword);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Expect redirect to /availability
  await page.waitForURL('**/availability');
  await expect(page).toHaveURL(/.*\/availability$/);
  await expect(page.getByRole('heading', { name: 'My Availability' })).toBeVisible();

  // Open Add Slot modal
  await page.getByRole('button', { name: /Add Slot/i }).click();

  // Select Day of Week (Antd Select): find form item by label and open dropdown, then pick 'Monday'
  const dayItem = page.locator('.ant-form-item').filter({ hasText: 'Day of Week' });
  await dayItem.locator('.ant-select').click();
  const dropdown = page.locator('.ant-select-dropdown:visible').first();
  await dropdown.waitFor({ state: 'visible' });
  // Select first option in dropdown (which should be Monday)
  await dropdown.locator('[role="option"]').first().click();
  // Assert the selection now displays Monday
  await expect(dayItem.locator('.ant-select .ant-select-selection-item')).toHaveText(/monday/i);

  // Fill Start Time and End Time (Antd TimePicker uses inputs)
  const timeInputs = page.locator('input[placeholder="Select time"]');
  await timeInputs.nth(0).click();
  await timeInputs.nth(0).fill('10:00');
  await timeInputs.nth(1).click();
  await timeInputs.nth(1).fill('12:00');

  // Optional: notes
  await page.getByLabel('Notes').fill('UI E2E slot');

  // Save
  await page.getByRole('button', { name: 'OK' }).click();

  // Verify table row contains the new time range
  await expect(page.getByText('10:00 - 12:00')).toBeVisible();

  // Edit the slot: click edit icon in the same row
  const row = page.locator('tr').filter({ hasText: '10:00 - 12:00' });
  const editBtn = row.getByRole('button', { name: 'edit-slot' });
  await editBtn.click();
  // Change Notes and save
  await page.getByLabel('Notes').fill('UI E2E slot (edited)');
  await page.getByRole('button', { name: 'OK' }).click();
  // Expect edited notes visible in table
  await expect(page.getByText('UI E2E slot (edited)')).toBeVisible();

  // Cleanup: delete the row we just created (click Delete icon in its row)
  const deleteBtn = row.getByRole('button', { name: 'delete-slot' });
  await deleteBtn.click();

  // After deletion, row should disappear eventually
  await expect(page.getByText('10:00 - 12:00')).toHaveCount(0);
});
