import { test, expect } from '@playwright/test';

test.describe('Register Single User', () => {
  
  test('should register a new user successfully', async ({ page }) => {
    // Generate unique email
    const timestamp = Date.now();
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `testuser${timestamp}@example.com`,
      phone: '9876543210',
      password: 'Dhilip@123'
    };

    console.log('🚀 Starting registration test...');
    console.log('📧 Email:', testUser.email);

    // Navigate to registration page
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to registration page');

    // Wait for form to be visible
    await expect(page.locator('text=Create Your Account')).toBeVisible({ timeout: 10000 });
    console.log('✅ Registration form loaded');

    // Step 1: Fill Basic Info
    console.log('📝 Step 1: Filling basic information...');
    
    // Wait for first input to be ready
    await page.waitForSelector('input[placeholder="First Name"]', { state: 'visible' });
    
    // Fill first name
    await page.locator('input[placeholder="First Name"]').fill(testUser.firstName);
    await page.waitForTimeout(300);
    console.log('  ✓ First name filled');
    
    // Fill last name
    await page.locator('input[placeholder="Last Name"]').fill(testUser.lastName);
    await page.waitForTimeout(300);
    console.log('  ✓ Last name filled');
    
    // Fill email
    await page.locator('input[placeholder="Email Address"]').fill(testUser.email);
    await page.waitForTimeout(300);
    console.log('  ✓ Email filled');
    
    // Fill phone
    await page.locator('input[placeholder="Phone Number"]').fill(testUser.phone);
    await page.waitForTimeout(300);
    console.log('  ✓ Phone filled');
    
    // Click Next button
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 1 completed - moved to Security step');

    // Step 2: Fill Security Info
    console.log('🔒 Step 2: Filling security information...');
    
    await expect(page.locator('text=Security')).toBeVisible();
    
    await page.fill('input[placeholder="Password"]', testUser.password);
    console.log('  ✓ Password filled');
    
    await page.fill('input[placeholder="Confirm Password"]', testUser.password);
    console.log('  ✓ Confirm password filled');
    
    // Wait for password strength indicator
    await page.waitForTimeout(500);
    
    // Click Next button
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);
    console.log('✅ Step 2 completed - moved to Confirm step');

    // Step 3: Accept Terms and Create Account
    console.log('✅ Step 3: Accepting terms and creating account...');
    
    await expect(page.locator('text=Confirm')).toBeVisible();
    
    // Check Terms & Conditions
    await page.click('text=I agree to the Terms & Conditions');
    console.log('  ✓ Terms & Conditions accepted');
    
    // Check Privacy Policy
    await page.click('text=I agree to the Privacy Policy');
    console.log('  ✓ Privacy Policy accepted');
    
    // Click Create Account button
    await page.click('button:has-text("Create Account")');
    console.log('  ⏳ Submitting registration...');
    
    // Wait for response (success or error)
    await page.waitForTimeout(3000);
    
    // Check for success (either message or redirect)
    const currentUrl = page.url();
    const hasSuccessMessage = await page.locator('text=Registration successful').isVisible().catch(() => false);
    const isRedirected = currentUrl.includes('/login') || currentUrl.includes('/home');
    
    if (hasSuccessMessage || isRedirected) {
      console.log('✅ Registration successful!');
      console.log('📧 User created:', testUser.email);
      console.log('🔗 Current URL:', currentUrl);
    } else {
      // Check for error message
      const errorVisible = await page.locator('.ant-message-error').isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await page.locator('.ant-message-error').textContent();
        console.log('❌ Registration failed:', errorText);
      }
    }
    
    expect(hasSuccessMessage || isRedirected).toBeTruthy();
    
    console.log('🎉 Test completed successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('   Name:', `${testUser.firstName} ${testUser.lastName}`);
  });

});
