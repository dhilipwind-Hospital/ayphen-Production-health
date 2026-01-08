import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
  });

  test('should successfully register a new user with valid data', async ({ page }) => {
    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;

    // Step 1: Fill Basic Info
    await test.step('Fill Basic Information', async () => {
      // Wait for form to be visible
      await expect(page.locator('text=Create Your Account')).toBeVisible();
      
      // Fill first name
      await page.fill('input[placeholder="First Name"]', 'John');
      
      // Fill last name
      await page.fill('input[placeholder="Last Name"]', 'Doe');
      
      // Fill email
      await page.fill('input[placeholder="Email"]', testEmail);
      
      // Fill phone
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      
      // Click Next button
      await page.click('button:has-text("Next")');
      
      // Wait for next step
      await page.waitForTimeout(500);
    });

    // Step 2: Fill Security Info
    await test.step('Fill Security Information', async () => {
      // Wait for security step to be visible
      await expect(page.locator('text=Security')).toBeVisible();
      
      // Fill password
      await page.fill('input[placeholder="Password"]', 'Chennai@123');
      
      // Fill confirm password
      await page.fill('input[placeholder="Confirm Password"]', 'Chennai@123');
      
      // Verify password strength indicator
      await expect(page.locator('text=Strong')).toBeVisible({ timeout: 2000 });
      
      // Click Next button
      await page.click('button:has-text("Next")');
      
      // Wait for next step
      await page.waitForTimeout(500);
    });

    // Step 3: Accept Terms and Create Account
    await test.step('Accept Terms and Create Account', async () => {
      // Wait for confirm step
      await expect(page.locator('text=Confirm')).toBeVisible();
      
      // Check Terms & Conditions checkbox
      await page.click('text=I agree to the Terms & Conditions');
      
      // Check Privacy Policy checkbox
      await page.click('text=I agree to the Privacy Policy');
      
      // Click Create Account button
      await page.click('button:has-text("Create Account")');
      
      // Wait for success message or redirect
      await page.waitForTimeout(2000);
      
      // Verify success (either success message or redirect to login/home)
      const currentUrl = page.url();
      const hasSuccessMessage = await page.locator('text=Registration successful').isVisible().catch(() => false);
      const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/home') || currentUrl.includes('/portal');
      
      expect(hasSuccessMessage || isRedirected).toBeTruthy();
    });

    console.log(`✅ Successfully registered user: ${testEmail}`);
  });

  test('should show validation errors for invalid password', async ({ page }) => {
    await test.step('Test weak password validation', async () => {
      // Fill basic info
      await page.fill('input[placeholder="First Name"]', 'Test');
      await page.fill('input[placeholder="Last Name"]', 'User');
      await page.fill('input[placeholder="Email"]', `test${Date.now()}@example.com`);
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      
      // Click Next
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      
      // Try weak password
      await page.fill('input[placeholder="Password"]', 'weak');
      
      // Should show error or weak indicator
      const hasError = await page.locator('text=Password must').isVisible({ timeout: 2000 }).catch(() => false);
      const hasWeakIndicator = await page.locator('text=Weak').isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasError || hasWeakIndicator).toBeTruthy();
    });
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await test.step('Test password mismatch validation', async () => {
      // Fill basic info
      await page.fill('input[placeholder="First Name"]', 'Test');
      await page.fill('input[placeholder="Last Name"]', 'User');
      await page.fill('input[placeholder="Email"]', `test${Date.now()}@example.com`);
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      
      // Click Next
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      
      // Fill mismatched passwords
      await page.fill('input[placeholder="Password"]', 'Chennai@123');
      await page.fill('input[placeholder="Confirm Password"]', 'Chennai@456');
      
      // Try to proceed
      await page.click('button:has-text("Next")');
      
      // Should show error
      await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 2000 });
    });
  });

  test('should show error for duplicate email', async ({ page }) => {
    await test.step('Test duplicate email validation', async () => {
      // Use existing email
      const existingEmail = 'automation.test@example.com';
      
      // Fill basic info
      await page.fill('input[placeholder="First Name"]', 'Duplicate');
      await page.fill('input[placeholder="Last Name"]', 'User');
      await page.fill('input[placeholder="Email"]', existingEmail);
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      
      // Click Next
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      
      // Fill password
      await page.fill('input[placeholder="Password"]', 'Chennai@123');
      await page.fill('input[placeholder="Confirm Password"]', 'Chennai@123');
      
      // Click Next
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      
      // Accept terms
      await page.click('text=I agree to the Terms & Conditions');
      await page.click('text=I agree to the Privacy Policy');
      
      // Try to create account
      await page.click('button:has-text("Create Account")');
      
      // Should show error
      await expect(page.locator('text=already exists')).toBeVisible({ timeout: 3000 });
    });
  });

  test('should navigate back and forth between steps', async ({ page }) => {
    await test.step('Test step navigation', async () => {
      // Fill basic info
      await page.fill('input[placeholder="First Name"]', 'Navigation');
      await page.fill('input[placeholder="Last Name"]', 'Test');
      await page.fill('input[placeholder="Email"]', `nav${Date.now()}@example.com`);
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      
      // Go to next step
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      
      // Verify we're on security step
      await expect(page.locator('text=Security')).toBeVisible();
      
      // Go back
      await page.click('button:has-text("Back")');
      await page.waitForTimeout(500);
      
      // Verify we're back on basic info
      await expect(page.locator('text=Basic Info')).toBeVisible();
      
      // Verify data is preserved
      const firstNameValue = await page.inputValue('input[placeholder="First Name"]');
      expect(firstNameValue).toBe('Navigation');
    });
  });

  test('should show password strength indicator', async ({ page }) => {
    await test.step('Test password strength feedback', async () => {
      // Navigate to security step
      await page.fill('input[placeholder="First Name"]', 'Strength');
      await page.fill('input[placeholder="Last Name"]', 'Test');
      await page.fill('input[placeholder="Email"]', `strength${Date.now()}@example.com`);
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);
      
      // Test weak password
      await page.fill('input[placeholder="Password"]', 'weak');
      await expect(page.locator('text=Weak')).toBeVisible({ timeout: 2000 });
      
      // Test medium password
      await page.fill('input[placeholder="Password"]', 'Medium123');
      await expect(page.locator('text=Medium')).toBeVisible({ timeout: 2000 });
      
      // Test strong password
      await page.fill('input[placeholder="Password"]', 'Chennai@123');
      await expect(page.locator('text=Strong')).toBeVisible({ timeout: 2000 });
    });
  });

  test('should require all mandatory fields', async ({ page }) => {
    await test.step('Test required field validation', async () => {
      // Try to proceed without filling anything
      await page.click('button:has-text("Next")');
      
      // Should show validation errors
      const hasError = await page.locator('.ant-form-item-explain-error').count();
      expect(hasError).toBeGreaterThan(0);
    });
  });

  test('should validate email format', async ({ page }) => {
    await test.step('Test email format validation', async () => {
      // Fill invalid email
      await page.fill('input[placeholder="First Name"]', 'Email');
      await page.fill('input[placeholder="Last Name"]', 'Test');
      await page.fill('input[placeholder="Email"]', 'invalid-email');
      await page.fill('input[placeholder="Phone Number"]', '9876543210');
      
      // Try to proceed
      await page.click('button:has-text("Next")');
      
      // Should show email validation error
      await expect(page.locator('text=valid email')).toBeVisible({ timeout: 2000 });
    });
  });
});
