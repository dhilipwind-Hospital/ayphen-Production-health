import { test, expect, Page } from '@playwright/test';

// Test data for hospital registration
const testHospital = {
  name: 'Automated Test Hospital',
  subdomain: 'autotest-hospital',
  description: 'A test hospital created by automated testing suite',
  adminFirstName: 'Test',
  adminLastName: 'Administrator',
  adminEmail: 'admin@autotest-hospital.com',
  adminPassword: 'TestPass123!',
  plan: 'professional'
};

test.describe('Hospital Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
  });

  test('should display signup page correctly', async ({ page }) => {
    // Check page title and main elements
    await expect(page).toHaveTitle(/Ayphen Care/);
    await expect(page.locator('h2')).toContainText('Join Ayphen Care');
    await expect(page.locator('text=Create your hospital account')).toBeVisible();
    
    // Check steps are visible
    await expect(page.locator('.signup-steps')).toBeVisible();
    await expect(page.locator('text=Hospital Info')).toBeVisible();
    await expect(page.locator('text=Admin Setup')).toBeVisible();
    await expect(page.locator('text=Plan & Confirm')).toBeVisible();
  });

  test('should complete full hospital registration flow', async ({ page }) => {
    // Step 1: Hospital Information
    await fillHospitalInfo(page);
    await page.click('button:has-text("Next")');
    
    // Wait for step 2 to load
    await page.waitForSelector('text=Create Admin Account');
    
    // Step 2: Admin Setup
    await fillAdminInfo(page);
    await page.click('button:has-text("Next")');
    
    // Wait for step 3 to load
    await page.waitForSelector('text=Choose your plan');
    
    // Step 3: Plan Selection and Confirmation
    await selectPlan(page);
    await agreeToTerms(page);
    
    // Submit the form
    await page.click('button:has-text("Create Organization")');
    
    // Wait for success message or redirect
    await page.waitForSelector('text=Organization created successfully!', { timeout: 10000 });
    
    // Verify success
    await expect(page.locator('text=Organization created successfully!')).toBeVisible();
  });

  test('should validate required fields in step 1', async ({ page }) => {
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Check for validation errors
    await expect(page.locator('text=Please enter hospital name')).toBeVisible();
    await expect(page.locator('text=Please enter subdomain')).toBeVisible();
  });

  test('should validate subdomain format', async ({ page }) => {
    // Fill invalid subdomain
    await page.fill('input[name="name"]', testHospital.name);
    await page.fill('input[name="subdomain"]', 'Invalid Subdomain!');
    
    await page.click('button:has-text("Next")');
    
    // Check for subdomain validation error
    await expect(page.locator('text=Subdomain can only contain lowercase letters')).toBeVisible();
  });

  test('should validate email format in step 2', async ({ page }) => {
    // Complete step 1
    await fillHospitalInfo(page);
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Create Admin Account');
    
    // Fill invalid email
    await page.fill('input[name="adminFirstName"]', testHospital.adminFirstName);
    await page.fill('input[name="adminLastName"]', testHospital.adminLastName);
    await page.fill('input[name="adminEmail"]', 'invalid-email');
    
    await page.click('button:has-text("Next")');
    
    // Check for email validation error
    await expect(page.locator('text=Please enter valid email')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    // Complete step 1
    await fillHospitalInfo(page);
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Create Admin Account');
    
    // Fill mismatched passwords
    await page.fill('input[name="adminFirstName"]', testHospital.adminFirstName);
    await page.fill('input[name="adminLastName"]', testHospital.adminLastName);
    await page.fill('input[name="adminEmail"]', testHospital.adminEmail);
    await page.fill('input[name="adminPassword"]', testHospital.adminPassword);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    
    await page.click('button:has-text("Next")');
    
    // Check for password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should allow navigation between steps', async ({ page }) => {
    // Complete step 1
    await fillHospitalInfo(page);
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Create Admin Account');
    
    // Go back to step 1
    await page.click('button:has-text("Previous")');
    await expect(page.locator('text=Hospital Information')).toBeVisible();
    
    // Verify data is preserved
    await expect(page.locator('input[name="name"]')).toHaveValue(testHospital.name);
    await expect(page.locator('input[name="subdomain"]')).toHaveValue(testHospital.subdomain);
  });

  test('should display plan options correctly', async ({ page }) => {
    // Navigate to step 3
    await fillHospitalInfo(page);
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Create Admin Account');
    
    await fillAdminInfo(page);
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Choose your plan');
    
    // Check all plan options are visible
    await expect(page.locator('text=Basic - $99/month')).toBeVisible();
    await expect(page.locator('text=Professional - $299/month')).toBeVisible();
    await expect(page.locator('text=Enterprise - $999/month')).toBeVisible();
    
    // Check summary section
    await expect(page.locator('text=Summary')).toBeVisible();
    await expect(page.locator(`text=${testHospital.name}`)).toBeVisible();
    await expect(page.locator(`text=${testHospital.subdomain}`)).toBeVisible();
  });
});

test.describe('Onboarding Flow', () => {
  test('should navigate to onboarding after registration', async ({ page }) => {
    // Complete registration first
    await page.goto('http://localhost:3000/signup');
    await completeRegistration(page);
    
    // Should redirect to onboarding or login
    await page.waitForURL(/\/(onboarding|login)/);
    
    // If redirected to login, login and then go to onboarding
    if (page.url().includes('/login')) {
      await loginAsAdmin(page);
      await page.goto('http://localhost:3000/onboarding');
    }
    
    // Verify onboarding page
    await expect(page.locator('text=Welcome to Ayphen Care')).toBeVisible();
    await expect(page.locator('text=Setup Progress')).toBeVisible();
  });

  test('should display onboarding dashboard correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    
    // Check main elements
    await expect(page.locator('h2')).toContainText('Welcome to Ayphen Care');
    await expect(page.locator('text=Your hospital management system is ready')).toBeVisible();
    
    // Check statistics cards
    await expect(page.locator('text=Setup Progress')).toBeVisible();
    await expect(page.locator('text=Tasks Completed')).toBeVisible();
    await expect(page.locator('text=Features Available')).toBeVisible();
    
    // Check setup tasks
    await expect(page.locator('text=Setup Tasks')).toBeVisible();
    await expect(page.locator('text=What Your Hospital Gets')).toBeVisible();
  });

  test('should navigate to setup wizard', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    
    // Click continue setup button
    await page.click('button:has-text("Continue Setup")');
    
    // Should navigate to setup wizard
    await page.waitForURL(/\/onboarding\/setup/);
    await expect(page.locator('text=Hospital Setup Wizard')).toBeVisible();
  });
});

test.describe('Telemedicine Features', () => {
  test('should access telemedicine hub', async ({ page }) => {
    await page.goto('http://localhost:3000/telemedicine');
    
    // Check main elements
    await expect(page.locator('h2')).toContainText('Telemedicine Hub');
    await expect(page.locator('text=Manage virtual consultations')).toBeVisible();
    
    // Check statistics
    await expect(page.locator('text=Today\'s Sessions')).toBeVisible();
    await expect(page.locator('text=Active Sessions')).toBeVisible();
    await expect(page.locator('text=Waiting Patients')).toBeVisible();
  });

  test('should test device functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/telemedicine');
    
    // Navigate to device testing tab
    await page.click('text=Device Testing');
    
    // Check device test elements
    await expect(page.locator('text=Camera Test')).toBeVisible();
    await expect(page.locator('text=Microphone Test')).toBeVisible();
    await expect(page.locator('text=Connection Test')).toBeVisible();
    
    // Test camera button (should show modal)
    await page.click('button:has-text("Test Camera")');
    // Note: Actual camera access would require user permission in real browser
  });
});

test.describe('Training Center', () => {
  test('should access training center', async ({ page }) => {
    await page.goto('http://localhost:3000/training');
    
    // Check main elements
    await expect(page.locator('h2')).toContainText('Training Center');
    await expect(page.locator('text=Master Ayphen Care')).toBeVisible();
    
    // Check tabs
    await expect(page.locator('text=Video Tutorials')).toBeVisible();
    await expect(page.locator('text=Resources')).toBeVisible();
    await expect(page.locator('text=Live Training')).toBeVisible();
  });

  test('should display training resources', async ({ page }) => {
    await page.goto('http://localhost:3000/training');
    
    // Click resources tab
    await page.click('text=Resources');
    
    // Check training materials
    await expect(page.locator('text=Training Materials')).toBeVisible();
    await expect(page.locator('text=Complete User Manual')).toBeVisible();
    await expect(page.locator('text=Quick Reference Guide')).toBeVisible();
  });
});

// Helper functions
async function fillHospitalInfo(page: Page) {
  await page.fill('input[name="name"]', testHospital.name);
  await page.fill('input[name="subdomain"]', testHospital.subdomain);
  await page.fill('textarea[name="description"]', testHospital.description);
}

async function fillAdminInfo(page: Page) {
  await page.fill('input[name="adminFirstName"]', testHospital.adminFirstName);
  await page.fill('input[name="adminLastName"]', testHospital.adminLastName);
  await page.fill('input[name="adminEmail"]', testHospital.adminEmail);
  await page.fill('input[name="adminPassword"]', testHospital.adminPassword);
  await page.fill('input[name="confirmPassword"]', testHospital.adminPassword);
}

async function selectPlan(page: Page) {
  // Select professional plan
  await page.selectOption('select[name="plan"]', testHospital.plan);
}

async function agreeToTerms(page: Page) {
  await page.check('input[name="agreeToTerms"]');
}

async function completeRegistration(page: Page) {
  await fillHospitalInfo(page);
  await page.click('button:has-text("Next")');
  await page.waitForSelector('text=Create Admin Account');
  
  await fillAdminInfo(page);
  await page.click('button:has-text("Next")');
  await page.waitForSelector('text=Choose your plan');
  
  await selectPlan(page);
  await agreeToTerms(page);
  await page.click('button:has-text("Create Organization")');
  
  await page.waitForSelector('text=Organization created successfully!', { timeout: 10000 });
}

async function loginAsAdmin(page: Page) {
  await page.fill('input[name="email"]', testHospital.adminEmail);
  await page.fill('input[name="password"]', testHospital.adminPassword);
  await page.click('button:has-text("Login")');
  await page.waitForURL(/\/dashboard/);
}
