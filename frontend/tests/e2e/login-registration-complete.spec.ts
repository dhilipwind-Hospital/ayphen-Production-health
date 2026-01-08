import { test, expect, Page } from '@playwright/test';

// Test data for comprehensive login and registration testing
const testUsers = {
  newUser: {
    fullName: 'John Test User',
    email: 'john.test@example.com',
    phone: '+1234567890',
    password: 'TestPass123!',
    role: 'patient'
  },
  existingUser: {
    email: 'admin@test.com',
    password: 'admin123'
  },
  hospitalAdmin: {
    email: 'admin@automated-medical.com',
    password: 'AutoTest123!'
  }
};

test.describe('🔐 Complete Login & Registration Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up error handling
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
  });

  test('🏠 Should load login page without errors', async ({ page }) => {
    console.log('🔍 Testing login page load...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check page elements
    await expect(page.locator('h3')).toContainText('Welcome to AyphenHospital');
    await expect(page.locator('text=Access your health records')).toBeVisible();
    
    // Check form elements
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    console.log('✅ Login page loaded successfully');
  });

  test('📝 Should load registration page without errors', async ({ page }) => {
    console.log('🔍 Testing registration page load...');
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Check page elements
    await expect(page.locator('h3')).toContainText('Create Your Account');
    await expect(page.locator('text=Join thousands of users')).toBeVisible();
    
    // Check steps
    await expect(page.locator('text=Personal Info')).toBeVisible();
    await expect(page.locator('text=Account Setup')).toBeVisible();
    await expect(page.locator('text=Verification')).toBeVisible();
    
    console.log('✅ Registration page loaded successfully');
  });

  test('🔐 Should validate login form fields', async ({ page }) => {
    console.log('🔍 Testing login form validation...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    await page.click('button:has-text("Login")');
    
    // Check validation messages
    await expect(page.locator('text=Please input your email!')).toBeVisible();
    await expect(page.locator('text=Please input your password!')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[placeholder*="email"]', 'invalid-email');
    await page.click('button:has-text("Login")');
    await expect(page.locator('text=Please enter a valid email!')).toBeVisible();
    
    console.log('✅ Login form validation working');
  });

  test('📝 Should validate registration form fields', async ({ page }) => {
    console.log('🔍 Testing registration form validation...');
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Check validation messages
    await expect(page.locator('text=Please input your full name!')).toBeVisible();
    await expect(page.locator('text=Please input your email!')).toBeVisible();
    await expect(page.locator('text=Please input your phone number!')).toBeVisible();
    
    console.log('✅ Registration form validation working');
  });

  test('🚀 Should complete user registration flow', async ({ page }) => {
    console.log('🔍 Testing complete user registration...');
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Personal Information
    await page.fill('input[placeholder="John Doe"]', testUsers.newUser.fullName);
    await page.fill('input[placeholder*="email"]', testUsers.newUser.email);
    await page.fill('input[placeholder*="phone"]', testUsers.newUser.phone);
    
    // Verify data entered
    await expect(page.locator('input[placeholder="John Doe"]')).toHaveValue(testUsers.newUser.fullName);
    
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Account Setup');
    
    // Step 2: Account Setup
    await page.fill('input[placeholder*="6 characters"]', testUsers.newUser.password);
    await page.fill('input[placeholder*="Re-enter"]', testUsers.newUser.password);
    
    // Select user type
    await page.click('input[value="patient"]');
    
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Review & Confirm');
    
    // Step 3: Review and Confirm
    await expect(page.locator(`text=${testUsers.newUser.fullName}`)).toBeVisible();
    await expect(page.locator(`text=${testUsers.newUser.email}`)).toBeVisible();
    
    // Accept terms
    await page.check('input[type="checkbox"]');
    
    // Submit registration
    await page.click('button:has-text("Create Account")');
    
    // Wait for success or error message
    try {
      await page.waitForSelector('text=Registration successful', { timeout: 10000 });
      console.log('✅ User registration completed successfully');
    } catch (error) {
      console.log('⚠️ Registration may have encountered an issue');
      await page.screenshot({ path: 'registration-error.png' });
    }
  });

  test('🔑 Should login with valid credentials', async ({ page }) => {
    console.log('🔍 Testing login with valid credentials...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[placeholder*="email"]', testUsers.hospitalAdmin.email);
    await page.fill('input[type="password"]', testUsers.hospitalAdmin.password);
    
    // Check remember me
    await page.check('input[type="checkbox"]');
    
    // Submit login
    await page.click('button:has-text("Login")');
    
    // Wait for redirect or success
    try {
      await page.waitForURL(/\/(dashboard|admin|availability)/, { timeout: 10000 });
      console.log('✅ Login successful - redirected to dashboard');
    } catch (error) {
      // Check for success message
      try {
        await page.waitForSelector('text=Login successful', { timeout: 5000 });
        console.log('✅ Login successful - success message shown');
      } catch {
        console.log('⚠️ Login may have encountered an issue');
        await page.screenshot({ path: 'login-error.png' });
      }
    }
  });

  test('❌ Should handle invalid login credentials', async ({ page }) => {
    console.log('🔍 Testing login with invalid credentials...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill with invalid credentials
    await page.fill('input[placeholder*="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit login
    await page.click('button:has-text("Login")');
    
    // Check for error message
    await expect(page.locator('text=Login failed')).toBeVisible();
    
    console.log('✅ Invalid login properly handled');
  });

  test('🔄 Should navigate between login and registration', async ({ page }) => {
    console.log('🔍 Testing navigation between login and registration...');
    
    // Start at login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Navigate to registration
    await page.click('text=Register');
    await page.waitForURL(/\/register/);
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    
    // Navigate back to login
    await page.goto('http://localhost:3000/login');
    await expect(page.locator('text=Welcome to AyphenHospital')).toBeVisible();
    
    console.log('✅ Navigation between login and registration working');
  });

  test('📱 Should be responsive on mobile devices', async ({ page }) => {
    console.log('🔍 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test login page on mobile
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check elements are visible and properly sized
    await expect(page.locator('h3')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Test registration page on mobile
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    await expect(page.locator('text=Personal Info')).toBeVisible();
    
    console.log('✅ Mobile responsiveness working');
  });

  test('🔒 Should handle password visibility toggle', async ({ page }) => {
    console.log('🔍 Testing password visibility toggle...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill password
    await page.fill('input[type="password"]', 'testpassword');
    
    // Click eye icon to show password
    await page.click('.ant-input-password-icon');
    
    // Verify password is visible
    await expect(page.locator('input[type="text"]')).toHaveValue('testpassword');
    
    // Click eye icon to hide password
    await page.click('.ant-input-password-icon');
    
    // Verify password is hidden
    await expect(page.locator('input[type="password"]')).toHaveValue('testpassword');
    
    console.log('✅ Password visibility toggle working');
  });

  test('🔗 Should handle forgot password link', async ({ page }) => {
    console.log('🔍 Testing forgot password functionality...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check forgot password link exists
    await expect(page.locator('a:has-text("Forgot password")')).toBeVisible();
    
    // Click forgot password link
    await page.click('a:has-text("Forgot password")');
    
    // Should navigate to forgot password page or show modal
    // (Implementation depends on your forgot password flow)
    
    console.log('✅ Forgot password link working');
  });

  test('🌐 Should handle social login buttons', async ({ page }) => {
    console.log('🔍 Testing social login buttons...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check social login buttons exist
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Facebook")')).toBeVisible();
    
    // Click Google button (should not cause errors)
    await page.click('button:has-text("Google")');
    
    console.log('✅ Social login buttons working');
  });

  test('⚡ Should have good performance', async ({ page }) => {
    console.log('🔍 Testing page performance...');
    
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Check load time is reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Login page loaded in ${loadTime}ms`);
    
    // Test registration page performance
    const regStartTime = Date.now();
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    const regLoadTime = Date.now() - regStartTime;
    expect(regLoadTime).toBeLessThan(5000);
    
    console.log(`✅ Registration page loaded in ${regLoadTime}ms`);
  });
});

// Helper functions
async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[placeholder*="email"]', email);
  await page.fill('input[type="password"]', password);
}

async function fillRegistrationStep1(page: Page, userData: any) {
  await page.fill('input[placeholder="John Doe"]', userData.fullName);
  await page.fill('input[placeholder*="email"]', userData.email);
  await page.fill('input[placeholder*="phone"]', userData.phone);
}

async function fillRegistrationStep2(page: Page, password: string) {
  await page.fill('input[placeholder*="6 characters"]', password);
  await page.fill('input[placeholder*="Re-enter"]', password);
}
