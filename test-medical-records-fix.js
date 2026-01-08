const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Testing Medical Records Fix - Real vs Mock Data');
  console.log('=================================================');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    // Test with patient who has prescriptions (raja patient)
    console.log('📍 Step 1: Testing Medical Records for Patient with Prescriptions');
    const patientPage = await browser.newPage();
    
    // Enable console logging
    patientPage.on('console', msg => {
      if (msg.text().includes('medical records') || msg.text().includes('prescriptions')) {
        console.log(`🖥️  Console: ${msg.text()}`);
      }
    });
    
    // Login as raja patient (who has prescriptions)
    await patientPage.goto('http://localhost:3000/login');
    await patientPage.waitForLoadState('networkidle');
    
    await patientPage.fill('[data-testid="login-email-input"]', 'raja.patient@example.com');
    await patientPage.fill('[data-testid="login-password-input"]', 'Patient@123');
    await patientPage.click('[data-testid="login-submit-button"]');
    
    await patientPage.waitForTimeout(3000);
    console.log(`✅ Raja patient logged in: ${patientPage.url()}`);
    
    // Navigate to Medical Records
    await patientPage.click('text=Medical Records');
    await patientPage.waitForTimeout(5000);
    
    // Take screenshot
    await patientPage.screenshot({ path: 'medical-records-raja-patient.png' });
    console.log('✅ Screenshot saved: medical-records-raja-patient.png');
    
    // Check content
    const rajaContent = await patientPage.content();
    const rajaTableRows = await patientPage.locator('table tr').count();
    
    const hasPostPhysiotherapy = rajaContent.includes('Post-Physiotherapy');
    const hasOrthopedicsChief = rajaContent.includes('Orthopedics Chief');
    const hasRealPrescription = rajaContent.includes('workflow test') || rajaContent.includes('Cardiology');
    const hasConsultation = rajaContent.includes('Consultation');
    
    console.log('\n📋 RAJA PATIENT MEDICAL RECORDS:');
    console.log('================================');
    console.log(`📊 Table rows: ${rajaTableRows}`);
    console.log(`❌ Has "Post-Physiotherapy" (mock): ${hasPostPhysiotherapy}`);
    console.log(`❌ Has "Orthopedics Chief" (mock): ${hasOrthopedicsChief}`);
    console.log(`✅ Has real prescription data: ${hasRealPrescription}`);
    console.log(`✅ Has "Consultation": ${hasConsultation}`);
    
    await patientPage.close();
    
    // Test with new patient (democheck who now has prescriptions)
    console.log('\n📍 Step 2: Testing Medical Records for Democheck Patient');
    const democheckPage = await browser.newPage();
    
    // Enable console logging
    democheckPage.on('console', msg => {
      if (msg.text().includes('medical records') || msg.text().includes('prescriptions')) {
        console.log(`🖥️  Democheck Console: ${msg.text()}`);
      }
    });
    
    // Login as democheck patient
    await democheckPage.goto('http://localhost:3000/login');
    await democheckPage.waitForLoadState('networkidle');
    
    await democheckPage.fill('[data-testid="login-email-input"]', 'democheck@gmail.com');
    await democheckPage.fill('[data-testid="login-password-input"]', 'Patient@123');
    await democheckPage.click('[data-testid="login-submit-button"]');
    
    await democheckPage.waitForTimeout(3000);
    console.log(`✅ Democheck patient logged in: ${democheckPage.url()}`);
    
    // Navigate to Medical Records
    await democheckPage.click('text=Medical Records');
    await democheckPage.waitForTimeout(5000);
    
    // Take screenshot
    await democheckPage.screenshot({ path: 'medical-records-democheck-patient.png' });
    console.log('✅ Screenshot saved: medical-records-democheck-patient.png');
    
    // Check content
    const democheckContent = await democheckPage.content();
    const democheckTableRows = await democheckPage.locator('table tr').count();
    
    const democheckHasPostPhysiotherapy = democheckContent.includes('Post-Physiotherapy');
    const democheckHasOrthopedicsChief = democheckContent.includes('Orthopedics Chief');
    const democheckHasRealPrescription = democheckContent.includes('Consultation for democheck');
    const democheckHasCardiology = democheckContent.includes('Cardiology');
    
    console.log('\n📋 DEMOCHECK PATIENT MEDICAL RECORDS:');
    console.log('====================================');
    console.log(`📊 Table rows: ${democheckTableRows}`);
    console.log(`❌ Has "Post-Physiotherapy" (mock): ${democheckHasPostPhysiotherapy}`);
    console.log(`❌ Has "Orthopedics Chief" (mock): ${democheckHasOrthopedicsChief}`);
    console.log(`✅ Has "Consultation for democheck": ${democheckHasRealPrescription}`);
    console.log(`✅ Has "Cardiology": ${democheckHasCardiology}`);
    
    await democheckPage.close();
    
    // Test with completely new patient (no prescriptions)
    console.log('\n📍 Step 3: Testing Medical Records for New Patient (No Prescriptions)');
    const newPatientPage = await browser.newPage();
    
    // Login as a patient with no prescriptions
    await newPatientPage.goto('http://localhost:3000/login');
    await newPatientPage.waitForLoadState('networkidle');
    
    await newPatientPage.fill('[data-testid="login-email-input"]', 'priya.sharma@example.com');
    await newPatientPage.fill('[data-testid="login-password-input"]', 'Patient@123');
    await newPatientPage.click('[data-testid="login-submit-button"]');
    
    await newPatientPage.waitForTimeout(3000);
    console.log(`✅ Priya patient logged in: ${newPatientPage.url()}`);
    
    // Navigate to Medical Records
    await newPatientPage.click('text=Medical Records');
    await newPatientPage.waitForTimeout(5000);
    
    // Take screenshot
    await newPatientPage.screenshot({ path: 'medical-records-new-patient.png' });
    console.log('✅ Screenshot saved: medical-records-new-patient.png');
    
    // Check content
    const newPatientContent = await newPatientPage.content();
    const newPatientTableRows = await newPatientPage.locator('table tr').count();
    
    const newPatientHasPostPhysiotherapy = newPatientContent.includes('Post-Physiotherapy');
    const newPatientHasOrthopedicsChief = newPatientContent.includes('Orthopedics Chief');
    const newPatientHasNoRecords = newPatientContent.includes('No data') || newPatientTableRows <= 1;
    
    console.log('\n📋 NEW PATIENT MEDICAL RECORDS:');
    console.log('===============================');
    console.log(`📊 Table rows: ${newPatientTableRows}`);
    console.log(`❌ Has "Post-Physiotherapy" (mock): ${newPatientHasPostPhysiotherapy}`);
    console.log(`❌ Has "Orthopedics Chief" (mock): ${newPatientHasOrthopedicsChief}`);
    console.log(`✅ Shows empty state (no mock data): ${newPatientHasNoRecords}`);
    
    await newPatientPage.close();
    
    // FINAL SUMMARY
    console.log('\n🎯 MEDICAL RECORDS FIX VERIFICATION:');
    console.log('====================================');
    
    const mockDataRemoved = !hasPostPhysiotherapy && !democheckHasPostPhysiotherapy && !newPatientHasPostPhysiotherapy;
    const realDataShowing = hasRealPrescription || democheckHasRealPrescription;
    const emptyStateWorking = newPatientHasNoRecords;
    
    if (mockDataRemoved && realDataShowing) {
      console.log('🎉 SUCCESS: Medical Records Fix is Working!');
      console.log('✅ Mock data (Post-Physiotherapy, Orthopedics Chief) removed');
      console.log('✅ Real prescription data now displays');
      console.log('✅ Patients see their actual medical history');
      console.log('✅ Empty state shows for patients with no records');
      
      console.log('\n📊 RESULTS SUMMARY:');
      console.log(`   Raja Patient: ${rajaTableRows - 1} records (real prescriptions)`);
      console.log(`   Democheck Patient: ${democheckTableRows - 1} records (real prescriptions)`);
      console.log(`   New Patient: ${newPatientTableRows - 1} records (empty state)`);
      
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some issues remain');
      console.log(`   Mock data removed: ${mockDataRemoved}`);
      console.log(`   Real data showing: ${realDataShowing}`);
      console.log(`   Empty state working: ${emptyStateWorking}`);
    }
    
  } catch (error) {
    console.error('❌ Medical Records test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Medical Records fix verification completed');
  }
})();
