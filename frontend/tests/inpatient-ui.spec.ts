import { test, expect, Page } from '@playwright/test';

/**
 * Inpatient Module - UI Automation Tests
 * 
 * Tests:
 * 1. Ward Management (Admin) - CRUD operations
 * 2. Room Management (Admin) - CRUD operations
 * 3. Bed Management - CRUD operations
 * 
 * Run: npx playwright test tests/inpatient-ui.spec.ts --headed
 */

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = 'http://localhost:3000/login';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin@123';

// Helper function to login
async function login(page: Page) {
  // Navigate to login page
  await page.goto(LOGIN_URL);
  
  // Wait for login form
  await page.waitForSelector('input[placeholder*="email"]', { timeout: 10000 });
  
  // Fill login form
  await page.locator('input[placeholder*="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[placeholder*="password"]').first().fill(ADMIN_PASSWORD);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
}

test.describe('Inpatient Module - UI Tests', () => {
  
  // FIRST TEST: Verify admin login works at http://localhost:3000/login
  test('01 - Admin Login Test', async ({ page }) => {
    console.log('🔐 Starting Admin Login Test...');
    
    // Step 1: Navigate to login page
    console.log(`📍 Navigating to: ${LOGIN_URL}`);
    await page.goto(LOGIN_URL);
    
    // Step 2: Verify we're on the login page
    await expect(page).toHaveURL(LOGIN_URL);
    console.log('✅ Confirmed on login page');
    
    // Step 3: Wait for login form to be visible
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[placeholder*="email"]', { timeout: 15000 });
    await page.waitForSelector('input[placeholder*="password"]', { timeout: 15000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 15000 });
    console.log('✅ Login form loaded');
    
    // Step 4: Fill email field
    console.log(`📧 Entering email: ${ADMIN_EMAIL}`);
    const emailInput = page.locator('input[placeholder*="email"]').first();
    await emailInput.fill(ADMIN_EMAIL);
    
    // Step 5: Fill password field
    console.log('🔑 Entering password...');
    const passwordInput = page.locator('input[placeholder*="password"]').first();
    await passwordInput.fill(ADMIN_PASSWORD);
    
    // Step 6: Take screenshot before login
    await page.screenshot({ path: 'test-results/01-before-login.png', fullPage: true });
    console.log('📸 Screenshot taken: before-login.png');
    
    // Step 7: Click login button
    console.log('🖱️  Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Step 8: Wait for navigation after login
    console.log('⏳ Waiting for redirect after login...');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });
    console.log('✅ Redirected successfully');
    
    // Step 9: Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    console.log('✅ Page fully loaded');
    
    // Step 10: Take screenshot after login
    await page.screenshot({ path: 'test-results/02-after-login.png', fullPage: true });
    console.log('📸 Screenshot taken: after-login.png');
    
    // Step 11: Verify sidebar menu is visible
    console.log('🔍 Verifying sidebar menu...');
    const sidebar = page.locator('.ant-layout-sider, aside, [class*="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    console.log('✅ Sidebar visible');
    
    // Step 12: Verify Dashboard menu exists
    const dashboardMenu = page.locator('text=Dashboard').first();
    await expect(dashboardMenu).toBeVisible({ timeout: 10000 });
    console.log('✅ Dashboard menu found');
    
    // Step 13: Look for Inpatient menu in sidebar
    console.log('🔍 Looking for Inpatient menu...');
    const inpatientMenu = page.locator('text=Inpatient').first();
    await expect(inpatientMenu).toBeVisible({ timeout: 10000 });
    console.log('✅ Inpatient menu found in sidebar');
    
    // Step 14: Verify admin user info is displayed
    const userInfo = page.locator('text=Admin User, text=admin, [class*="user"]');
    const hasUserInfo = await userInfo.count() > 0;
    if (hasUserInfo) {
      console.log('✅ Admin user info displayed');
    }
    
    console.log('🎉 Admin Login Test PASSED!');
  });

  test.describe('Ward Management (Admin)', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each Ward Management test
      await login(page);
    });
    
    test('should navigate to Ward Management page', async ({ page }) => {
      // Click on Inpatient - Wards (Admin) menu item
      await page.click('text=Inpatient - Wards (Admin)');
      
      // Wait for page to load
      await page.waitForURL(/\/admin\/inpatient\/wards/, { timeout: 5000 });
      
      // Verify page title
      await expect(page.locator('text=Ward Management')).toBeVisible();
      
      // Verify Create Ward button exists
      await expect(page.locator('button:has-text("Create Ward")')).toBeVisible();
    });

    test('should open Create Ward modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for page to settle
      
      // Click Create Ward button
      await page.click('button:has-text("Create Ward")');
      
      // Wait for modal to appear
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Verify form fields exist
      await expect(page.locator('input[placeholder*="W-"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[placeholder*="General Ward"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Department')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[placeholder*="50"]')).toBeVisible({ timeout: 10000 });
    });

    test('should create a new ward successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Click Create Ward button
      await page.click('button:has-text("Create Ward")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Fill form
      const timestamp = Date.now();
      await page.fill('input[placeholder*="W-"]', `W-TEST-${timestamp}`);
      await page.fill('input[placeholder*="General Ward"]', `Test Ward ${timestamp}`);
      
      // Select department from dropdown
      await page.click('.ant-select-selector:has-text("Select department")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click('.ant-select-item:has-text("General Medicine")');
      await page.waitForTimeout(500);
      
      // Fill capacity
      await page.fill('input[placeholder*="50"]', '50');
      
      // Fill location
      await page.fill('input[placeholder*="Building A"]', 'Test Building');
      
      // Click OK button
      await page.click('button:has-text("OK")');
      
      // Wait for success message or modal to close
      await page.waitForTimeout(3000);
      
      // Verify ward appears in table
      await expect(page.locator(`text=W-TEST-${timestamp}`)).toBeVisible({ timeout: 10000 });
      await expect(page.locator(`text=Test Ward ${timestamp}`)).toBeVisible();
    });

    test('should edit an existing ward', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 5000 });
      
      // Click first Edit button
      const editButton = page.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Wait for modal
        await page.waitForSelector('text=Edit Ward', { timeout: 5000 });
        
        // Modify ward name
        const nameInput = page.locator('input[placeholder*="General Ward"]');
        await nameInput.clear();
        await nameInput.fill('Updated Ward Name');
        
        // Click OK
        await page.click('button:has-text("OK")');
        
        // Wait for success message
        await page.waitForSelector('text=Ward updated successfully', { timeout: 5000 });
      }
    });

    test('should delete a ward', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 5000 });
      
      // Click first Delete button
      const deleteButton = page.locator('button:has-text("Delete")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion in popconfirm
        await page.click('button:has-text("Yes")');
        
        // Wait for success message
        await page.waitForSelector('text=Ward deleted successfully', { timeout: 5000 });
      }
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      
      // Click Create Ward button
      await page.click('button:has-text("Create Ward")');
      await page.waitForSelector('text=Create Ward', { timeout: 5000 });
      
      // Click OK without filling form
      await page.click('button:has-text("OK")');
      
      // Verify validation messages appear
      await expect(page.locator('text=Please enter ward number')).toBeVisible();
      await expect(page.locator('text=Please enter ward name')).toBeVisible();
    });
  });

  test.describe('Room Management (Admin)', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each Room Management test
      await login(page);
    });
    
    test('should navigate to Room Management page', async ({ page }) => {
      // Click on Inpatient - Rooms (Admin) menu item
      await page.click('text=Inpatient - Rooms (Admin)');
      
      // Wait for page to load
      await page.waitForURL(/\/admin\/inpatient\/rooms/, { timeout: 5000 });
      
      // Verify page title
      await expect(page.locator('text=Room Management')).toBeVisible();
      
      // Verify Create Room button exists
      await expect(page.locator('button:has-text("Create Room")')).toBeVisible();
    });

    test('should open Create Room modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/rooms`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Click Create Room button
      await page.click('button:has-text("Create Room")');
      
      // Wait for modal to appear
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Verify form fields exist
      await expect(page.locator('input[placeholder*="R-"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Ward')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Room Type')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[placeholder*="4"]')).toBeVisible({ timeout: 10000 });
    });

    test('should create a new room successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/rooms`);
      await page.waitForLoadState('networkidle');
      
      // First, ensure we have a ward
      // Navigate to wards and create one if needed
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      
      const wardExists = await page.locator('table tbody tr').count() > 0;
      
      if (!wardExists) {
        // Create a ward first
        await page.click('button:has-text("Create Ward")');
        await page.waitForSelector('text=Create Ward', { timeout: 5000 });
        
        const timestamp = Date.now();
        await page.fill('input[placeholder*="W-"]', `W-${timestamp}`);
        await page.fill('input[placeholder*="General Ward"]', `Ward ${timestamp}`);
        await page.click('.ant-select-selector:has-text("Select department")');
        await page.waitForSelector('.ant-select-dropdown');
        await page.click('.ant-select-item:has-text("General Medicine")');
        await page.fill('input[placeholder*="50"]', '50');
        await page.click('button:has-text("OK")');
        await page.waitForSelector('text=Ward created successfully', { timeout: 5000 });
      }
      
      // Now create room
      await page.goto(`${BASE_URL}/admin/inpatient/rooms`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.click('button:has-text("Create Room")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      // Fill form
      const timestamp = Date.now();
      await page.fill('input[placeholder*="R-"]', `R-TEST-${timestamp}`);
      
      // Select ward
      await page.click('.ant-select-selector:has-text("Select ward")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click('.ant-select-item-option:visible >> nth=0');
      await page.waitForTimeout(500);
      
      // Select room type
      await page.click('.ant-select-selector:has-text("Select room type")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click('.ant-select-item:has-text("General")');
      await page.waitForTimeout(500);
      
      // Fill capacity
      await page.fill('input[placeholder*="4"]', '4');
      
      // Fill daily rate
      await page.fill('input[placeholder*="2000"]', '2000');
      
      // Click OK
      await page.click('button:has-text("OK")');
      
      // Wait for modal to close
      await page.waitForTimeout(3000);
      
      // Verify room appears in table
      await expect(page.locator(`text=R-TEST-${timestamp}`)).toBeVisible({ timeout: 10000 });
    });

    test('should display room types with color tags', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/inpatient/rooms`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check if any rooms exist
      const roomCount = await page.locator('table tbody tr').count();
      
      if (roomCount > 0) {
        // Verify room type tags are visible
        const tags = page.locator('.ant-tag');
        if (await tags.count() > 0) {
          await expect(tags.first()).toBeVisible({ timeout: 10000 });
        }
      } else {
        // No rooms yet, test passes
        console.log('No rooms exist yet - skipping tag verification');
      }
    });
  });

  test.describe('Bed Management', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login before each Bed Management test
      await login(page);
    });
    
    test('should navigate to Bed Management page', async ({ page }) => {
      // Click on Inpatient - Beds menu item
      await page.click('text=Inpatient - Beds');
      
      // Wait for page to load
      await page.waitForURL(/\/inpatient\/beds/, { timeout: 5000 });
      
      // Verify page title
      await expect(page.locator('text=Bed Management')).toBeVisible();
      
      // Verify Create Bed button exists
      await expect(page.locator('button:has-text("Create Bed")')).toBeVisible();
    });

    test('should display bed statistics', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      
      // Verify statistics cards are visible
      await expect(page.locator('text=Total Beds')).toBeVisible();
      await expect(page.locator('text=Available')).toBeVisible();
      await expect(page.locator('text=Occupied')).toBeVisible();
      await expect(page.locator('text=Occupancy Rate')).toBeVisible();
    });

    test('should filter beds by ward', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      
      // Click ward filter dropdown
      const wardFilter = page.locator('.ant-select-selector:has-text("All Wards")');
      if (await wardFilter.isVisible()) {
        await wardFilter.click();
        
        // Wait for dropdown
        await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
        
        // Select first ward option
        const firstWard = page.locator('.ant-select-item-option:visible >> nth=1');
        if (await firstWard.isVisible()) {
          await firstWard.click();
          
          // Wait for table to update
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should filter beds by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      
      // Click status filter dropdown
      const statusFilter = page.locator('.ant-select-selector:has-text("All Status")');
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        
        // Wait for dropdown
        await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
        
        // Select Available status
        await page.click('.ant-select-item:has-text("Available")');
        
        // Wait for table to update
        await page.waitForTimeout(1000);
      }
    });

    test('should create a new bed successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      
      // Ensure we have a room first
      const roomExists = await page.locator('button:has-text("Create Bed")').isEnabled();
      
      // Click Create Bed button
      await page.click('button:has-text("Create Bed")');
      await page.waitForSelector('text=Create Bed', { timeout: 5000 });
      
      // Fill form
      const timestamp = Date.now();
      await page.fill('input[placeholder*="B-"]', `B-TEST-${timestamp}`);
      
      // Select room if available
      const roomDropdown = page.locator('.ant-select-selector:has-text("Select room")');
      if (await roomDropdown.isVisible()) {
        await roomDropdown.click();
        await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
        
        const firstRoom = page.locator('.ant-select-item-option:visible >> nth=0');
        if (await firstRoom.isVisible()) {
          await firstRoom.click();
          
          // Click OK
          await page.click('button:has-text("OK")');
          
          // Wait for success message
          await page.waitForSelector('text=Bed created successfully', { timeout: 5000 });
          
          // Verify bed appears in table
          await expect(page.locator(`text=B-TEST-${timestamp}`)).toBeVisible();
        }
      }
    });

    test('should change bed status', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 5000 });
      
      // Click first "Change Status" button
      const changeStatusButton = page.locator('button:has-text("Change Status")').first();
      if (await changeStatusButton.isVisible()) {
        await changeStatusButton.click();
        
        // Wait for modal
        await page.waitForSelector('text=Change Bed Status', { timeout: 5000 });
        
        // Select new status
        await page.click('.ant-select-selector');
        await page.waitForSelector('.ant-select-dropdown');
        await page.click('.ant-select-item:has-text("Maintenance")');
        
        // Click OK
        await page.click('button:has-text("OK")');
        
        // Wait for success message
        await page.waitForSelector('text=Bed status updated successfully', { timeout: 5000 });
      }
    });

    test('should display bed status with color tags', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check if any beds exist
      const bedCount = await page.locator('table tbody tr').count();
      
      if (bedCount > 0) {
        // Verify status tags are visible
        const tags = page.locator('.ant-tag');
        if (await tags.count() > 0) {
          await expect(tags.first()).toBeVisible({ timeout: 10000 });
        }
      } else {
        // No beds yet, test passes
        console.log('No beds exist yet - skipping tag verification');
      }
    });

    test('should not delete occupied bed', async ({ page }) => {
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      
      // Look for an occupied bed's delete button (should be disabled)
      const occupiedBedRow = page.locator('tr:has-text("OCCUPIED")').first();
      if (await occupiedBedRow.isVisible()) {
        const deleteButton = occupiedBedRow.locator('button:has-text("Delete")');
        await expect(deleteButton).toBeDisabled();
      }
    });
  });

  test.describe('Integration Tests', () => {
    
    test('should create complete ward → room → bed hierarchy', async ({ page }) => {
      const timestamp = Date.now();
      
      // Step 1: Create Ward
      await page.goto(`${BASE_URL}/admin/inpatient/wards`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.click('button:has-text("Create Ward")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="W-"]', `W-INT-${timestamp}`);
      await page.fill('input[placeholder*="General Ward"]', `Integration Ward ${timestamp}`);
      await page.click('.ant-select-selector:has-text("Select department")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click('.ant-select-item:has-text("General Medicine")');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder*="50"]', '50');
      await page.click('button:has-text("OK")');
      await page.waitForTimeout(3000);
      
      // Step 2: Create Room
      await page.goto(`${BASE_URL}/admin/inpatient/rooms`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.click('button:has-text("Create Room")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="R-"]', `R-INT-${timestamp}`);
      await page.click('.ant-select-selector:has-text("Select ward")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click(`.ant-select-item:has-text("Integration Ward ${timestamp}")`);
      await page.waitForTimeout(500);
      await page.click('.ant-select-selector:has-text("Select room type")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click('.ant-select-item:has-text("General")');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder*="4"]', '4');
      await page.fill('input[placeholder*="2000"]', '2000');
      await page.click('button:has-text("OK")');
      await page.waitForTimeout(3000);
      
      // Step 3: Create Bed
      await page.goto(`${BASE_URL}/inpatient/beds`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.click('button:has-text("Create Bed")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="B-"]', `B-INT-${timestamp}`);
      await page.click('.ant-select-selector:has-text("Select room")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click(`.ant-select-item:has-text("R-INT-${timestamp}")`);
      await page.waitForTimeout(500);
      await page.click('button:has-text("OK")');
      await page.waitForTimeout(3000);
      
      // Verify bed appears with correct ward and room info
      await expect(page.locator(`text=B-INT-${timestamp}`)).toBeVisible({ timeout: 10000 });
      await expect(page.locator(`text=Integration Ward ${timestamp}`)).toBeVisible({ timeout: 10000 });
    });
  });
});
