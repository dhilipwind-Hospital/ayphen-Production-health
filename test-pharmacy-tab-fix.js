const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Testing Pharmacy Prescriptions Tab');
  console.log('====================================');
  
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
    
    // Click on Prescriptions tab specifically
    console.log('📍 Step 2: Click Prescriptions Tab');
    const prescriptionsTab = page.locator('text=Prescriptions, .ant-tabs-tab:has-text("Prescriptions")');
    if (await prescriptionsTab.isVisible()) {
      await prescriptionsTab.click();
      console.log('✅ Clicked Prescriptions tab');
    } else {
      console.log('❌ Prescriptions tab not found');
    }
    
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'pharmacy-prescriptions-tab.png' });
    console.log('✅ Screenshot saved: pharmacy-prescriptions-tab.png');
    
    // Check page content after clicking tab
    console.log('📍 Step 3: Checking for Real Patient Data');
    const pageContent = await page.content();
    
    const hasRaja = pageContent.includes('raja');
    const hasArun = pageContent.includes('arun');
    const hasAliceJohnson = pageContent.includes('Alice Johnson');
    const hasRobertBrown = pageContent.includes('Robert Brown');
    const hasPendingTab = pageContent.includes('Pending');
    
    console.log(`✅ Contains "raja": ${hasRaja}`);
    console.log(`✅ Contains "arun": ${hasArun}`);
    console.log(`⚠️  Contains "Alice Johnson" (mock data): ${hasAliceJohnson}`);
    console.log(`⚠️  Contains "Robert Brown" (mock data): ${hasRobertBrown}`);
    console.log(`✅ Has Pending tab: ${hasPendingTab}`);
    
    // Check if we can see any table data
    const tableRows = await page.locator('table tr').count();
    console.log(`📊 Table rows found: ${tableRows}`);
    
    // Try to click on Pending tab if it exists
    const pendingTab = page.locator('text=Pending, .ant-tabs-tab:has-text("Pending")');
    if (await pendingTab.isVisible()) {
      console.log('📍 Step 4: Click Pending Tab');
      await pendingTab.click();
      await page.waitForTimeout(3000);
      
      const updatedContent = await page.content();
      const updatedHasRaja = updatedContent.includes('raja');
      const updatedHasArun = updatedContent.includes('arun');
      
      console.log(`✅ After Pending tab - Contains "raja": ${updatedHasRaja}`);
      console.log(`✅ After Pending tab - Contains "arun": ${updatedHasArun}`);
    }
    
    if (hasRaja && hasArun) {
      console.log('🎉 SUCCESS: Real patient data is now displaying!');
    } else {
      console.log('❌ ISSUE: Still not showing real patient data');
      console.log('💡 Check browser console for API errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
})();
