const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Testing PharmacyDashboard Prescriptions Tab');
  console.log('==============================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => {
      console.log(`🖥️  Console: ${msg.text()}`);
    });
    
    // Login as pharmacist
    console.log('📍 Step 1: Pharmacist Login');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[data-testid="login-email-input"], input[type="email"]', 'pharmacist@example.com');
    await page.fill('[data-testid="login-password-input"], input[type="password"]', 'Pharmacist@123');
    await page.click('[data-testid="login-submit-button"], button[type="submit"]');
    
    // Wait for pharmacy dashboard
    await page.waitForTimeout(3000);
    console.log(`✅ Current URL: ${page.url()}`);
    
    // Look for all available tabs
    console.log('📍 Step 2: Finding Available Tabs');
    const allTabs = await page.locator('.ant-tabs-tab').allTextContents();
    console.log('📋 Available tabs:', allTabs);
    
    // Try different selectors for Prescriptions tab
    const prescriptionsSelectors = [
      '.ant-tabs-tab:has-text("Prescriptions")',
      '[data-node-key="prescriptions"]',
      'div:has-text("Prescriptions")',
      '.ant-tabs-tab-btn:has-text("Prescriptions")'
    ];
    
    let prescriptionsTabFound = false;
    for (const selector of prescriptionsSelectors) {
      const tab = page.locator(selector);
      if (await tab.isVisible()) {
        console.log(`✅ Found Prescriptions tab with selector: ${selector}`);
        await tab.click();
        prescriptionsTabFound = true;
        break;
      }
    }
    
    if (!prescriptionsTabFound) {
      console.log('❌ Prescriptions tab not found, trying to click by text content');
      // Try clicking by text content
      await page.click('text=Prescriptions');
    }
    
    await page.waitForTimeout(5000);
    
    // Take screenshot after clicking
    await page.screenshot({ path: 'pharmacy-dashboard-prescriptions.png' });
    console.log('✅ Screenshot saved: pharmacy-dashboard-prescriptions.png');
    
    // Check page content after clicking tab
    console.log('📍 Step 3: Checking for Real Patient Data');
    const pageContent = await page.content();
    
    const hasRaja = pageContent.includes('raja');
    const hasArun = pageContent.includes('arun');
    const hasAliceJohnson = pageContent.includes('Alice Johnson');
    const hasRobertBrown = pageContent.includes('Robert Brown');
    const hasPendingTab = pageContent.includes('Pending');
    const hasPatientArun = pageContent.includes('Patient Arun');
    
    console.log(`✅ Contains "raja": ${hasRaja}`);
    console.log(`✅ Contains "arun": ${hasArun}`);
    console.log(`✅ Contains "Patient Arun": ${hasPatientArun}`);
    console.log(`⚠️  Contains "Alice Johnson" (mock data): ${hasAliceJohnson}`);
    console.log(`⚠️  Contains "Robert Brown" (mock data): ${hasRobertBrown}`);
    console.log(`✅ Has Pending tab: ${hasPendingTab}`);
    
    // Check if we can see any table data
    const tableRows = await page.locator('table tr').count();
    console.log(`📊 Table rows found: ${tableRows}`);
    
    // Check for specific table content
    if (tableRows > 1) {
      const tableContent = await page.locator('table').textContent();
      console.log('📋 Table content preview:', tableContent.substring(0, 200) + '...');
    }
    
    if (hasRaja || hasArun || hasPatientArun) {
      console.log('🎉 SUCCESS: Real patient data is displaying!');
    } else if (hasAliceJohnson || hasRobertBrown) {
      console.log('⚠️  PARTIAL: Still showing some mock data');
    } else {
      console.log('❌ ISSUE: No patient data found at all');
      console.log('💡 Check if the prescriptions component is loading correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
})();
