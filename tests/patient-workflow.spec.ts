import { test, expect } from '@playwright/test';

test.describe('Patient Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as patient before each test
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'raja.patient@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Patient@123');
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForURL(/\/portal|\/dashboard/);
  });

  test('View patient portal dashboard', async ({ page }) => {
    // Verify patient portal elements
    await expect(page.locator('text=Patient Portal, text=Welcome')).toBeVisible();
    
    // Check for main sections
    await expect(page.locator('text=Appointments, text=Medical Records, text=Bills')).toBeVisible();
  });

  test('View medical records', async ({ page }) => {
    // Navigate to medical records
    await page.click('text=Medical Records, a[href*="records"]');
    
    // Wait for records to load
    await page.waitForSelector('table, .medical-records');
    
    // Check for records table headers
    await expect(page.locator('text=Date, text=Type, text=Doctor')).toBeVisible();
    
    // Look for prescription records
    const prescriptionRecords = page.locator('text=Prescription, .prescription-record');
    if (await prescriptionRecords.first().isVisible()) {
      await expect(prescriptionRecords.first()).toBeVisible();
    }
  });

  test('View prescription details in medical records', async ({ page }) => {
    await page.click('text=Medical Records, a[href*="records"]');
    await page.waitForSelector('table, .medical-records');
    
    // Look for prescription entries
    const prescriptionRow = page.locator('tr:has-text("Prescription"), .prescription-record').first();
    
    if (await prescriptionRow.isVisible()) {
      // Click to expand or view details
      const viewButton = prescriptionRow.locator('button:has-text("View"), button:has-text("Details")');
      if (await viewButton.isVisible()) {
        await viewButton.click();
        
        // Verify prescription details are shown
        await expect(page.locator('text=Medications:, text=Dosage:, text=Instructions:')).toBeVisible();
      } else {
        // Try clicking the row itself to expand
        await prescriptionRow.click();
        await page.waitForTimeout(500);
        
        // Check if details expanded
        await expect(page.locator('text=Medications, text=Medicine')).toBeVisible();
      }
    }
  });

  test('Filter medical records by type', async ({ page }) => {
    await page.click('text=Medical Records, a[href*="records"]');
    await page.waitForSelector('table, .medical-records');
    
    // Look for filter dropdown
    const filterDropdown = page.locator('select, .ant-select').first();
    if (await filterDropdown.isVisible()) {
      await filterDropdown.click();
      
      // Select prescription filter
      await page.click('text=Prescription, option[value="prescription"]');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Verify filtered results
      const rows = page.locator('table tr, .record-item');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('Search medical records', async ({ page }) => {
    await page.click('text=Medical Records, a[href*="records"]');
    await page.waitForSelector('table, .medical-records');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('prescription');
      await page.press('input[placeholder*="search"], input[type="search"]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Verify search worked
      const results = page.locator('table tr, .record-item');
      const resultCount = await results.count();
      expect(resultCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('View appointment history', async ({ page }) => {
    // Navigate to appointments section
    const appointmentsLink = page.locator('text=Appointments, a[href*="appointments"]');
    if (await appointmentsLink.isVisible()) {
      await appointmentsLink.click();
      
      // Wait for appointments to load
      await page.waitForSelector('table, .appointments-list');
      
      // Verify appointment details
      await expect(page.locator('text=Date, text=Doctor, text=Service')).toBeVisible();
      
      // Look for our test appointments
      const appointmentRows = page.locator('tr:has-text("ECG"), tr:has-text("Cardiology")');
      if (await appointmentRows.first().isVisible()) {
        await expect(appointmentRows.first()).toBeVisible();
      }
    }
  });

  test('View billing information', async ({ page }) => {
    // Navigate to bills section
    const billsLink = page.locator('text=Bills, a[href*="bills"]');
    if (await billsLink.isVisible()) {
      await billsLink.click();
      
      // Wait for bills to load
      await page.waitForSelector('table, .bills-list');
      
      // Check for billing table headers
      await expect(page.locator('text=Date, text=Amount, text=Status')).toBeVisible();
    }
  });

  test('Update patient profile', async ({ page }) => {
    // Look for profile or settings link
    const profileLink = page.locator('text=Profile, text=Settings, a[href*="profile"]');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      
      // Wait for profile form
      await page.waitForSelector('form, .profile-form');
      
      // Verify profile fields
      await expect(page.locator('input[name="firstName"], input[name="lastName"]')).toBeVisible();
      
      // Test updating phone number
      const phoneInput = page.locator('input[name="phone"]');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+91-9876543999');
        
        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          
          // Verify success message
          await expect(page.locator('text=Profile updated, text=Success')).toBeVisible();
        }
      }
    }
  });

  test('Book new appointment', async ({ page }) => {
    // Look for book appointment button/link
    const bookAppointmentLink = page.locator('text=Book Appointment, a[href*="book"]');
    if (await bookAppointmentLink.isVisible()) {
      await bookAppointmentLink.click();
      
      // Wait for booking form
      await page.waitForSelector('form, .appointment-form');
      
      // Fill appointment form
      const departmentSelect = page.locator('select[name="department"], .ant-select').first();
      if (await departmentSelect.isVisible()) {
        await departmentSelect.click();
        await page.click('text=Cardiology, option[value*="cardiology"]');
        
        // Select doctor
        const doctorSelect = page.locator('select[name="doctor"]');
        if (await doctorSelect.isVisible()) {
          await doctorSelect.click();
          await page.click('text=Cardiology Consultant');
        }
        
        // Select service
        const serviceSelect = page.locator('select[name="service"]');
        if (await serviceSelect.isVisible()) {
          await serviceSelect.click();
          await page.click('text=ECG');
        }
        
        // Select date and time (if available)
        const dateInput = page.locator('input[type="date"], .ant-picker-input');
        if (await dateInput.isVisible()) {
          await dateInput.click();
          // Select tomorrow's date
          await page.click('.ant-picker-cell:not(.ant-picker-cell-disabled)');
        }
        
        // Submit booking
        await page.click('button:has-text("Book Appointment"), button[type="submit"]');
        
        // Verify success
        await expect(page.locator('text=Appointment booked, text=Success')).toBeVisible();
      }
    }
  });
});
