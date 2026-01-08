import { test, expect, Page } from '@playwright/test';

test.describe('Billing Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to billing management
    await page.goto('http://localhost:3000/billing/management');
    await page.waitForLoadState('networkidle');
  });

  test('should display billing dashboard correctly', async ({ page }) => {
    // Check main title
    await expect(page.locator('h2')).toContainText('Billing Management');
    await expect(page.locator('text=Manage invoices, payments, and billing operations')).toBeVisible();
    
    // Check statistics cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Pending Amount')).toBeVisible();
    await expect(page.locator('text=Overdue Amount')).toBeVisible();
    await expect(page.locator('text=Collection Rate')).toBeVisible();
  });

  test('should display invoices tab', async ({ page }) => {
    // Check invoices tab is active by default
    await expect(page.locator('.ant-tabs-tab-active')).toContainText('Invoices');
    
    // Check invoice table
    await expect(page.locator('text=Invoice')).toBeVisible();
    await expect(page.locator('text=Patient')).toBeVisible();
    await expect(page.locator('text=Services')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Check create invoice button
    await expect(page.locator('button:has-text("Create Invoice")')).toBeVisible();
  });

  test('should switch to payments tab', async ({ page }) => {
    // Click payments tab
    await page.click('text=Payments');
    
    // Check payments table
    await expect(page.locator('text=Payment ID')).toBeVisible();
    await expect(page.locator('text=Invoice')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Method')).toBeVisible();
    
    // Check record payment button
    await expect(page.locator('button:has-text("Record Payment")')).toBeVisible();
  });

  test('should open create invoice modal', async ({ page }) => {
    // Click create invoice button
    await page.click('button:has-text("Create Invoice")');
    
    // Check modal is open
    await expect(page.locator('.ant-modal-title')).toContainText('Create New Invoice');
    
    // Check form fields
    await expect(page.locator('input[placeholder="Enter patient name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter patient email"]')).toBeVisible();
    
    // Close modal
    await page.click('.ant-modal-close');
  });

  test('should view invoice details', async ({ page }) => {
    // Click view button on first invoice
    await page.click('button[aria-label="View"]');
    
    // Check modal content
    await expect(page.locator('.ant-modal-title')).toContainText('Invoice');
    await expect(page.locator('text=Patient Information')).toBeVisible();
    await expect(page.locator('text=Payment Information')).toBeVisible();
    await expect(page.locator('text=Services')).toBeVisible();
  });

  test('should filter invoices by status', async ({ page }) => {
    // Click status filter dropdown
    await page.click('.ant-select-selector:has-text("All Status")');
    
    // Select 'Paid' status
    await page.click('text=Paid');
    
    // Verify filter is applied
    await expect(page.locator('.ant-select-selection-item')).toContainText('Paid');
  });

  test('should search invoices', async ({ page }) => {
    // Enter search term
    await page.fill('input[placeholder="Search invoices..."]', 'John');
    
    // Verify search input has value
    await expect(page.locator('input[placeholder="Search invoices..."]')).toHaveValue('John');
  });
});

test.describe('Staff Management System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/admin/staff');
    await page.waitForLoadState('networkidle');
  });

  test('should display staff management dashboard', async ({ page }) => {
    // Check main title
    await expect(page.locator('h2')).toContainText('Staff Management');
    
    // Check statistics cards
    await expect(page.locator('text=Total Staff')).toBeVisible();
    await expect(page.locator('text=Active Staff')).toBeVisible();
    await expect(page.locator('text=Present Today')).toBeVisible();
    await expect(page.locator('text=Avg Performance')).toBeVisible();
  });

  test('should display staff directory', async ({ page }) => {
    // Check staff directory tab
    await expect(page.locator('text=Staff Directory')).toBeVisible();
    
    // Check table columns
    await expect(page.locator('text=Employee')).toBeVisible();
    await expect(page.locator('text=Role & Department')).toBeVisible();
    await expect(page.locator('text=Contact')).toBeVisible();
    await expect(page.locator('text=Performance')).toBeVisible();
    
    // Check add staff button
    await expect(page.locator('button:has-text("Add Staff Member")')).toBeVisible();
  });

  test('should switch to attendance tab', async ({ page }) => {
    // Click attendance tab
    await page.click('text=Attendance');
    
    // Check attendance table
    await expect(page.locator('text=Employee')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Check In')).toBeVisible();
    await expect(page.locator('text=Hours')).toBeVisible();
  });

  test('should open add staff modal', async ({ page }) => {
    // Click add staff button
    await page.click('button:has-text("Add Staff Member")');
    
    // Check modal
    await expect(page.locator('.ant-modal-title')).toContainText('Add New Staff Member');
    
    // Check form fields
    await expect(page.locator('input[placeholder="Enter first name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter last name"]')).toBeVisible();
  });
});
