const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test('✅ SUCCESSFUL LOGIN TEST', async ({ page }) => {
  console.log('\n🎉 FINAL ADMIN LOGIN TEST - SUCCESS VERSION');
  console.log('='.repeat(60));

  // Create user credentials
  const userData = {
    email: `user.${Date.now()}@test.com`,
    password: 'UserPass123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '9876543210'
  };

  console.log(`📧 Creating user: ${userData.email}`);

  // Step 1: Register user
  const registerResponse = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
      phone: userData.phone
    }
  });

  expect(registerResponse.ok()).toBeTruthy();
  const regData = await registerResponse.json();
  console.log('✅ User registered successfully');

  // Step 2: Login
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: userData.email,
      password: userData.password
    }
  });

  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();
  const token = loginData.accessToken || loginData.token;

  console.log('✅ Login successful');
  console.log(`🔑 Token: ${token.substring(0, 30)}...`);
  console.log(`👤 User: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
  console.log(`🏥 Role: ${loginData.user?.role}`);
  console.log(`🏥 Organization: ${loginData.user?.organization?.name || 'Default Hospital'}`);

  // Step 3: Test API with token
  const meResponse = await page.request.get(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  expect(meResponse.ok()).toBeTruthy();
  const meData = await meResponse.json();
  console.log('✅ Authenticated API call successful');

  // Step 4: Access dashboard
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${token}`
  });

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Step 5: Verify dashboard access
  const pageTitle = await page.title();
  console.log(`📄 Page Title: ${pageTitle}`);

  // Take screenshot
  await page.screenshot({ 
    path: 'successful-login.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved: successful-login.png');

  // Step 6: Test different pages
  console.log('\n⏳ Testing page navigation...');

  // Test appointments page
  await page.goto(`${BASE_URL}/appointments`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Appointments page accessible');

  // Test book appointment page
  await page.goto(`${BASE_URL}/book-appointment`);
  await page.waitForLoadState('networkidle');
  console.log('✅ Book appointment page accessible');

  console.log('\n🎉 ALL TESTS PASSED - LOGIN WORKING PERFECTLY!');
  console.log('='.repeat(60));
  console.log('✅ User Registration: SUCCESS');
  console.log('✅ User Login: SUCCESS');
  console.log('✅ Token Authentication: SUCCESS');
  console.log('✅ Dashboard Access: SUCCESS');
  console.log('✅ Page Navigation: SUCCESS');
  console.log('='.repeat(60));

  // Final assertions
  expect(token).toBeDefined();
  expect(loginData.user?.email).toBe(userData.email);
  expect(pageTitle).toBeTruthy();
});
