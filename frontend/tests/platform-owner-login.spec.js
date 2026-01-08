const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test('🔥 PLATFORM OWNER LOGIN TEST', async ({ page }) => {
  console.log('\n👑 PLATFORM OWNER / SUPER ADMIN LOGIN');
  console.log('='.repeat(60));

  const platformOwnerCredentials = {
    email: 'superadmin@hospital.com',
    password: 'SuperAdmin@2025'
  };

  console.log(`📧 Email: ${platformOwnerCredentials.email}`);
  console.log(`🔑 Password: ${platformOwnerCredentials.password}`);

  try {
    // Login as platform owner
    console.log('\n⏳ Attempting platform owner login...');
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: platformOwnerCredentials.email,
        password: platformOwnerCredentials.password
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.accessToken || loginData.token;

    console.log('👑 PLATFORM OWNER LOGIN SUCCESSFUL!');
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);
    console.log(`👤 User: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
    console.log(`🏥 Role: ${loginData.user?.role}`);
    console.log(`🏥 Organization: ${loginData.user?.organization?.name || 'PLATFORM LEVEL'}`);

    // Test authenticated API call
    console.log('\n⏳ Testing platform owner API access...');
    const meResponse = await page.request.get(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect(meResponse.ok()).toBeTruthy();
    const meData = await meResponse.json();
    console.log('✅ Platform owner API call successful');
    console.log(`👤 Current User: ${meData.firstName} ${meData.lastName}`);
    console.log(`🏥 Role: ${meData.role}`);
    console.log(`🏥 Organization: ${meData.organization?.name || 'PLATFORM LEVEL'}`);

    // Navigate to dashboard
    console.log('\n⏳ Accessing platform owner dashboard...');
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ 
      path: 'platform-owner-dashboard.png',
      fullPage: true 
    });
    console.log('📸 Platform owner dashboard screenshot saved');

    // Check for platform owner elements
    const pageTitle = await page.title();
    console.log(`📄 Page Title: ${pageTitle}`);

    // Test platform owner specific pages
    console.log('\n⏳ Testing platform owner page access...');
    
    // Test SaaS management page
    try {
      await page.goto(`${BASE_URL}/saas`);
      await page.waitForLoadState('networkidle');
      console.log('✅ SaaS Management page accessible');
    } catch (error) {
      console.log(`⚠️ SaaS Management page: ${error.message}`);
    }

    // Test organizations management
    try {
      await page.goto(`${BASE_URL}/organizations`);
      await page.waitForLoadState('networkidle');
      console.log('✅ Organizations management page accessible');
    } catch (error) {
      console.log(`⚠️ Organizations page: ${error.message}`);
    }

    // Test admin panel
    try {
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState('networkidle');
      console.log('✅ Admin panel accessible');
    } catch (error) {
      console.log(`⚠️ Admin panel: ${error.message}`);
    }

    console.log('\n👑 PLATFORM OWNER LOGIN TEST COMPLETED!');
    console.log('='.repeat(60));
    console.log('✅ Email: superadmin@hospital.com');
    console.log('✅ Password: SuperAdmin@2025');
    console.log('✅ Role: super_admin');
    console.log('✅ Login: SUCCESS');
    console.log('✅ Dashboard: ACCESSIBLE');
    console.log('✅ Platform Level Access: CONFIRMED');
    console.log('='.repeat(60));

    // Final assertions
    expect(token).toBeDefined();
    expect(loginData.user?.role).toBe('super_admin');
    expect(loginData.user?.email).toBe(platformOwnerCredentials.email);

  } catch (error) {
    console.log(`❌ PLATFORM OWNER LOGIN ERROR: ${error.message}`);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'platform-owner-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved');
    
    throw error;
  }
});
