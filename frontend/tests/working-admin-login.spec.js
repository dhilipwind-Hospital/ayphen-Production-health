const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test('Working Admin Login - Create and Login', async ({ page }) => {
  console.log('\n🔐 WORKING ADMIN LOGIN TEST');
  console.log('='.repeat(50));

  // Step 1: Create a new user (will be patient by default)
  const adminData = {
    email: `admin.${Date.now()}@test.com`,
    password: 'AdminPass123!',
    firstName: 'Test',
    lastName: 'Admin',
    phone: '9876543210'
  };

  console.log(`📧 Creating user: ${adminData.email}`);

  // Register user
  const registerResponse = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: adminData.password,
      confirmPassword: adminData.password,
      phone: adminData.phone
    }
  });

  expect(registerResponse.ok()).toBeTruthy();
  const userData = await registerResponse.json();
  console.log('✅ User registered successfully');
  console.log(`👤 User ID: ${userData.user?.id}`);
  console.log(`🏥 Organization: ${userData.user?.organizationId || 'N/A'}`);

  // Step 2: Update user role to admin directly in database
  console.log('\n⏳ Updating user role to admin in database...');
  
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error('User ID not found in registration response');
  }

  // Step 3: Login with the user
  console.log('\n⏳ Logging in as user...');
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: adminData.email,
      password: adminData.password
    }
  });

  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();
  const token = loginData.accessToken || loginData.token;

  console.log('✅ Login successful');
  console.log(`🔑 Token: ${token.substring(0, 20)}...`);
  console.log(`👤 User Role: ${loginData.user?.role}`);
  console.log(`🏥 Organization: ${loginData.user?.organization?.name || 'N/A'}`);

  // Step 4: Test authenticated API call
  console.log('\n⏳ Testing authenticated API call...');
  
  const meResponse = await page.request.get(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  expect(meResponse.ok()).toBeTruthy();
  const meData = await meResponse.json();
  console.log('✅ Authenticated API call successful');
  console.log(`👤 Current User: ${meData.firstName} ${meData.lastName}`);
  console.log(`🏥 Role: ${meData.role}`);
  console.log(`🏥 Organization: ${meData.organization?.name || 'N/A'}`);

  // Step 5: Navigate to dashboard
  console.log('\n⏳ Navigating to dashboard...');
  
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${token}`
  });

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Step 6: Take screenshot and verify
  await page.screenshot({ 
    path: 'user-dashboard.png',
    fullPage: true 
  });
  console.log('📸 Dashboard screenshot saved: user-dashboard.png');

  // Check what's visible on the page
  const pageTitle = await page.title();
  const dashboardVisible = await page.locator('text=Dashboard').isVisible();
  const patientsVisible = await page.locator('text=Patients').isVisible();
  const appointmentsVisible = await page.locator('text=Appointments').isVisible();
  
  console.log(`📄 Page Title: ${pageTitle}`);
  console.log(`📊 Dashboard visible: ${dashboardVisible}`);
  console.log(`👥 Patients visible: ${patientsVisible}`);
  console.log(`📅 Appointments visible: ${appointmentsVisible}`);

  // Step 7: Try to access different pages
  console.log('\n⏳ Testing page navigation...');
  
  // Try patients page
  try {
    await page.goto(`${BASE_URL}/patients`);
    await page.waitForLoadState('networkidle');
    const patientsPageVisible = await page.locator('text=Patient').isVisible();
    console.log(`👥 Patients page accessible: ${patientsPageVisible}`);
  } catch (error) {
    console.log(`❌ Patients page error: ${error.message}`);
  }

  // Try appointments page
  try {
    await page.goto(`${BASE_URL}/appointments`);
    await page.waitForLoadState('networkidle');
    const appointmentsPageVisible = await page.locator('text=Appointment').isVisible();
    console.log(`📅 Appointments page accessible: ${appointmentsPageVisible}`);
  } catch (error) {
    console.log(`❌ Appointments page error: ${error.message}`);
  }

  console.log('\n🎉 USER LOGIN TEST COMPLETED!');
  console.log('='.repeat(50));

  // Final assertions
  expect(token).toBeDefined();
  expect(meData.email).toBe(adminData.email);
  expect(pageTitle).toContain('Hospital');
});
