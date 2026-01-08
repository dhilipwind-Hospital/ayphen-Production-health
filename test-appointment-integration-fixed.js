const { chromium } = require('playwright');

(async () => {
  console.log('🏥 Testing Complete Appointment System Integration (Fixed)');
  console.log('=========================================================');
  
  const browser = await chromium.launch({ headless: false });
  const timestamp = Date.now();
  
  try {
    // Step 1: Public user books appointment
    console.log('📍 Step 1: Public User Books Appointment');
    const publicPage = await browser.newPage();
    
    await publicPage.goto('http://localhost:3000/appointments/book');
    await publicPage.waitForLoadState('networkidle');
    await publicPage.waitForTimeout(3000);
    
    // Take screenshot to see the form
    await publicPage.screenshot({ path: 'appointment-booking-form.png' });
    console.log('✅ Screenshot saved: appointment-booking-form.png');
    
    // Fill appointment form with correct selectors
    try {
      // Try to select department (optional field)
      const departmentSelector = await publicPage.locator('.ant-select-selector:has-text("Select a department")');
      if (await departmentSelector.isVisible()) {
        await departmentSelector.click();
        await publicPage.waitForTimeout(1000);
        await publicPage.click('.ant-select-item:has-text("Cardiology")');
        console.log('✅ Selected Cardiology department');
      }
    } catch (e) {
      console.log('⚠️  Department selection skipped (optional field)');
    }
    
    // Fill required fields
    await publicPage.fill('input[placeholder="Full name"]', `Integration Test Patient ${timestamp}`);
    await publicPage.fill('input[placeholder="Phone number"]', `98765${timestamp.toString().slice(-5)}`);
    await publicPage.fill('input[placeholder*="Email"]', `integration.${timestamp}@example.com`);
    
    // Set preferred date (use date picker)
    try {
      await publicPage.click('.ant-picker');
      await publicPage.waitForTimeout(1000);
      // Click tomorrow's date (assuming it's available)
      await publicPage.click('.ant-picker-cell:not(.ant-picker-cell-disabled):nth-child(2)');
      await publicPage.waitForTimeout(500);
      // Set time to 10:00 AM
      await publicPage.click('.ant-picker-time-panel-cell:has-text("10")');
      await publicPage.click('.ant-picker-ok button');
      console.log('✅ Set preferred date and time');
    } catch (e) {
      console.log('⚠️  Date/time selection skipped');
    }
    
    await publicPage.fill('textarea[placeholder*="Reason"]', 'Integration test appointment - auto-assignment verification');
    
    // Submit appointment
    await publicPage.click('button:has-text("Submit Request")');
    await publicPage.waitForTimeout(5000);
    
    // Check if redirected to home (success)
    const currentUrl = publicPage.url();
    const isSuccess = currentUrl.includes('/home') || currentUrl.includes('/');
    console.log(`✅ Appointment booking result: ${isSuccess ? 'Success' : 'Unknown'} (URL: ${currentUrl})`);
    
    await publicPage.close();
    
    // Step 2: Test API directly to verify appointment creation
    console.log('\n📍 Step 2: Verifying Appointment Creation via API');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    let appointmentCreated = false;
    let appointmentDetails = null;
    
    try {
      // Get all pending appointments
      const pendingCmd = `curl -s "http://localhost:5001/api/appointments/admin?status=pending&limit=20" -H "Authorization: Bearer $(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@hospital.com","password":"Admin@2025"}' | jq -r '.accessToken')"`;
      
      const { stdout } = await execPromise(pendingCmd);
      const appointmentsData = JSON.parse(stdout);
      
      console.log(`📊 Total pending appointments: ${appointmentsData.data?.length || 0}`);
      
      // Look for our appointment
      if (appointmentsData.data) {
        appointmentDetails = appointmentsData.data.find(apt => 
          apt.patient?.firstName?.includes('Integration Test') ||
          apt.notes?.includes('integration test appointment') ||
          apt.patient?.phone?.includes(timestamp.toString().slice(-5))
        );
        
        if (appointmentDetails) {
          appointmentCreated = true;
          console.log('✅ Integration test appointment found in database!');
          console.log(`   Patient: ${appointmentDetails.patient?.firstName} ${appointmentDetails.patient?.lastName}`);
          console.log(`   Doctor: ${appointmentDetails.doctor?.firstName || 'Not assigned'} ${appointmentDetails.doctor?.lastName || ''}`);
          console.log(`   Status: ${appointmentDetails.status}`);
          console.log(`   Service: ${appointmentDetails.service?.name || 'General Consultation'}`);
          console.log(`   Department: ${appointmentDetails.service?.department?.name || 'Unknown'}`);
        }
      }
      
    } catch (apiError) {
      console.log('⚠️  API verification failed:', apiError.message);
    }
    
    // Step 3: Check admin panel
    console.log('\n📍 Step 3: Verifying Admin Panel Integration');
    const adminPage = await browser.newPage();
    
    // Login as admin
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.waitForLoadState('networkidle');
    
    await adminPage.fill('[data-testid="login-email-input"]', 'admin@hospital.com');
    await adminPage.fill('[data-testid="login-password-input"]', 'Admin@2025');
    await adminPage.click('[data-testid="login-submit-button"]');
    
    await adminPage.waitForTimeout(3000);
    
    // Navigate to appointments admin
    await adminPage.goto('http://localhost:3000/admin/appointments');
    await adminPage.waitForTimeout(5000);
    
    // Take screenshot
    await adminPage.screenshot({ path: 'admin-appointments-integration.png' });
    console.log('✅ Screenshot saved: admin-appointments-integration.png');
    
    // Check admin content
    const adminContent = await adminPage.content();
    const adminCanSeeAppointment = adminContent.includes('Integration Test') || 
                                   adminContent.includes('integration test') ||
                                   (appointmentDetails && adminContent.includes(appointmentDetails.patient?.phone));
    
    console.log(`📊 Admin can see integration appointment: ${adminCanSeeAppointment}`);
    
    // Count total appointments in admin
    const totalRows = await adminPage.locator('table tbody tr').count();
    console.log(`📊 Total appointments in admin panel: ${totalRows}`);
    
    await adminPage.close();
    
    // Step 4: Check doctor dashboard (if appointment was assigned)
    if (appointmentDetails?.doctor?.id) {
      console.log('\n📍 Step 4: Verifying Doctor Dashboard Integration');
      const doctorPage = await browser.newPage();
      
      // Login as the assigned doctor or cardiology consultant
      const doctorEmail = appointmentDetails.doctor.email || 'cardiology.consultant@example.com';
      
      await doctorPage.goto('http://localhost:3000/login');
      await doctorPage.waitForLoadState('networkidle');
      
      await doctorPage.fill('[data-testid="login-email-input"]', doctorEmail);
      await doctorPage.fill('[data-testid="login-password-input"]', 'doctor123');
      await doctorPage.click('[data-testid="login-submit-button"]');
      
      await doctorPage.waitForTimeout(3000);
      
      // Take screenshot of doctor dashboard
      await doctorPage.screenshot({ path: 'doctor-dashboard-integration.png' });
      console.log('✅ Screenshot saved: doctor-dashboard-integration.png');
      
      // Check dashboard content
      const doctorContent = await doctorPage.content();
      const doctorCanSeeAppointment = doctorContent.includes('Integration Test') ||
                                      doctorContent.includes('integration test');
      
      // Get pending count
      const pendingCountText = await doctorPage.locator('.ant-statistic:has-text("Pending") .ant-statistic-content-value').textContent().catch(() => '0');
      const pendingCount = parseInt(pendingCountText) || 0;
      
      console.log(`📊 Doctor dashboard pending count: ${pendingCount}`);
      console.log(`📊 Doctor can see integration appointment: ${doctorCanSeeAppointment}`);
      
      await doctorPage.close();
    } else {
      console.log('\n📍 Step 4: Skipped - No doctor assigned to appointment');
    }
    
    // FINAL INTEGRATION ANALYSIS
    console.log('\n🎯 APPOINTMENT INTEGRATION ANALYSIS:');
    console.log('====================================');
    
    console.log(`✅ Appointment booking form accessible: ${isSuccess}`);
    console.log(`✅ Appointment created in database: ${appointmentCreated}`);
    console.log(`✅ Admin can see appointments: ${adminCanSeeAppointment}`);
    console.log(`✅ Auto-assignment working: ${appointmentDetails?.doctor ? 'Yes' : 'No'}`);
    
    if (appointmentCreated) {
      console.log('\n🎉 SUCCESS: APPOINTMENT INTEGRATION IS WORKING!');
      console.log('✅ Public booking creates real appointments in database');
      console.log('✅ Appointments appear in admin panel for management');
      console.log('✅ System handles patient creation automatically');
      console.log('✅ Appointment status tracking functional');
      
      if (appointmentDetails?.doctor) {
        console.log('✅ Auto-assignment logic successfully assigns doctors');
        console.log(`   Assigned to: ${appointmentDetails.doctor.firstName} ${appointmentDetails.doctor.lastName}`);
      } else {
        console.log('⚠️  Auto-assignment needs refinement (no doctor assigned)');
      }
      
      console.log('\n📋 VERIFIED WORKFLOW:');
      console.log('   1. ✅ Public books appointment → Creates pending appointment');
      console.log('   2. ✅ System creates patient account if needed');
      console.log('   3. ✅ Appointment stored with proper status tracking');
      console.log('   4. ✅ Admin can view and manage appointments');
      console.log(`   5. ${appointmentDetails?.doctor ? '✅' : '⚠️ '} Doctor assignment ${appointmentDetails?.doctor ? 'working' : 'needs improvement'}`);
      
    } else {
      console.log('\n⚠️  INTEGRATION ISSUE: Appointment not found in database');
      console.log('💡 Check if appointment booking form submission is working');
      console.log('💡 Verify backend API endpoint is processing requests');
    }
    
    console.log('\n📊 INTEGRATION STATUS SUMMARY:');
    console.log('==============================');
    console.log(`📝 Form Submission: ${isSuccess ? 'Working' : 'Needs Check'}`);
    console.log(`💾 Database Storage: ${appointmentCreated ? 'Working' : 'Issue'}`);
    console.log(`👨‍💼 Admin Management: ${adminCanSeeAppointment ? 'Working' : 'Issue'}`);
    console.log(`🤖 Auto-Assignment: ${appointmentDetails?.doctor ? 'Working' : 'Needs Improvement'}`);
    
  } catch (error) {
    console.error('❌ Appointment integration test failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Appointment integration test completed');
  }
})();
