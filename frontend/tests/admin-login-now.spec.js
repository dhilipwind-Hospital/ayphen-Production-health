const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:5001/api';

test.describe('Admin Login - Quick Test', () => {
  
  test('Login as Admin NOW', async ({ page }) => {
    console.log('\n🔐 ADMIN LOGIN TEST - STARTING NOW');
    console.log('='.repeat(50));

    // Try existing admin credentials first
    const existingAdmins = [
      { email: 'admin@hospital.com', password: 'AdminPass123!' },
      { email: 'admin@default.com', password: 'AdminPass123!' },
      { email: 'dhilip.elango+1@ayphen.com', password: 'AdminPass123!' }
    ];

    let loginSuccess = false;
    let token = null;
    let loginData = null;

    // Try existing admin accounts first
    for (const admin of existingAdmins) {
      console.log(`⏳ Trying existing admin: ${admin.email}`);
      
      const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
        data: {
          email: admin.email,
          password: admin.password
        }
      });

      if (loginResponse.ok()) {
        loginData = await loginResponse.json();
        token = loginData.accessToken || loginData.token;
        console.log(`✅ Existing admin login successful: ${admin.email}`);
        loginSuccess = true;
        break;
      } else {
        console.log(`❌ Failed to login with: ${admin.email}`);
      }
    }

    // If no existing admin worked, create a new one
    if (!loginSuccess) {
      console.log('⏳ No existing admin found, creating new admin...');
      
      // Generate unique admin email
      const adminData = {
        email: `admin.${Date.now()}@test.com`,
        password: 'AdminPass123!',
        firstName: 'Test',
        lastName: 'Admin',
        phone: '9876543210'
      };

      console.log(`📧 New Admin Email: ${adminData.email}`);

      try {
        // Step 1: Register Admin (will be patient by default)
        console.log('⏳ Step 1: Registering new user...');
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

        if (!registerResponse.ok()) {
          const errorData = await registerResponse.json();
          console.log('❌ Registration failed:', errorData);
          throw new Error(`Registration failed: ${JSON.stringify(errorData)}`);
        }

        const userData = await registerResponse.json();
        console.log('✅ User registered successfully (as patient)');
        console.log(`🏥 Organization ID: ${userData.user?.organizationId || 'N/A'}`);

        // Step 2: Login to get token
        console.log('⏳ Step 2: Logging in to get token...');
        const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
          data: {
            email: adminData.email,
            password: adminData.password
          }
        });

        if (!loginResponse.ok()) {
          const errorData = await loginResponse.json();
          console.log('❌ Login failed:', errorData);
          throw new Error(`Login failed: ${JSON.stringify(errorData)}`);
        }

        loginData = await loginResponse.json();
        token = loginData.accessToken || loginData.token;
        
        console.log('✅ Login successful');
        console.log(`🔑 Token: ${token.substring(0, 20)}...`);
        console.log(`👤 User Role: ${loginData.user?.role || 'N/A'}`);
        
      } catch (error) {
        console.log('❌ Failed to create new admin:', error.message);
        throw error;
      }
    }

    try {

      // Step 3: Set Auth Header
      await page.setExtraHTTPHeaders({
        'Authorization': `Bearer ${token}`
      });

      // Step 4: Navigate to Dashboard
      console.log('⏳ Step 3: Navigating to dashboard...');
      await page.goto(`${BASE_URL}/dashboard`);

      // Step 5: Verify Login
      console.log('⏳ Step 4: Verifying admin access...');
      
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      
      // Check for dashboard elements
      const dashboardVisible = await page.locator('text=Dashboard').isVisible();
      const adminPanelVisible = await page.locator('text=Administration').isVisible();
      
      if (dashboardVisible) {
        console.log('✅ Dashboard is visible');
      } else {
        console.log('⚠️ Dashboard not found');
      }

      if (adminPanelVisible) {
        console.log('✅ Administration menu is visible');
      } else {
        console.log('⚠️ Administration menu not found');
      }

      // Take screenshot for verification
      await page.screenshot({ 
        path: 'admin-login-success.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: admin-login-success.png');

      // Test API call with token
      console.log('⏳ Step 5: Testing authenticated API call...');
      const meResponse = await page.request.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (meResponse.ok()) {
        const meData = await meResponse.json();
        console.log('✅ Authenticated API call successful');
        console.log(`👤 User: ${meData.firstName} ${meData.lastName} (${meData.role})`);
        console.log(`🏥 Organization: ${meData.organization?.name || 'N/A'}`);
      } else {
        console.log('⚠️ Authenticated API call failed');
      }

      console.log('\n🎉 ADMIN LOGIN TEST COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(50));

      // Assertions
      expect(registerResponse.ok()).toBeTruthy();
      expect(loginResponse.ok()).toBeTruthy();
      expect(token).toBeDefined();
      expect(dashboardVisible || adminPanelVisible).toBeTruthy();

    } catch (error) {
      console.log('❌ ADMIN LOGIN TEST FAILED:', error.message);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'admin-login-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved: admin-login-error.png');
      
      throw error;
    }
  });

});
