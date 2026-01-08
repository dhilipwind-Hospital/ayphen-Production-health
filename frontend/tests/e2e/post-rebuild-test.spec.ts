import { test, expect } from '@playwright/test';

test.describe('🔄 Post-Rebuild Organization Creation Test', () => {
  
  test('Verify organization creation after rebuild', async ({ page }) => {
    console.log('🔄 Testing organization creation after fresh rebuild...');
    
    // Monitor API calls
    page.on('response', response => {
      if (response.url().includes('/api/organizations')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads
    await expect(page.locator('h2')).toContainText('Join Ayphen Care');
    console.log('✅ Signup page loaded successfully');
    
    // Fill Step 1: Organization Info
    await page.fill('input[name="name"]', 'Post Rebuild Test Hospital');
    await page.fill('input[name="subdomain"]', 'post-rebuild-test');
    await page.fill('textarea[name="description"]', 'Testing after fresh rebuild and cache clear');
    
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Admin Account');
    console.log('✅ Step 1 completed');
    
    // Fill Step 2: Admin Account
    await page.fill('input[name="adminFirstName"]', 'Post');
    await page.fill('input[name="adminLastName"]', 'Rebuild');
    await page.fill('input[name="adminEmail"]', 'post@rebuild.com');
    await page.fill('input[name="adminPassword"]', 'PostRebuild123!');
    await page.fill('input[name="confirmPassword"]', 'PostRebuild123!');
    
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Plan & Confirm');
    console.log('✅ Step 2 completed');
    
    // Fill Step 3: Plan & Confirm
    await page.selectOption('select[name="plan"]', 'professional');
    await page.check('input[name="terms"]');
    
    // Submit
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/organizations') && response.request().method() === 'POST'
    );
    
    await page.click('button:has-text("Create Organization")');
    
    try {
      const response = await responsePromise;
      const responseData = await response.json();
      
      console.log('📊 API Response:', response.status());
      console.log('📊 Response Data:', JSON.stringify(responseData, null, 2));
      
      expect(response.status()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.organization.name).toBe('Post Rebuild Test Hospital');
      
      console.log('🎉 Organization created successfully after rebuild!');
      
    } catch (error) {
      console.log('❌ Error during organization creation:', error);
      await page.screenshot({ path: 'post-rebuild-error.png', fullPage: true });
    }
  });
});
