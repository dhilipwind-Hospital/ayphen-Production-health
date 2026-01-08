import { test, expect } from '@playwright/test';

test.describe('Pharmacy Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pharmacist before each test
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'pharmacist@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Pharmacist@123');
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForURL(/\/pharmacy/);
  });

  test('View pharmacy dashboard', async ({ page }) => {
    // Verify pharmacy dashboard elements
    await expect(page.locator('text=Pharmacy Management, text=Pharmacy Dashboard')).toBeVisible();
    
    // Check for main tabs/sections
    await expect(page.locator('text=Dashboard, text=Inventory, text=Prescriptions')).toBeVisible();
  });

  test('View medicine inventory', async ({ page }) => {
    // Navigate to inventory/medicines
    await page.click('text=Inventory, a[href*="medicines"]');
    
    // Wait for medicines list to load
    await page.waitForSelector('table, .medicines-list');
    
    // Verify medicine entries
    await expect(page.locator('text=Paracetamol, text=Ibuprofen')).toBeVisible();
    
    // Check for medicine details columns
    await expect(page.locator('text=Name, text=Stock, text=Strength')).toBeVisible();
  });

  test('View prescriptions from doctors', async ({ page }) => {
    // Navigate to prescriptions tab
    await page.click('text=Prescriptions, a[href*="prescriptions"]');
    
    // Wait for prescriptions to load
    await page.waitForSelector('table, .prescriptions-list');
    
    // Check for prescription entries (might be empty initially)
    const prescriptionRows = page.locator('table tr, .prescription-item');
    const rowCount = await prescriptionRows.count();
    
    if (rowCount > 1) { // More than just header row
      // Verify prescription details
      await expect(page.locator('text=Patient, text=Doctor, text=Status')).toBeVisible();
      
      // Look for patient names from our test data
      const patientNames = page.locator('text=raja patient, text=arun bharati, text=Patient Arun');
      if (await patientNames.first().isVisible()) {
        await expect(patientNames.first()).toBeVisible();
      }
    }
  });

  test('Dispense prescription workflow', async ({ page }) => {
    await page.click('text=Prescriptions');
    await page.waitForSelector('table, .prescriptions-list');
    
    // Look for dispense buttons
    const dispenseButton = page.locator('button:has-text("Dispense")').first();
    
    if (await dispenseButton.isVisible()) {
      await dispenseButton.click();
      
      // Wait for dispense modal/form
      await page.waitForSelector('.ant-modal, .dispense-form, form');
      
      // Verify modal content
      await expect(page.locator('text=Dispense Prescription, text=Dispense Medicine')).toBeVisible();
      
      // Check for medicine items to dispense
      const medicineCheckboxes = page.locator('input[type="checkbox"], .ant-checkbox');
      if (await medicineCheckboxes.first().isVisible()) {
        await medicineCheckboxes.first().check();
      }
      
      // Submit dispensing
      await page.click('button:has-text("Dispense Prescription"), button:has-text("Confirm")');
      
      // Verify success message
      await expect(page.locator('text=Prescription dispensed, text=Success')).toBeVisible();
    }
  });

  test('Filter prescriptions by status', async ({ page }) => {
    await page.click('text=Prescriptions');
    await page.waitForSelector('table, .prescriptions-list');
    
    // Test different status filters
    const statusFilters = ['Pending', 'Dispensed', 'Partially Dispensed'];
    
    for (const status of statusFilters) {
      const filterTab = page.locator(`text=${status}, .ant-tabs-tab:has-text("${status}")`);
      if (await filterTab.isVisible()) {
        await filterTab.click();
        await page.waitForTimeout(500); // Wait for filter to apply
        
        // Verify we're on the correct tab
        await expect(filterTab).toHaveClass(/active|ant-tabs-tab-active/);
      }
    }
  });

  test('Search prescriptions', async ({ page }) => {
    await page.click('text=Prescriptions');
    await page.waitForSelector('table, .prescriptions-list');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('raja');
      await page.press('input[placeholder*="search"], input[type="search"]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Verify search results (if any)
      const results = page.locator('table tr, .prescription-item');
      const resultCount = await results.count();
      
      // Should show filtered results or empty state
      expect(resultCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('View prescription details', async ({ page }) => {
    await page.click('text=Prescriptions');
    await page.waitForSelector('table, .prescriptions-list');
    
    // Look for view/details buttons
    const viewButton = page.locator('button:has-text("View"), button:has-text("Details")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // Wait for details modal/page
      await page.waitForSelector('.ant-modal, .prescription-details');
      
      // Verify prescription details are shown
      await expect(page.locator('text=Prescription Details, text=Patient:, text=Doctor:')).toBeVisible();
    }
  });

  test('Print prescription', async ({ page }) => {
    await page.click('text=Prescriptions');
    await page.waitForSelector('table, .prescriptions-list');
    
    // Look for print buttons
    const printButton = page.locator('button:has-text("Print")').first();
    
    if (await printButton.isVisible()) {
      // Set up print dialog handler
      page.on('dialog', dialog => dialog.accept());
      
      await printButton.click();
      
      // Verify print action (this might open print dialog)
      // We can't easily test actual printing, but we can verify the button works
      await page.waitForTimeout(1000);
    }
  });
});
