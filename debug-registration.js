const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging Registration Page');
  console.log('==============================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'registration-page-debug.png' });
    console.log('✅ Screenshot saved: registration-page-debug.png');
    
    // Check what's on the page
    const pageContent = await page.content();
    console.log('📄 Page title:', await page.title());
    console.log('🔗 Current URL:', page.url());
    
    // Look for form elements
    const hasFirstName = await page.locator('input[name="firstName"]').isVisible();
    const hasLastName = await page.locator('input[name="lastName"]').isVisible();
    const hasEmail = await page.locator('input[name="email"]').isVisible();
    const hasPhone = await page.locator('input[name="phone"]').isVisible();
    const hasPassword = await page.locator('input[name="password"]').isVisible();
    const hasSubmitButton = await page.locator('button[type="submit"]').isVisible();
    
    console.log('\n📋 Form Elements Check:');
    console.log(`✅ First Name field: ${hasFirstName}`);
    console.log(`✅ Last Name field: ${hasLastName}`);
    console.log(`✅ Email field: ${hasEmail}`);
    console.log(`✅ Phone field: ${hasPhone}`);
    console.log(`✅ Password field: ${hasPassword}`);
    console.log(`✅ Submit button: ${hasSubmitButton}`);
    
    // Check for any input fields at all
    const allInputs = await page.locator('input').count();
    const allButtons = await page.locator('button').count();
    console.log(`📊 Total input fields: ${allInputs}`);
    console.log(`📊 Total buttons: ${allButtons}`);
    
    // Check for error messages or loading states
    const hasError = pageContent.includes('error') || pageContent.includes('Error');
    const hasLoading = pageContent.includes('loading') || pageContent.includes('Loading');
    console.log(`⚠️  Has error: ${hasError}`);
    console.log(`⏳ Has loading: ${hasLoading}`);
    
    // Try alternative selectors
    const altInputs = await page.locator('input[placeholder*="First"], input[placeholder*="Name"]').count();
    console.log(`🔍 Alternative name inputs found: ${altInputs}`);
    
    if (allInputs === 0) {
      console.log('❌ No input fields found - registration form may not be loading');
      console.log('💡 This could be a routing issue or component loading problem');
    } else if (!hasFirstName) {
      console.log('⚠️  Input fields exist but with different names/structure');
      
      // Get all input attributes
      const inputs = await page.locator('input').all();
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        console.log(`   Input ${i + 1}: name="${name}" placeholder="${placeholder}" type="${type}"`);
      }
    }
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Registration debug completed');
  }
})();
