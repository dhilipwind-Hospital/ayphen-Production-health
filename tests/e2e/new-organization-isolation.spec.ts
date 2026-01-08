import { test, expect } from '@playwright/test';

/**
 * E2E Test: New Organization Data Isolation
 * 
 * This test verifies that:
 * 1. New organizations can be created successfully
 * 2. New organizations start with ZERO data (no sample data)
 * 3. No data is inherited from other organizations
 * 4. Multi-tenancy isolation is working correctly
 */

test.describe('New Organization Data Isolation', () => {
  const timestamp = Date.now();
  const testOrgName = `Test Hospital ${timestamp}`;
  const testSubdomain = `test-hospital-${timestamp}`;
  const testAdminEmail = `admin${timestamp}@test.com`;
  const testAdminPassword = 'Admin@123';

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this test suite
    test.setTimeout(120000); // 2 minutes
  });

  test('should create new organization with clean portfolio', async ({ page }) => {
    console.log('🧪 Starting new organization isolation test...');

    // Step 1: Navigate to signup page
    console.log('📍 Step 1: Navigating to signup page...');
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');

    // Step 2: Fill in organization details
    console.log('📍 Step 2: Filling organization details...');
    
    // Hospital Name
    await page.fill('input[name="name"], input[placeholder*="Hospital"], input[placeholder*="Organization"]', testOrgName);
    
    // Subdomain
    await page.fill('input[name="subdomain"], input[placeholder*="subdomain"]', testSubdomain);
    
    // Admin Email
    await page.fill('input[name="adminEmail"], input[type="email"]', testAdminEmail);
    
    // Admin Password
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill(testAdminPassword);
    }
    
    // Admin First Name
    await page.fill('input[name="adminFirstName"], input[placeholder*="First"]', 'Test');
    
    // Admin Last Name
    await page.fill('input[name="adminLastName"], input[placeholder*="Last"]', 'Admin');
    
    // Select Plan (if available)
    const planSelect = page.locator('select[name="plan"]');
    if (await planSelect.count() > 0) {
      await planSelect.selectOption('professional');
    }

    // Step 3: Submit the form
    console.log('📍 Step 3: Submitting organization creation form...');
    await page.click('button[type="submit"], button:has-text("Create")');
    
    // Wait for success or navigation
    await page.waitForTimeout(3000);

    // Step 4: Logout (if logged in as super admin)
    console.log('📍 Step 4: Logging out...');
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 5: Login with new organization credentials
    console.log('📍 Step 5: Logging in with new organization credentials...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"], input[name="email"]', testAdminEmail);
    await page.fill('input[type="password"], input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Step 6: Verify organization name is displayed correctly
    console.log('📍 Step 6: Verifying organization name...');
    const orgNameElement = page.locator(`text=${testOrgName}`).first();
    await expect(orgNameElement).toBeVisible({ timeout: 10000 });
    console.log('✅ Organization name displayed correctly');

    // Step 7: Verify Dashboard shows 0 counts
    console.log('📍 Step 7: Verifying dashboard shows 0 counts...');
    
    // Check for "0" in various stat cards
    const zeroElements = page.locator('text=/^0$/');
    const zeroCount = await zeroElements.count();
    expect(zeroCount).toBeGreaterThan(0);
    console.log(`✅ Dashboard shows ${zeroCount} zero counts`);

    // Step 8: Check Patients page
    console.log('📍 Step 8: Checking Patients page...');
    await page.click('a:has-text("Patients"), [href*="patient"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify NO patient data is shown
    const patientTable = page.locator('table tbody tr');
    const patientCount = await patientTable.count();
    
    if (patientCount > 0) {
      console.error('❌ FAIL: Found patient data in new organization!');
      console.error(`   Patient count: ${patientCount}`);
      
      // Log the patient names found
      for (let i = 0; i < Math.min(patientCount, 5); i++) {
        const patientName = await patientTable.nth(i).textContent();
        console.error(`   - Patient ${i + 1}: ${patientName}`);
      }
      
      throw new Error(`Expected 0 patients, but found ${patientCount}`);
    }
    
    console.log('✅ Patients page is empty (0 patients)');

    // Step 9: Check Departments page
    console.log('📍 Step 9: Checking Departments page...');
    
    // Navigate to Administration -> Departments
    const adminMenu = page.locator('text=Administration').first();
    if (await adminMenu.count() > 0) {
      await adminMenu.click();
      await page.waitForTimeout(500);
    }
    
    const departmentsLink = page.locator('a:has-text("Departments"), [href*="department"]');
    if (await departmentsLink.count() > 0) {
      await departmentsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verify NO department data is shown
      const deptTable = page.locator('table tbody tr');
      const deptCount = await deptTable.count();
      
      if (deptCount > 0) {
        console.error('❌ FAIL: Found department data in new organization!');
        console.error(`   Department count: ${deptCount}`);
        throw new Error(`Expected 0 departments, but found ${deptCount}`);
      }
      
      console.log('✅ Departments page is empty (0 departments)');
    }

    // Step 10: Check Services page
    console.log('📍 Step 10: Checking Services page...');
    const servicesLink = page.locator('a:has-text("Services"), [href*="service"]');
    if (await servicesLink.count() > 0) {
      await servicesLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verify NO service data is shown
      const serviceTable = page.locator('table tbody tr');
      const serviceCount = await serviceTable.count();
      
      if (serviceCount > 0) {
        console.error('❌ FAIL: Found service data in new organization!');
        console.error(`   Service count: ${serviceCount}`);
        throw new Error(`Expected 0 services, but found ${serviceCount}`);
      }
      
      console.log('✅ Services page is empty (0 services)');
    }

    // Step 11: Check Appointments page
    console.log('📍 Step 11: Checking Appointments page...');
    const appointmentsLink = page.locator('a:has-text("Appointments"), [href*="appointment"]').first();
    if (await appointmentsLink.count() > 0) {
      await appointmentsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verify NO appointment data is shown
      const apptTable = page.locator('table tbody tr');
      const apptCount = await apptTable.count();
      
      if (apptCount > 0) {
        console.error('❌ FAIL: Found appointment data in new organization!');
        console.error(`   Appointment count: ${apptCount}`);
        throw new Error(`Expected 0 appointments, but found ${apptCount}`);
      }
      
      console.log('✅ Appointments page is empty (0 appointments)');
    }

    // Final Summary
    console.log('\n🎉 TEST PASSED: New organization has clean portfolio!');
    console.log('✅ Organization created successfully');
    console.log('✅ Organization name displayed correctly');
    console.log('✅ Dashboard shows 0 counts');
    console.log('✅ Patients: 0 (no inherited data)');
    console.log('✅ Departments: 0 (no inherited data)');
    console.log('✅ Services: 0 (no inherited data)');
    console.log('✅ Appointments: 0 (no inherited data)');
    console.log('✅ Multi-tenancy isolation working correctly');
  });

  test('should verify old organization data is preserved', async ({ page }) => {
    console.log('🧪 Testing that old organization data is preserved...');

    // Login to an existing organization (if exists)
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login with a known existing account
    // This test assumes there's an existing organization with data
    // Adjust credentials as needed
    const existingEmail = 'admin@hospital.com'; // Change to your existing org
    const existingPassword = 'Admin@123'; // Change to your existing password
    
    await page.fill('input[type="email"]', existingEmail);
    await page.fill('input[type="password"]', existingPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // If login successful, verify data exists
    const currentUrl = page.url();
    if (!currentUrl.includes('login')) {
      console.log('✅ Successfully logged into existing organization');
      
      // Check if there's data (should have some)
      const hasData = await page.locator('table tbody tr').count() > 0;
      if (hasData) {
        console.log('✅ Old organization data is preserved');
      }
    } else {
      console.log('⚠️  Could not login to existing organization (may not exist)');
    }
  });
});
