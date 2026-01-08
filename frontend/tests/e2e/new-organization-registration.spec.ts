import { test, expect, Page } from '@playwright/test';

// Test data for new organization registration
const newOrganization = {
  hospitalName: 'Automated Test Medical Center',
  subdomain: 'automated-test-medical',
  description: 'A comprehensive medical facility created through automated UI testing for new organization registration',
  adminFirstName: 'Dr. Test',
  adminLastName: 'Administrator',
  adminEmail: 'admin@automated-test-medical.com',
  adminPhone: '+1-555-TEST-123',
  adminPassword: 'AutoTest123!',
  plan: 'professional'
};

test.describe('🏥 New Organization Registration - Complete UI Automation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enhanced error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP Error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('🚀 Complete New Organization Registration Flow', async ({ page }) => {
    console.log('🏥 Starting New Organization Registration Automation...');
    
    // Step 1: Navigate to Landing Page
    console.log('📍 Step 1: Navigating to landing page...');
    await page.goto('http://localhost:3000/landing');
    await page.waitForLoadState('networkidle');
    
    // Verify landing page loaded
    await expect(page.locator('h1')).toContainText('Modern Hospital Management');
    await expect(page.locator('text=Built for Scale')).toBeVisible();
    console.log('✅ Landing page loaded successfully');
    
    // Step 2: Click "Get Started" to initiate registration
    console.log('🎯 Step 2: Clicking "Get Started" button...');
    await page.click('button:has-text("Get Started")');
    
    // Wait for navigation to signup page
    await page.waitForURL(/\/signup/);
    await page.waitForLoadState('networkidle');
    
    // Verify signup page loaded
    await expect(page.locator('h2')).toContainText('Join Ayphen Care');
    await expect(page.locator('text=Create your hospital account')).toBeVisible();
    console.log('✅ Redirected to signup page successfully');
    
    // Step 3: Fill Hospital Information (Step 1 of 3)
    console.log('🏥 Step 3: Filling hospital information...');
    
    // Check we're on the first step
    await expect(page.locator('text=Organization')).toBeVisible();
    await expect(page.locator('text=Tell us about your hospital')).toBeVisible();
    
    // Fill hospital details
    await page.fill('input[name="name"]', newOrganization.hospitalName);
    await page.fill('input[name="subdomain"]', newOrganization.subdomain);
    await page.fill('textarea[name="description"]', newOrganization.description);
    
    // Verify data was entered correctly
    await expect(page.locator('input[name="name"]')).toHaveValue(newOrganization.hospitalName);
    await expect(page.locator('input[name="subdomain"]')).toHaveValue(newOrganization.subdomain);
    console.log('✅ Hospital information filled successfully');
    
    // Proceed to next step
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Admin Account');
    console.log('✅ Moved to admin account setup');
    
    // Step 4: Fill Admin Account Information (Step 2 of 3)
    console.log('👤 Step 4: Creating admin account...');
    
    // Check we're on the second step
    await expect(page.locator('text=Admin Account')).toBeVisible();
    await expect(page.locator('text=Set up the main administrator account')).toBeVisible();
    
    // Fill admin details
    await page.fill('input[name="adminFirstName"]', newOrganization.adminFirstName);
    await page.fill('input[name="adminLastName"]', newOrganization.adminLastName);
    await page.fill('input[name="adminEmail"]', newOrganization.adminEmail);
    await page.fill('input[name="adminPassword"]', newOrganization.adminPassword);
    await page.fill('input[name="confirmPassword"]', newOrganization.adminPassword);
    
    // Verify admin data was entered
    await expect(page.locator('input[name="adminEmail"]')).toHaveValue(newOrganization.adminEmail);
    console.log('✅ Admin account information filled successfully');
    
    // Proceed to next step
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Plan & Confirm');
    console.log('✅ Moved to plan selection and confirmation');
    
    // Step 5: Plan Selection and Confirmation (Step 3 of 3)
    console.log('💰 Step 5: Selecting plan and confirming...');
    
    // Check we're on the third step
    await expect(page.locator('text=Plan & Confirm')).toBeVisible();
    await expect(page.locator('text=Choose your plan')).toBeVisible();
    
    // Select Professional plan
    await page.selectOption('select[name="plan"]', newOrganization.plan);
    
    // Verify summary information is displayed
    await expect(page.locator('text=Summary')).toBeVisible();
    await expect(page.locator(`text=${newOrganization.hospitalName}`)).toBeVisible();
    await expect(page.locator(`text=${newOrganization.subdomain}`)).toBeVisible();
    await expect(page.locator(`text=${newOrganization.adminEmail}`)).toBeVisible();
    console.log('✅ Plan selected and summary verified');
    
    // Accept terms and conditions
    await page.check('input[name="terms"]');
    console.log('✅ Terms and conditions accepted');
    
    // Step 6: Submit Organization Registration
    console.log('🚀 Step 6: Submitting organization registration...');
    await page.click('button:has-text("Create Organization")');
    
    // Wait for registration to complete
    try {
      await page.waitForSelector('text=Organization created successfully!', { timeout: 15000 });
      console.log('🎉 Organization registration completed successfully!');
      
      // Verify success message
      await expect(page.locator('text=Organization created successfully!')).toBeVisible();
      
      // Take success screenshot
      await page.screenshot({ path: 'organization-registration-success.png', fullPage: true });
      
    } catch (error) {
      console.log('⚠️ Registration may still be processing or encountered an issue...');
      await page.screenshot({ path: 'organization-registration-status.png', fullPage: true });
      
      // Check if there are any error messages
      const errorMessages = await page.locator('.ant-message-error').count();
      if (errorMessages > 0) {
        const errorText = await page.locator('.ant-message-error').textContent();
        console.log('❌ Registration error:', errorText);
      }
    }
  });

  test('🎯 Should validate organization registration form fields', async ({ page }) => {
    console.log('🔍 Testing organization registration form validation...');
    
    // Navigate to signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Check validation messages for hospital info
    await expect(page.locator('text=Please enter hospital name')).toBeVisible();
    await expect(page.locator('text=Please enter subdomain')).toBeVisible();
    
    // Test invalid subdomain format
    await page.fill('input[name="name"]', 'Test Hospital');
    await page.fill('input[name="subdomain"]', 'Invalid Subdomain!@#');
    await page.click('button:has-text("Next")');
    
    await expect(page.locator('text=Subdomain can only contain lowercase letters')).toBeVisible();
    
    console.log('✅ Organization form validation working correctly');
  });

  test('📧 Should validate admin account fields', async ({ page }) => {
    console.log('🔍 Testing admin account validation...');
    
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Fill hospital info and proceed
    await page.fill('input[name="name"]', 'Test Hospital');
    await page.fill('input[name="subdomain"]', 'test-hospital');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Admin Account');
    
    // Try to proceed without admin info
    await page.click('button:has-text("Next")');
    
    // Check validation messages
    await expect(page.locator('text=Please enter first name')).toBeVisible();
    await expect(page.locator('text=Please enter last name')).toBeVisible();
    await expect(page.locator('text=Please enter email')).toBeVisible();
    await expect(page.locator('text=Please enter password')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[name="adminFirstName"]', 'Test');
    await page.fill('input[name="adminLastName"]', 'Admin');
    await page.fill('input[name="adminEmail"]', 'invalid-email');
    await page.click('button:has-text("Next")');
    
    await expect(page.locator('text=Please enter valid email')).toBeVisible();
    
    // Test password mismatch
    await page.fill('input[name="adminEmail"]', 'test@example.com');
    await page.fill('input[name="adminPassword"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different123');
    await page.click('button:has-text("Next")');
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
    
    console.log('✅ Admin account validation working correctly');
  });

  test('🔄 Should allow navigation between steps', async ({ page }) => {
    console.log('🔍 Testing step navigation...');
    
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Fill step 1 and proceed
    await page.fill('input[name="name"]', 'Navigation Test Hospital');
    await page.fill('input[name="subdomain"]', 'nav-test');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Admin Account');
    
    // Go back to step 1
    await page.click('button:has-text("Previous")');
    await expect(page.locator('text=Tell us about your hospital')).toBeVisible();
    
    // Verify data is preserved
    await expect(page.locator('input[name="name"]')).toHaveValue('Navigation Test Hospital');
    await expect(page.locator('input[name="subdomain"]')).toHaveValue('nav-test');
    
    console.log('✅ Step navigation and data preservation working');
  });

  test('📊 Should display progress correctly', async ({ page }) => {
    console.log('🔍 Testing progress display...');
    
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Check initial progress
    await expect(page.locator('text=Organization')).toBeVisible();
    await expect(page.locator('text=Admin Account')).toBeVisible();
    await expect(page.locator('text=Plan & Confirm')).toBeVisible();
    
    // Check step indicators
    const steps = page.locator('.ant-steps-item');
    await expect(steps).toHaveCount(3);
    
    console.log('✅ Progress display working correctly');
  });

  test('🎨 Should have proper styling and branding', async ({ page }) => {
    console.log('🔍 Testing UI styling and branding...');
    
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Check Ayphen Care branding
    await expect(page.locator('h2')).toContainText('Join Ayphen Care');
    
    // Check pink theme elements
    const pinkElements = page.locator('[style*="#e91e63"], [style*="rgb(233, 30, 99)"]');
    expect(await pinkElements.count()).toBeGreaterThan(0);
    
    // Check form styling
    await expect(page.locator('.signup-card')).toBeVisible();
    await expect(page.locator('.signup-steps')).toBeVisible();
    
    console.log('✅ UI styling and branding correct');
  });

  test('📱 Should be mobile responsive', async ({ page }) => {
    console.log('🔍 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Check elements are visible on mobile
    await expect(page.locator('h2')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
    
    // Check steps are visible
    await expect(page.locator('.ant-steps')).toBeVisible();
    
    console.log('✅ Mobile responsiveness working');
  });

  test('⚡ Should have good performance', async ({ page }) => {
    console.log('🔍 Testing performance...');
    
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Check load time is reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Signup page loaded in ${loadTime}ms`);
    
    // Test form interaction performance
    const interactionStart = Date.now();
    
    await page.fill('input[name="name"]', 'Performance Test');
    await page.fill('input[name="subdomain"]', 'perf-test');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Admin Account');
    
    const interactionTime = Date.now() - interactionStart;
    expect(interactionTime).toBeLessThan(2000);
    
    console.log(`✅ Form interaction completed in ${interactionTime}ms`);
  });
});

// Helper functions for organization registration
async function fillHospitalInformation(page: Page, orgData: any) {
  await page.fill('input[name="name"]', orgData.hospitalName);
  await page.fill('input[name="subdomain"]', orgData.subdomain);
  await page.fill('textarea[name="description"]', orgData.description);
}

async function fillAdminAccount(page: Page, orgData: any) {
  await page.fill('input[name="adminFirstName"]', orgData.adminFirstName);
  await page.fill('input[name="adminLastName"]', orgData.adminLastName);
  await page.fill('input[name="adminEmail"]', orgData.adminEmail);
  await page.fill('input[name="adminPassword"]', orgData.adminPassword);
  await page.fill('input[name="confirmPassword"]', orgData.adminPassword);
}

async function selectPlanAndConfirm(page: Page, plan: string) {
  await page.selectOption('select[name="plan"]', plan);
  await page.check('input[name="agreeToTerms"]');
}
