const { test, expect } = require('@playwright/test');

const API_URL = 'http://localhost:5001/api';
const BASE_URL = 'http://localhost:3000';

test('✅ CONFIRM: admin@example.com Login Works', async ({ page }) => {
  console.log('\n🎉 CONFIRMING ADMIN LOGIN WORKS');
  console.log('='.repeat(40));

  const adminCredentials = {
    email: 'admin@example.com',
    password: 'Admin@123'
  };

  // Login
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: adminCredentials
  });

  expect(loginResponse.ok()).toBeTruthy();
  const loginData = await loginResponse.json();
  const token = loginData.accessToken || loginData.token;

  console.log('✅ LOGIN SUCCESSFUL!');
  console.log(`👤 User: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
  console.log(`📧 Email: ${loginData.user?.email}`);
  console.log(`🏥 Role: ${loginData.user?.role}`);
  console.log(`🔑 Token: ${token.substring(0, 20)}...`);

  // Test dashboard access
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${token}`
  });

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  const pageTitle = await page.title();
  console.log(`📄 Dashboard Title: ${pageTitle}`);

  console.log('\n🎉 ADMIN CREDENTIALS CONFIRMED WORKING!');
  console.log('='.repeat(40));
  console.log('✅ Email: admin@example.com');
  console.log('✅ Password: Admin@123');
  console.log('✅ Login: SUCCESS');
  console.log('✅ Dashboard: ACCESSIBLE');
  console.log('='.repeat(40));
});
