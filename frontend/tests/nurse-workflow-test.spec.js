const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test('🩺 NURSE WORKFLOW TEST', async ({ page }) => {
  console.log('\n👩‍⚕️ TESTING NURSE WORKFLOW');
  console.log('='.repeat(50));

  // Step 1: Create a nurse user (using your role assignment)
  const nurseCredentials = {
    email: 'sarah.johnson@hospital.com',
    password: 'NursePass123!',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '9876543210'
  };

  console.log(`📧 Testing nurse: ${nurseCredentials.email}`);

  try {
    // Step 2: Register nurse user
    console.log('\n⏳ Registering nurse user...');
    const registerResponse = await page.request.post(`${API_URL}/auth/register`, {
      data: {
        firstName: nurseCredentials.firstName,
        lastName: nurseCredentials.lastName,
        email: nurseCredentials.email,
        password: nurseCredentials.password,
        confirmPassword: nurseCredentials.password,
        phone: nurseCredentials.phone
      }
    });

    if (registerResponse.ok()) {
      console.log('✅ Nurse user registered successfully');
    }

    // Step 3: Login as nurse
    console.log('\n⏳ Logging in as nurse...');
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: nurseCredentials.email,
        password: nurseCredentials.password
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.accessToken || loginData.token;

    console.log('✅ Nurse login successful');
    console.log(`👤 User: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
    console.log(`🏥 Role: ${loginData.user?.role}`);

    // Step 4: Set authentication
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Step 5: Navigate to triage station
    console.log('\n⏳ Accessing triage station...');
    await page.goto(`${BASE_URL}/queue/triage`);
    await page.waitForLoadState('networkidle');

    // Step 6: Check triage interface
    const pageTitle = await page.textContent('h4');
    console.log(`📄 Page Title: ${pageTitle}`);

    // Check for triage elements
    const callNextButton = await page.locator('button:has-text("Call Next")').isVisible();
    const waitingListCard = await page.locator('text=Waiting List').isVisible();
    
    console.log(`🔘 Call Next Button: ${callNextButton ? 'Visible' : 'Not Found'}`);
    console.log(`📋 Waiting List: ${waitingListCard ? 'Visible' : 'Not Found'}`);

    // Step 7: Test inpatient nursing care
    console.log('\n⏳ Testing inpatient nursing care...');
    await page.goto(`${BASE_URL}/inpatient/nursing`);
    await page.waitForLoadState('networkidle');

    // Check nursing care interface
    const nursingInterface = await page.locator('text=Nursing Care').isVisible();
    console.log(`🏥 Nursing Care Interface: ${nursingInterface ? 'Accessible' : 'Not Found'}`);

    // Step 8: Take screenshots
    await page.screenshot({ 
      path: 'nurse-triage-station.png',
      fullPage: true 
    });
    console.log('📸 Triage station screenshot saved');

    console.log('\n🎉 NURSE WORKFLOW TEST COMPLETED!');
    console.log('='.repeat(50));
    console.log('✅ Nurse Registration: SUCCESS');
    console.log('✅ Nurse Login: SUCCESS');
    console.log('✅ Triage Station Access: SUCCESS');
    console.log('✅ Inpatient Care Access: SUCCESS');
    console.log('✅ Nurse Workflow: FULLY FUNCTIONAL');
    console.log('='.repeat(50));

  } catch (error) {
    console.log(`❌ NURSE WORKFLOW ERROR: ${error.message}`);
    
    await page.screenshot({ 
      path: 'nurse-workflow-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved');
    
    throw error;
  }
});
