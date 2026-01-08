const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Testing Pharmacy Real Data Fix');
  console.log('=================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
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
    
    // Navigate to prescriptions
    console.log('📍 Step 2: Navigate to Prescriptions');
    await page.goto('http://localhost:3000/pharmacy/prescriptions');
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'pharmacy-prescriptions-real-data.png' });
    console.log('✅ Screenshot saved: pharmacy-prescriptions-real-data.png');
    
    // Check page content
    console.log('📍 Step 3: Checking for Real Patient Data');
    const pageContent = await page.content();
    
    const hasRaja = pageContent.includes('raja');
    const hasArun = pageContent.includes('arun');
    const hasAliceJohnson = pageContent.includes('Alice Johnson');
    const hasRobertBrown = pageContent.includes('Robert Brown');
    
    console.log(`✅ Contains "raja": ${hasRaja}`);
    console.log(`✅ Contains "arun": ${hasArun}`);
    console.log(`⚠️  Contains "Alice Johnson" (mock data): ${hasAliceJohnson}`);
    console.log(`⚠️  Contains "Robert Brown" (mock data): ${hasRobertBrown}`);
    
    // Check console for API calls
    console.log('📍 Step 4: Checking Console Logs');
    page.on('console', msg => {
      if (msg.text().includes('Real prescriptions loaded')) {
        console.log(`🎉 SUCCESS: ${msg.text()}`);
      }
    });
    
    // Refresh page to trigger API call
    await page.reload();
    await page.waitForTimeout(3000);
    
    if (hasRaja && hasArun && !hasAliceJohnson) {
      console.log('🎉 SUCCESS: Real patient data is now displaying!');
      console.log('✅ raja patient and arun bharati prescriptions are visible');
      console.log('✅ Mock data (Alice Johnson, Robert Brown) is no longer showing');
    } else if (hasRaja || hasArun) {
      console.log('⚠️  PARTIAL SUCCESS: Some real data showing, but may need refresh');
    } else {
      console.log('❌ ISSUE: Still showing mock data instead of real prescriptions');
      console.log('💡 Try refreshing the page or check browser console for errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
})();
