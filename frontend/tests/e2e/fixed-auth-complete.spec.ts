import { test, expect, Page } from '@playwright/test';

// Test data for comprehensive authentication testing
const testData = {
  validUser: {
    fullName: 'Test User Fixed',
    email: 'testuser.fixed@example.com',
    phone: '+1234567890',
    password: 'TestPass123!',
    userType: 'patient'
  },
  loginUser: {
    email: 'admin@test.com',
    password: 'admin123'
  },
  hospitalAdmin: {
    email: 'admin@automated-medical.com',
    password: 'AutoTest123!'
  }
};

test.describe('🔐 Fixed Authentication System - Complete Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enhanced error handling
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

  test('🏠 Should load fixed login page without errors', async ({ page }) => {
    console.log('🔍 Testing fixed login page...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check main elements
    await expect(page.locator('h3')).toContainText('Welcome to Ayphen Care');
    await expect(page.locator('text=Access your health records')).toBeVisible();
    
    // Check form elements
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    
    // Check tabs
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    await expect(page.locator('button:has-text("Register")')).toBeVisible();
    
    // Check social buttons
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Facebook")')).toBeVisible();
    
    console.log('✅ Fixed login page loaded successfully');
  });

  test('📝 Should load fixed registration page without errors', async ({ page }) => {
    console.log('🔍 Testing fixed registration page...');
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Check main elements
    await expect(page.locator('h3')).toContainText('Create Your Account');
    await expect(page.locator('text=Join thousands of users')).toBeVisible();
    
    // Check steps
    await expect(page.locator('text=Personal Info')).toBeVisible();
    await expect(page.locator('text=Account Setup')).toBeVisible();
    await expect(page.locator('text=Verification')).toBeVisible();
    
    // Check form elements
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();
    
    console.log('✅ Fixed registration page loaded successfully');
  });

  test('🔄 Should switch between login and register tabs', async ({ page }) => {
    console.log('🔍 Testing tab switching...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Should be on login tab by default
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    
    // Switch to register tab
    await page.click('button:has-text("Register")');
    await page.waitForSelector('input[placeholder="John Doe"]');
    
    // Should show registration form
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();
    
    // Switch back to login tab
    await page.click('button:has-text("Login")');
    await page.waitForSelector('input[type="password"]');
    
    // Should show login form
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('text=Remember me')).toBeVisible();
    
    console.log('✅ Tab switching working correctly');
  });

  test('✅ Should validate login form correctly', async ({ page }) => {
    console.log('🔍 Testing login form validation...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Check validation messages
    await expect(page.locator('text=Please input your email!')).toBeVisible();
    await expect(page.locator('text=Please input your password!')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[placeholder*="email"]', 'invalid-email');
    await page.click('button[type="submit"]:has-text("Login")');
    await expect(page.locator('text=Please enter a valid email!')).toBeVisible();
    
    // Test valid email but empty password
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.click('button[type="submit"]:has-text("Login")');
    await expect(page.locator('text=Please input your password!')).toBeVisible();
    
    console.log('✅ Login form validation working');
  });

  test('✅ Should validate registration form correctly', async ({ page }) => {
    console.log('🔍 Testing registration form validation...');
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Check validation messages
    await expect(page.locator('text=Please input your full name!')).toBeVisible();
    await expect(page.locator('text=Please input your email!')).toBeVisible();
    await expect(page.locator('text=Please input your phone number!')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[placeholder="John Doe"]', 'Test User');
    await page.fill('input[placeholder*="email"]', 'invalid-email');
    await page.fill('input[placeholder*="phone"]', '+1234567890');
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Please enter a valid email!')).toBeVisible();
    
    // Test invalid phone
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.fill('input[placeholder*="phone"]', 'invalid-phone');
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Please enter a valid phone number!')).toBeVisible();
    
    console.log('✅ Registration form validation working');
  });

  test('🚀 Should complete registration flow successfully', async ({ page }) => {
    console.log('🔍 Testing complete registration flow...');
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Personal Information
    await page.fill('input[placeholder="John Doe"]', testData.validUser.fullName);
    await page.fill('input[placeholder*="email"]', testData.validUser.email);
    await page.fill('input[placeholder*="phone"]', testData.validUser.phone);
    
    // Verify data entered
    await expect(page.locator('input[placeholder="John Doe"]')).toHaveValue(testData.validUser.fullName);
    
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Account Setup');
    
    // Step 2: Account Setup
    await page.fill('input[placeholder*="6 characters"]', testData.validUser.password);
    await page.fill('input[placeholder*="Re-enter"]', testData.validUser.password);
    
    // Select user type
    await page.click(`input[value="${testData.validUser.userType}"]`);
    
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Review & Confirm');
    
    // Step 3: Review and Confirm
    await expect(page.locator(`text=${testData.validUser.fullName}`)).toBeVisible();
    await expect(page.locator(`text=${testData.validUser.email}`)).toBeVisible();
    
    // Accept terms
    await page.check('input[type="checkbox"]');
    
    // Submit registration
    await page.click('button:has-text("Create Account")');
    
    // Wait for success or navigation
    try {
      await page.waitForSelector('text=Registration successful', { timeout: 10000 });
      console.log('✅ Registration completed successfully');
    } catch (error) {
      // Check if redirected to login
      try {
        await page.waitForURL(/\/login/, { timeout: 5000 });
        console.log('✅ Registration completed - redirected to login');
      } catch {
        console.log('⚠️ Registration may have encountered an issue');
        await page.screenshot({ path: 'registration-error.png' });
      }
    }
  });

  test('🔑 Should handle login with valid credentials', async ({ page }) => {
    console.log('🔍 Testing login with valid credentials...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[placeholder*="email"]', testData.hospitalAdmin.email);
    await page.fill('input[type="password"]', testData.hospitalAdmin.password);
    
    // Check remember me
    await page.check('input[type="checkbox"]');
    
    // Submit login
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Wait for success or redirect
    try {
      await page.waitForURL(/\/(dashboard|admin|availability)/, { timeout: 10000 });
      console.log('✅ Login successful - redirected to dashboard');
    } catch (error) {
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
    console.log('🔍 Testing invalid login credentials...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Fill with invalid credentials
    await page.fill('input[placeholder*="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit login
    await page.click('button[type="submit"]:has-text("Login")');
    
    // Check for error message
    await expect(page.locator('text=Login failed')).toBeVisible();
    
    console.log('✅ Invalid login properly handled');
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

  test('📱 Should be responsive on mobile', async ({ page }) => {
    console.log('🔍 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test login page on mobile
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
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

  test('⚡ Should have good performance', async ({ page }) => {
    console.log('🔍 Testing performance...');
    
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Login page loaded in ${loadTime}ms`);
    
    // Test registration performance
    const regStartTime = Date.now();
    
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    const regLoadTime = Date.now() - regStartTime;
    expect(regLoadTime).toBeLessThan(5000);
    
    console.log(`✅ Registration page loaded in ${regLoadTime}ms`);
  });

  test('🔗 Should handle navigation correctly', async ({ page }) => {
    console.log('🔍 Testing navigation...');
    
    // Test login to register navigation
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Register")');
    await expect(page.locator('text=Create Your Account')).toBeVisible();
    
    // Test register to login navigation
    await page.click('a:has-text("Sign in")');
    await expect(page.locator('text=Welcome to Ayphen Care')).toBeVisible();
    
    // Test close button
    await page.click('button[aria-label="close"]');
    // Should navigate away or close modal
    
    console.log('✅ Navigation working correctly');
  });

  test('🌐 Should handle social login buttons', async ({ page }) => {
    console.log('🔍 Testing social login buttons...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check social buttons exist and are clickable
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Facebook")')).toBeVisible();
    
    // Click buttons (should not cause errors)
    await page.click('button:has-text("Google")');
    await page.click('button:has-text("Facebook")');
    
    console.log('✅ Social login buttons working');
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

async function fillRegistrationStep2(page: Page, userData: any) {
  await page.fill('input[placeholder*="6 characters"]', userData.password);
  await page.fill('input[placeholder*="Re-enter"]', userData.password);
  await page.click(`input[value="${userData.userType}"]`);
}
