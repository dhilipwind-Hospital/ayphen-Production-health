const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Hospital Management System - Simple UI Test');
  console.log('==============================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test 1: Check if homepage loads
    console.log('📍 Test 1: Loading homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Homepage loaded successfully');
    
    // Test 2: Navigate to login page
    console.log('📍 Test 2: Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('✅ Login page loaded - screenshot saved as login-page.png');
    
    // Test 3: Check for form elements (flexible selectors)
    console.log('📍 Test 3: Checking for login form elements...');
    
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), .ant-btn-primary').first();
    
    const emailExists = await emailInput.isVisible();
    const passwordExists = await passwordInput.isVisible();
    const buttonExists = await submitButton.isVisible();
    
    console.log(`✅ Email input found: ${emailExists}`);
    console.log(`✅ Password input found: ${passwordExists}`);
    console.log(`✅ Submit button found: ${buttonExists}`);
    
    if (emailExists && passwordExists && buttonExists) {
      // Test 4: Try doctor login
      console.log('📍 Test 4: Attempting doctor login...');
      
      await emailInput.fill('cardiology.consultant@example.com');
      await passwordInput.fill('doctor123');
      await submitButton.click();
      
      // Wait for navigation or error
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`✅ After login, current URL: ${currentUrl}`);
      
      // Check if we're redirected (not on login page anymore)
      if (!currentUrl.includes('/login')) {
        console.log('✅ Doctor login successful - redirected from login page');
        
        // Take screenshot of dashboard
        await page.screenshot({ path: 'doctor-dashboard.png' });
        console.log('✅ Doctor dashboard screenshot saved');
        
        // Test 5: Check for appointments
        console.log('📍 Test 5: Checking for appointments...');
        
        // Look for appointments table or navigation
        const appointmentsLink = await page.locator('a:has-text("Appointments"), text=Appointments, [href*="appointments"]').first();
        if (await appointmentsLink.isVisible()) {
          await appointmentsLink.click();
          await page.waitForTimeout(2000);
          
          // Check for patient names
          const rajaPatient = await page.locator('text=raja patient, text=raja').first();
          const arunPatient = await page.locator('text=arun bharati, text=arun').first();
          
          const rajaExists = await rajaPatient.isVisible();
          const arunExists = await arunPatient.isVisible();
          
          console.log(`✅ Raja patient found: ${rajaExists}`);
          console.log(`✅ Arun patient found: ${arunExists}`);
          
          if (rajaExists || arunExists) {
            console.log('🎉 SUCCESS: Real patient data is displaying correctly!');
            
            // Test 6: Try Write Prescription
            console.log('📍 Test 6: Testing Write Prescription...');
            const writePrescriptionBtn = await page.locator('button:has-text("Write Prescription"), a:has-text("Write Prescription")').first();
            
            if (await writePrescriptionBtn.isVisible()) {
              await writePrescriptionBtn.click();
              await page.waitForTimeout(3000);
              
              // Check if patient name is displayed correctly
              const patientUnknown = await page.locator('text=Patient Unknown').first();
              const unknownExists = await patientUnknown.isVisible();
              
              console.log(`✅ "Patient Unknown" found: ${unknownExists}`);
              
              if (!unknownExists) {
                console.log('🎉 SUCCESS: Patient name issue is FIXED!');
              } else {
                console.log('⚠️  Patient name still showing as "Unknown"');
              }
              
              await page.screenshot({ path: 'prescription-form.png' });
              console.log('✅ Prescription form screenshot saved');
            }
          }
        }
      } else {
        console.log('❌ Doctor login failed - still on login page');
        
        // Check for error messages
        const errorMsg = await page.locator('text=Invalid, text=Error, text=Failed, .ant-message-error').first();
        if (await errorMsg.isVisible()) {
          console.log('❌ Login error message displayed');
        }
      }
    } else {
      console.log('❌ Login form elements not found - UI structure might be different');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
})();
