import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test('Doctor login and redirect', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', 'cardiology.consultant@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'doctor123');
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Wait for redirect and verify
    await page.waitForURL(/\/appointments|\/dashboard/);
    
    // Verify user is logged in (check for user info or logout button)
    await expect(page.locator('text=Cardiology')).toBeVisible();
  });

  test('Patient login and redirect', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', 'raja.patient@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Patient@123');
    
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Wait for redirect to patient portal
    await page.waitForURL(/\/portal|\/dashboard/);
    
    // Verify patient portal elements
    await expect(page.locator('text=Patient Portal, text=raja')).toBeVisible();
  });

  test('Pharmacist login and redirect', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', 'pharmacist@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Pharmacist@123');
    
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Wait for redirect to pharmacy dashboard
    await page.waitForURL(/\/pharmacy/);
    
    // Verify pharmacy elements
    await expect(page.locator('text=Pharmacy, text=Prescriptions')).toBeVisible();
  });

  test('Admin login and redirect', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', 'admin@hospital.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin@2025');
    
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin|\/appointments/);
    
    // Verify admin elements
    await expect(page.locator('text=Admin, text=Hospital')).toBeVisible();
  });

  test('Invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"], button:has-text("Login")');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid credentials, text=Login failed')).toBeVisible();
  });
});
