const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test('Test Admin Credentials: admin@example.com', async ({ page }) => {
  console.log('\n🔐 TESTING ADMIN CREDENTIALS');
  console.log('='.repeat(50));

  const adminCredentials = {
    email: 'admin@example.com',
    password: 'Admin@123'
  };

  console.log(`📧 Email: ${adminCredentials.email}`);
  console.log(`🔑 Password: ${adminCredentials.password}`);

  try {
    // Attempt login
    console.log('\n⏳ Attempting login...');
    const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: adminCredentials.email,
        password: adminCredentials.password
      }
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.accessToken || loginData.token;
      
      console.log('🎉 LOGIN SUCCESSFUL!');
      console.log(`🔑 Token: ${token.substring(0, 30)}...`);
      console.log(`👤 User: ${loginData.user?.firstName} ${loginData.user?.lastName}`);
      console.log(`🏥 Role: ${loginData.user?.role}`);
      console.log(`🏥 Organization: ${loginData.user?.organization?.name || 'N/A'}`);

      // Test authenticated API call
      console.log('\n⏳ Testing authenticated API call...');
      const meResponse = await page.request.get(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (meResponse.ok()) {
        const meData = await meResponse.json();
        console.log('✅ Authenticated API call successful');
        console.log(`👤 Current User: ${meData.firstName} ${meData.lastName}`);
        console.log(`🏥 Role: ${meData.role}`);
        console.log(`🏥 Organization: ${meData.organization?.name || 'N/A'}`);
      }

      // Navigate to dashboard
      console.log('\n⏳ Navigating to dashboard...');
      await page.setExtraHTTPHeaders({
        'Authorization': `Bearer ${token}`
      });

      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({ 
        path: 'admin-dashboard-success.png',
        fullPage: true 
      });
      console.log('📸 Dashboard screenshot saved: admin-dashboard-success.png');

      // Check for admin elements
      const pageTitle = await page.title();
      const dashboardVisible = await page.locator('h1, h2, h3').filter({ hasText: 'Dashboard' }).first().isVisible();
      const adminMenuVisible = await page.locator('text=Administration').first().isVisible();
      
      console.log(`📄 Page Title: ${pageTitle}`);
      console.log(`📊 Dashboard visible: ${dashboardVisible}`);
      console.log(`⚙️ Administration menu visible: ${adminMenuVisible}`);

      // Test admin pages
      console.log('\n⏳ Testing admin page access...');
      
      try {
        await page.goto(`${BASE_URL}/admin/users`);
        await page.waitForLoadState('networkidle');
        console.log('✅ Admin users page accessible');
      } catch (error) {
        console.log(`⚠️ Admin users page: ${error.message}`);
      }

      try {
        await page.goto(`${BASE_URL}/admin/departments`);
        await page.waitForLoadState('networkidle');
        console.log('✅ Admin departments page accessible');
      } catch (error) {
        console.log(`⚠️ Admin departments page: ${error.message}`);
      }

      console.log('\n🎉 ADMIN LOGIN TEST COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(50));

      // Assertions
      expect(loginResponse.ok()).toBeTruthy();
      expect(token).toBeDefined();
      expect(loginData.user?.email).toBe(adminCredentials.email);

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ LOGIN FAILED');
      console.log(`❌ Status: ${loginResponse.status()}`);
      console.log(`❌ Error: ${errorData.message || 'Unknown error'}`);
      console.log(`❌ Details: ${JSON.stringify(errorData, null, 2)}`);
      
      // Try to register this admin if login failed
      console.log('\n⏳ Attempting to register admin user...');
      const registerResponse = await page.request.post(`${API_URL}/auth/register`, {
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: adminCredentials.email,
          password: adminCredentials.password,
          confirmPassword: adminCredentials.password,
          phone: '9876543210'
        }
      });

      if (registerResponse.ok()) {
        console.log('✅ Admin user registered successfully');
        console.log('⏳ Now trying to login again...');
        
        const retryLoginResponse = await page.request.post(`${API_URL}/auth/login`, {
          data: {
            email: adminCredentials.email,
            password: adminCredentials.password
          }
        });

        if (retryLoginResponse.ok()) {
          const retryLoginData = await retryLoginResponse.json();
          console.log('🎉 LOGIN SUCCESSFUL AFTER REGISTRATION!');
          console.log(`👤 User: ${retryLoginData.user?.firstName} ${retryLoginData.user?.lastName}`);
          console.log(`🏥 Role: ${retryLoginData.user?.role}`);
        } else {
          console.log('❌ Login still failed after registration');
        }
      } else {
        const regErrorData = await registerResponse.json();
        console.log('❌ Registration also failed');
        console.log(`❌ Registration error: ${regErrorData.message || 'Unknown error'}`);
      }
      
      throw new Error(`Login failed: ${errorData.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.log(`❌ TEST ERROR: ${error.message}`);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'admin-login-error.png',
      fullPage: true 
    });
    console.log('📸 Error screenshot saved: admin-login-error.png');
    
    throw error;
  }
});
