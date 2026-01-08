import { test as setup, expect } from '@playwright/test';

const adminAuthFile = 'playwright/.auth/admin.json';
const doctorAuthFile = 'playwright/.auth/doctor.json';
const pharmacistAuthFile = 'playwright/.auth/pharmacist.json';
const patientAuthFile = 'playwright/.auth/patient.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'admin@hospital.com');
  await page.fill('input[placeholder="Password"]', 'Admin@2025');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
  
  // Save authentication state
  await page.context().storageState({ path: adminAuthFile });
});

setup('authenticate as doctor', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'cardiology@hospital.com');
  await page.fill('input[placeholder="Password"]', 'doctor123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
  
  // Save authentication state
  await page.context().storageState({ path: doctorAuthFile });
});

setup('authenticate as pharmacist', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'pharmacist@example.com');
  await page.fill('input[placeholder="Password"]', 'Pharmacist@123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
  
  // Save authentication state
  await page.context().storageState({ path: pharmacistAuthFile });
});

setup('authenticate as patient', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', 'raja.patient@example.com');
  await page.fill('input[placeholder="Password"]', 'Patient@123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
  
  // Save authentication state
  await page.context().storageState({ path: patientAuthFile });
});
