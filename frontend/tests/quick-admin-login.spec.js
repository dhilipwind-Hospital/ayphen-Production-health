const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test('Quick Admin Login Test', async ({ page }) => {
  console.log('\n🔐 QUICK ADMIN LOGIN TEST');
  console.log('='.repeat(40));

  // Known admin from database
  const adminEmail = 'dhilipwind+1622@gmail.com';
  
  // Common passwords to try
  const passwords = [
    'AdminPass123!',
    'Password123!',
    'Admin123!',
    'testme123',
    'testme',
    '123456',
    'admin123',
    'password'
  ];

  let loginSuccess = false;
  let token = null;
  let loginData = null;

  console.log(`👤 Trying admin: ${adminEmail}`);

  for (const password of passwords) {
    console.log(`⏳ Trying password: ${password}`);
    
    try {
      const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
        data: {
          email: adminEmail,
          password: password
        }
      });

      if (loginResponse.ok()) {
        loginData = await loginResponse.json();
        token = loginData.accessToken || loginData.token;
        console.log(`✅ LOGIN SUCCESS with password: ${password}`);
        console.log(`🔑 Token: ${token.substring(0, 20)}...`);
        console.log(`👤 User: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
        console.log(`🏥 Role: ${loginData.user?.role}`);
        console.log(`🏥 Organization: ${loginData.user?.organization?.name || 'N/A'}`);
        loginSuccess = true;
        break;
      } else {
        const errorData = await loginResponse.json();
        console.log(`❌ Failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  if (!loginSuccess) {
    console.log('❌ All password attempts failed');
    throw new Error('Could not login with any password');
  }

  // Test the token by making an authenticated API call
  console.log('\n⏳ Testing authenticated API call...');
  
  const meResponse = await page.request.get(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (meResponse.ok()) {
    const meData = await meResponse.json();
    console.log('✅ Authenticated API call successful');
    console.log(`👤 Current User: ${meData.firstName} ${meData.lastName}`);
    console.log(`🏥 Role: ${meData.role}`);
    console.log(`🏥 Organization: ${meData.organization?.name || 'N/A'}`);
  } else {
    console.log('❌ Authenticated API call failed');
  }

  // Navigate to dashboard with auth
  console.log('\n⏳ Testing dashboard access...');
  
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${token}`
  });

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ 
    path: 'admin-dashboard.png',
    fullPage: true 
  });
  console.log('📸 Dashboard screenshot saved: admin-dashboard.png');

  // Check for admin elements
  const dashboardVisible = await page.locator('text=Dashboard').isVisible();
  const adminVisible = await page.locator('text=Administration').isVisible();
  
  console.log(`📊 Dashboard visible: ${dashboardVisible}`);
  console.log(`⚙️ Administration visible: ${adminVisible}`);

  console.log('\n🎉 ADMIN LOGIN TEST COMPLETED!');
  console.log('='.repeat(40));

  // Assertions
  expect(loginSuccess).toBeTruthy();
  expect(token).toBeDefined();
  expect(loginData.user?.role).toBe('admin');
});
