import { test, expect, Page } from '@playwright/test';

test.describe('🔍 Debug Organization Creation Error', () => {
  
  test('Debug organization creation failure', async ({ page }) => {
    console.log('🔍 Debugging organization creation error...');
    
    // Monitor all network requests
    const requests: any[] = [];
    const responses: any[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/organizations')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log('📤 API Request:', request.method(), request.url());
        console.log('📤 Request Data:', request.postData());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/organizations')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log('📥 API Response:', response.status(), response.statusText());
      }
    });
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    // Navigate to signup page
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Signup page loaded');
    
    // Fill Step 1: Organization Info
    console.log('📋 Filling Step 1: Organization Info...');
    await page.fill('input[name="name"]', 'Debug Error Test Hospital');
    await page.fill('input[name="subdomain"]', 'debug-error-test');
    await page.fill('textarea[name="description"]', 'Testing error debugging');
    
    // Verify data was entered
    const nameValue = await page.locator('input[name="name"]').inputValue();
    const subdomainValue = await page.locator('input[name="subdomain"]').inputValue();
    console.log('✅ Step 1 data entered:', { name: nameValue, subdomain: subdomainValue });
    
    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Admin Account');
    console.log('✅ Moved to Step 2');
    
    // Fill Step 2: Admin Account
    console.log('📋 Filling Step 2: Admin Account...');
    await page.fill('input[name="adminFirstName"]', 'Debug');
    await page.fill('input[name="adminLastName"]', 'ErrorTest');
    await page.fill('input[name="adminEmail"]', 'debug@errortest.com');
    await page.fill('input[name="adminPassword"]', 'DebugError123!');
    await page.fill('input[name="confirmPassword"]', 'DebugError123!');
    
    // Verify admin data
    const emailValue = await page.locator('input[name="adminEmail"]').inputValue();
    console.log('✅ Step 2 data entered:', { email: emailValue });
    
    // Click Next
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Plan & Confirm');
    console.log('✅ Moved to Step 3');
    
    // Fill Step 3: Plan & Confirm
    console.log('📋 Filling Step 3: Plan & Confirm...');
    await page.selectOption('select[name="plan"]', 'professional');
    
    // Check terms
    await page.check('input[name="terms"]');
    const termsChecked = await page.locator('input[name="terms"]').isChecked();
    console.log('✅ Terms checked:', termsChecked);
    
    // Verify summary data
    const summaryVisible = await page.locator('text=Debug Error Test Hospital').isVisible();
    console.log('✅ Summary data visible:', summaryVisible);
    
    // Submit the form
    console.log('🚀 Submitting organization creation...');
    
    // Wait for API call
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/organizations') && response.request().method() === 'POST',
      { timeout: 10000 }
    );
    
    await page.click('button:has-text("Create Organization")');
    console.log('📤 Create Organization button clicked');
    
    try {
      const response = await responsePromise;
      const responseData = await response.json();
      
      console.log('📊 API Response Status:', response.status());
      console.log('📊 API Response Data:', JSON.stringify(responseData, null, 2));
      
      if (response.status() === 201 && responseData.success) {
        console.log('✅ Organization created successfully!');
        console.log('🏥 Organization ID:', responseData.data.organization.id);
        console.log('👤 Admin ID:', responseData.data.admin.id);
      } else {
        console.log('❌ Organization creation failed');
        console.log('❌ Error:', responseData.message);
      }
      
    } catch (error) {
      console.log('❌ No API response received or timeout');
      console.log('❌ Error:', error);
      
      // Check for error messages in UI
      const errorMessages = await page.locator('.ant-message-error').count();
      if (errorMessages > 0) {
        const errorText = await page.locator('.ant-message-error').textContent();
        console.log('❌ UI Error Message:', errorText);
      }
      
      // Check for any visible error text
      const failedText = await page.locator('text=Failed to create organization').isVisible();
      if (failedText) {
        console.log('❌ "Failed to create organization" message visible');
      }
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-organization-error.png', fullPage: true });
    
    // Log all captured requests and responses
    console.log('📋 Summary of API calls:');
    console.log('Requests:', requests.length);
    console.log('Responses:', responses.length);
    
    requests.forEach((req, index) => {
      console.log(`Request ${index + 1}:`, req.method, req.url);
      if (req.postData) {
        try {
          const data = JSON.parse(req.postData);
          console.log(`Request ${index + 1} Data:`, { ...data, adminPassword: '***' });
        } catch (e) {
          console.log(`Request ${index + 1} Data:`, req.postData);
        }
      }
    });
    
    responses.forEach((res, index) => {
      console.log(`Response ${index + 1}:`, res.status, res.statusText);
    });
  });
});
