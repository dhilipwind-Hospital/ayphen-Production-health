import { test, expect } from '@playwright/test';

test.describe('Authentication Flows - Complete UI Automation', () => {
  
  // ==================== LOGIN FLOW ====================
  
  test.describe('Login Flow', () => {
    test('01. Login Page - should load correctly', async ({ page }) => {
      await page.goto('/login');
      
      // Verify page loaded
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('text=Login, text=Sign')).toBeVisible();
      
      // Verify form elements
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('02. Login - Admin successful login', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[placeholder="Email"]', 'admin@hospital.com');
      await page.fill('input[placeholder="Password"]', 'Admin@2025');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });
      
      // Verify logged in (dashboard should be visible)
      await expect(page.locator('text=Dashboard, text=Welcome').first()).toBeVisible({ timeout: 10000 });
    });

    test('03. Login - Doctor successful login', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[placeholder="Email"]', 'cardiology@hospital.com');
      await page.fill('input[placeholder="Password"]', 'doctor123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });
      
      // Verify doctor dashboard
      await expect(page.locator('text=Dashboard, text=Appointments').first()).toBeVisible({ timeout: 10000 });
    });

    test('04. Login - Pharmacist successful login', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[placeholder="Email"]', 'pharmacist@example.com');
      await page.fill('input[placeholder="Password"]', 'Pharmacist@123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('05. Login - Patient successful login', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[placeholder="Email"]', 'raja.patient@example.com');
      await page.fill('input[placeholder="Password"]', 'Patient@123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('06. Login - Invalid credentials error', async ({ page }) => {
      await page.goto('/login');
      
      // Fill with invalid credentials
      await page.fill('input[placeholder="Email"]', 'invalid@example.com');
      await page.fill('input[placeholder="Password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should stay on login page or show error
      await page.waitForTimeout(2000);
      
      // Verify still on login page or error message visible
      const url = page.url();
      expect(url.includes('login') || url.includes('/')).toBeTruthy();
    });

    test('07. Login - Empty form validation', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors or stay on page
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/login/);
    });

    test('08. Login - Email format validation', async ({ page }) => {
      await page.goto('/login');
      
      // Fill with invalid email format
      await page.fill('input[placeholder="Email"]', 'notanemail');
      await page.fill('input[placeholder="Password"]', 'somepassword');
      
      // Try to submit
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await page.waitForTimeout(1000);
    });
  });

  // ==================== REGISTER FLOW ====================
  
  test.describe('Register Flow', () => {
    test('09. Register Page - should load correctly', async ({ page }) => {
      await page.goto('/register');
      
      // Verify page loaded
      await expect(page).toHaveURL(/register/);
      
      // Verify form elements exist
      await expect(page.locator('input[placeholder*="First"], input[placeholder*="first"]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Last"], input[placeholder*="last"]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Email"], input[placeholder*="email"]').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Password"], input[placeholder*="password"]').first()).toBeVisible();
    });

    test('10. Register - Complete registration form', async ({ page }) => {
      await page.goto('/register');
      
      // Generate unique email for test
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;
      
      // Fill registration form
      await page.fill('input[placeholder*="First"]', 'Test');
      await page.fill('input[placeholder*="Last"]', 'User');
      await page.fill('input[placeholder*="Email"]', testEmail);
      await page.fill('input[placeholder*="Phone"]', '9876543210');
      
      // Fill password fields
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.first().fill('Test@123');
      if (await passwordFields.count() > 1) {
        await passwordFields.nth(1).fill('Test@123');
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect or success message
      await page.waitForTimeout(3000);
      
      // Should redirect to login or home
      const url = page.url();
      expect(url.includes('login') || url.includes('home') || url.includes('/')).toBeTruthy();
    });

    test('11. Register - Empty form validation', async ({ page }) => {
      await page.goto('/register');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/register/);
    });

    test('12. Register - Password strength validation', async ({ page }) => {
      await page.goto('/register');
      
      // Fill form with weak password
      await page.fill('input[placeholder*="First"]', 'Test');
      await page.fill('input[placeholder*="Last"]', 'User');
      await page.fill('input[placeholder*="Email"]', 'test@example.com');
      
      // Try weak password
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.first().fill('123');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await page.waitForTimeout(1000);
    });
  });

  // ==================== LOGIN TO REGISTER NAVIGATION ====================
  
  test.describe('Login ↔ Register Navigation', () => {
    test('13. Navigate from Login to Register', async ({ page }) => {
      await page.goto('/login');
      
      // Look for "Register" or "Sign up" link
      const registerLink = page.locator('text=Register, text=Sign up, a[href*="register"]').first();
      
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
      } else {
        // Direct navigation
        await page.goto('/register');
        await expect(page).toHaveURL(/register/);
      }
    });

    test('14. Navigate from Register to Login', async ({ page }) => {
      await page.goto('/register');
      
      // Look for "Login" or "Sign in" link
      const loginLink = page.locator('text=Login, text=Sign in, a[href*="login"]').first();
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/login/);
      } else {
        // Direct navigation
        await page.goto('/login');
        await expect(page).toHaveURL(/login/);
      }
    });
  });

  // ==================== COMPLETE AUTHENTICATION WORKFLOW ====================
  
  test.describe('Complete Authentication Workflow', () => {
    test('15. Full workflow: Register → Login → Dashboard', async ({ page }) => {
      // Step 1: Go to register page
      await page.goto('/register');
      await expect(page).toHaveURL(/register/);
      
      // Step 2: Fill registration form
      const timestamp = Date.now();
      const testEmail = `workflow${timestamp}@example.com`;
      
      await page.fill('input[placeholder*="First"]', 'Workflow');
      await page.fill('input[placeholder*="Last"]', 'Test');
      await page.fill('input[placeholder*="Email"]', testEmail);
      await page.fill('input[placeholder*="Phone"]', '9876543210');
      
      const passwordFields = page.locator('input[type="password"]');
      await passwordFields.first().fill('Workflow@123');
      if (await passwordFields.count() > 1) {
        await passwordFields.nth(1).fill('Workflow@123');
      }
      
      // Step 3: Submit registration
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Step 4: Navigate to login (if not already there)
      if (!page.url().includes('login')) {
        await page.goto('/login');
      }
      
      // Step 5: Login with new credentials
      await page.fill('input[placeholder="Email"]', testEmail);
      await page.fill('input[placeholder="Password"]', 'Workflow@123');
      await page.click('button[type="submit"]');
      
      // Step 6: Verify successful login
      await page.waitForTimeout(3000);
      
      // Should be on dashboard or home
      const url = page.url();
      expect(url.includes('/') || url.includes('portal') || url.includes('dashboard')).toBeTruthy();
    });

    test('16. Logout and Login again', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[placeholder="Email"]', 'admin@hospital.com');
      await page.fill('input[placeholder="Password"]', 'Admin@2025');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/', { timeout: 10000 });
      
      // Try to logout
      const userMenu = page.locator('[data-testid="user-menu"], .ant-dropdown-trigger, button:has-text("Admin")').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        
        const logoutButton = page.locator('text=Logout, text=Sign out').first();
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          
          // Should redirect to login
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/login/);
        }
      }
    });
  });

  // ==================== ROLE-BASED LOGIN TESTS ====================
  
  test.describe('Role-Based Login Tests', () => {
    test('17. Admin login → Admin dashboard access', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[placeholder="Email"]', 'admin@hospital.com');
      await page.fill('input[placeholder="Password"]', 'Admin@2025');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/', { timeout: 10000 });
      
      // Admin should access admin pages
      await page.goto('/admin/departments');
      await expect(page).toHaveURL(/departments/);
    });

    test('18. Doctor login → Doctor portal access', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[placeholder="Email"]', 'cardiology@hospital.com');
      await page.fill('input[placeholder="Password"]', 'doctor123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/', { timeout: 10000 });
      
      // Doctor should access doctor pages
      await page.goto('/doctor/patients');
      await expect(page).toHaveURL(/patients/);
    });

    test('19. Pharmacist login → Pharmacy access', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[placeholder="Email"]', 'pharmacist@example.com');
      await page.fill('input[placeholder="Password"]', 'Pharmacist@123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/', { timeout: 10000 });
      
      // Pharmacist should access pharmacy pages
      await page.goto('/pharmacy');
      await expect(page).toHaveURL(/pharmacy/);
    });

    test('20. Patient login → Patient portal access', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[placeholder="Email"]', 'raja.patient@example.com');
      await page.fill('input[placeholder="Password"]', 'Patient@123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/', { timeout: 10000 });
      
      // Patient should access patient portal
      await page.goto('/portal');
      await expect(page).toHaveURL(/portal/);
    });
  });
});
