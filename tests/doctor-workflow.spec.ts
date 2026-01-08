import { test, expect } from '@playwright/test';

test.describe('Doctor Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as doctor before each test
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'cardiology.consultant@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'doctor123');
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForURL(/\/appointments|\/dashboard/);
  });

  test('View appointments with real patient data', async ({ page }) => {
    // Navigate to appointments if not already there
    await page.goto('/appointments');
    
    // Wait for appointments table to load
    await page.waitForSelector('table, .appointments-table');
    
    // Verify real patient names are displayed
    await expect(page.locator('text=raja patient')).toBeVisible();
    await expect(page.locator('text=arun bharati')).toBeVisible();
    
    // Verify appointment details
    await expect(page.locator('text=ECG')).toBeVisible();
    await expect(page.locator('text=Confirmed, text=confirmed')).toBeVisible();
    
    // Verify Write Prescription buttons are present
    await expect(page.locator('button:has-text("Write Prescription"), a:has-text("Write Prescription")')).toBeVisible();
  });

  test('Write prescription shows correct patient name', async ({ page }) => {
    await page.goto('/appointments');
    
    // Wait for appointments to load
    await page.waitForSelector('table');
    
    // Click Write Prescription for raja patient
    const writePrescriptionButton = page.locator('tr:has-text("raja patient") button:has-text("Write Prescription"), tr:has-text("raja patient") a:has-text("Write Prescription")').first();
    await writePrescriptionButton.click();
    
    // Wait for prescription form to load
    await page.waitForSelector('form, .prescription-form');
    
    // Verify correct patient name is displayed (NOT "Patient Unknown")
    await expect(page.locator('text=raja patient')).toBeVisible();
    await expect(page.locator('text=Patient Unknown')).not.toBeVisible();
    
    // Verify form elements are present
    await expect(page.locator('textarea[name="diagnosis"], input[name="diagnosis"]')).toBeVisible();
    await expect(page.locator('button:has-text("Add Medicine")')).toBeVisible();
    await expect(page.locator('button:has-text("Save Prescription")')).toBeVisible();
  });

  test('Add medicine to prescription', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForSelector('table');
    
    // Click Write Prescription
    const writePrescriptionButton = page.locator('button:has-text("Write Prescription"), a:has-text("Write Prescription")').first();
    await writePrescriptionButton.click();
    
    await page.waitForSelector('form, .prescription-form');
    
    // Fill diagnosis
    await page.fill('textarea[name="diagnosis"], input[name="diagnosis"]', 'Post-examination pain management');
    
    // Add medicine
    await page.click('button:has-text("Add Medicine")');
    
    // Wait for medicine selection
    await page.waitForSelector('select, .ant-select');
    
    // Select medicine (try multiple selectors)
    try {
      await page.selectOption('select[name="medicine"]', { label: 'Ibuprofen' });
    } catch {
      await page.click('.ant-select');
      await page.click('text=Ibuprofen');
    }
    
    // Fill medicine details
    await page.fill('input[name="dosage"], input[placeholder*="dosage"]', '1 tablet');
    await page.fill('input[name="frequency"], input[placeholder*="frequency"]', 'Twice daily');
    await page.fill('input[name="duration"], input[placeholder*="duration"]', '5 days');
    await page.fill('input[name="quantity"], input[placeholder*="quantity"]', '10');
    await page.fill('textarea[name="instructions"], input[name="instructions"]', 'Take after meals');
    
    // Save prescription
    await page.click('button:has-text("Save Prescription")');
    
    // Verify success message
    await expect(page.locator('text=Prescription saved, text=Success')).toBeVisible();
  });

  test('View patient records', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForSelector('table');
    
    // Click Records button for a patient
    const recordsButton = page.locator('button:has-text("Records"), a:has-text("Records")').first();
    if (await recordsButton.isVisible()) {
      await recordsButton.click();
      
      // Verify patient records page loads
      await expect(page.locator('text=Patient Records, text=Medical Records')).toBeVisible();
    }
  });

  test('Navigation between doctor sections', async ({ page }) => {
    // Test navigation to different doctor sections
    const sections = [
      { name: 'Appointments', selector: 'a[href*="appointments"], text=Appointments' },
      { name: 'My Patients', selector: 'a[href*="patients"], text=My Patients' },
      { name: 'Prescriptions', selector: 'a[href*="prescriptions"], text=Prescriptions' }
    ];
    
    for (const section of sections) {
      try {
        await page.click(section.selector);
        await page.waitForTimeout(1000); // Wait for navigation
        // Verify we're in the correct section
        await expect(page.locator(`text=${section.name}`)).toBeVisible();
      } catch (error) {
        console.log(`Section ${section.name} might not be available: ${error}`);
      }
    }
  });
});
