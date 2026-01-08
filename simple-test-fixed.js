const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Hospital Management System - Simple UI Test (Fixed)');
  console.log('====================================================');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test 1: Doctor login
    console.log('📍 Test 1: Doctor login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'cardiology.consultant@example.com');
    await page.fill('input[type="password"]', 'doctor123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`✅ After login, current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/login')) {
      console.log('✅ Doctor login successful!');
      
      // Test 2: Navigate to appointments
      console.log('📍 Test 2: Navigating to appointments...');
      await page.goto('http://localhost:3000/appointments');
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'appointments-page.png' });
      console.log('✅ Appointments page screenshot saved');
      
      // Test 3: Check for patient names
      console.log('📍 Test 3: Checking for patient names...');
      
      const pageContent = await page.content();
      const hasRaja = pageContent.includes('raja');
      const hasArun = pageContent.includes('arun');
      
      console.log(`✅ Page contains "raja": ${hasRaja}`);
      console.log(`✅ Page contains "arun": ${hasArun}`);
      
      if (hasRaja || hasArun) {
        console.log('🎉 SUCCESS: Real patient data found!');
        
        // Test 4: Try Write Prescription
        console.log('📍 Test 4: Testing Write Prescription button...');
        
        const writePrescriptionButtons = await page.locator('text=Write Prescription').count();
        console.log(`✅ Write Prescription buttons found: ${writePrescriptionButtons}`);
        
        if (writePrescriptionButtons > 0) {
          await page.locator('text=Write Prescription').first().click();
          await page.waitForTimeout(4000);
          
          const prescriptionUrl = page.url();
          console.log(`✅ Prescription page URL: ${prescriptionUrl}`);
          
          // Take screenshot of prescription form
          await page.screenshot({ path: 'prescription-form.png' });
          console.log('✅ Prescription form screenshot saved');
          
          // Test 5: Check patient name in prescription form
          console.log('📍 Test 5: Checking patient name in prescription form...');
          
          const prescriptionContent = await page.content();
          const hasPatientUnknown = prescriptionContent.includes('Patient Unknown');
          const hasRajaInForm = prescriptionContent.includes('raja');
          const hasArunInForm = prescriptionContent.includes('arun');
          
          console.log(`✅ Form contains "Patient Unknown": ${hasPatientUnknown}`);
          console.log(`✅ Form contains "raja": ${hasRajaInForm}`);
          console.log(`✅ Form contains "arun": ${hasArunInForm}`);
          
          if (!hasPatientUnknown && (hasRajaInForm || hasArunInForm)) {
            console.log('🎉 SUCCESS: Patient name fix is working! No more "Patient Unknown"');
          } else if (hasPatientUnknown) {
            console.log('⚠️  Issue: Still showing "Patient Unknown"');
          } else {
            console.log('ℹ️  Patient name status unclear - check screenshots');
          }
        }
      } else {
        console.log('⚠️  No patient data found - might need to check database');
      }
      
      // Test 6: Test Pharmacy workflow
      console.log('📍 Test 6: Testing Pharmacy login...');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[type="email"]', 'pharmacist@example.com');
      await page.fill('input[type="password"]', 'Pharmacist@123');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(3000);
      const pharmacyUrl = page.url();
      console.log(`✅ Pharmacy dashboard URL: ${pharmacyUrl}`);
      
      if (pharmacyUrl.includes('/pharmacy')) {
        console.log('✅ Pharmacy login successful!');
        await page.screenshot({ path: 'pharmacy-dashboard.png' });
        console.log('✅ Pharmacy dashboard screenshot saved');
      }
      
      // Test 7: Test Patient login
      console.log('📍 Test 7: Testing Patient login...');
      await page.goto('http://localhost:3000/login');
      await page.waitForTimeout(2000);
      
      await page.fill('input[type="email"]', 'raja.patient@example.com');
      await page.fill('input[type="password"]', 'Patient@123');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(3000);
      const patientUrl = page.url();
      console.log(`✅ Patient portal URL: ${patientUrl}`);
      
      if (patientUrl.includes('/portal')) {
        console.log('✅ Patient login successful!');
        await page.screenshot({ path: 'patient-portal.png' });
        console.log('✅ Patient portal screenshot saved');
      }
      
    } else {
      console.log('❌ Doctor login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('🏁 Test completed - Check screenshots for visual verification');
  }
})();
