import { test, expect, Page } from '@playwright/test';

/**
 * Inpatient Module - Sequential Creation Test
 * 
 * Creates in exact order:
 * 1. WARDS: W-001, W-002, W-003
 * 2. ROOMS: R-101, R-102, R-103, R-201
 * 3. BEDS: 11 beds total
 * 
 * Run: npx playwright test tests/inpatient-sequential.spec.ts --headed
 */

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = 'http://localhost:3000/login';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin@123';

// Helper function to login
async function login(page: Page) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('input[placeholder*="email"]', { timeout: 10000 });
  await page.locator('input[placeholder*="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[placeholder*="password"]').first().fill(ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Inpatient Sequential Creation', () => {
  
  test.beforeAll(async ({ browser }) => {
    console.log('🚀 Starting Inpatient Sequential Creation Test');
  });

  test('Step 1: Create 3 Wards', async ({ page }) => {
    await login(page);
    
    // Navigate to Wards
    await page.goto(`${BASE_URL}/admin/inpatient/wards`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const wards = [
      { number: 'W-0q01', name: 'General Ward', dept: 'General Medicine', capacity: 50 },
      { number: 'W-012', name: 'Cardiology Ward', dept: 'Cardiology', capacity: 30 },
      { number: 'W-0103', name: 'Pediatric Ward', dept: 'Pediatrics', capacity: 40 },
    ];
    
    for (const ward of wards) {
      console.log(`Creating ward: ${ward.number} - ${ward.name}`);
      
      await page.click('button:has-text("Create Ward")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="W-"]', ward.number);
      await page.fill('input[placeholder*="General Ward"]', ward.name);
      
      await page.click('.ant-select-selector:has-text("Select department")');
      await page.waitForSelector('.ant-select-dropdown', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.click(`.ant-select-item:has-text("${ward.dept}")`);
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="50"]', ward.capacity.toString());
      await page.click('button:has-text("OK")');
      await page.waitForTimeout(3000);
      
      // Verify ward created
      await expect(page.locator(`text=${ward.number}`)).toBeVisible({ timeout: 10000 });
      console.log(`✅ Ward created: ${ward.number}`);
    }
    
    console.log('✅ All 3 wards created successfully!');
  });

  test('Step 2: Create 4 Rooms', async ({ page }) => {
    await login(page);
    
    // Navigate to Rooms
    await page.goto(`${BASE_URL}/admin/inpatient/rooms`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const rooms = [
      { number: 'R-1011', ward: 'General Ward', type: 'General', capacity: 4, rate: 2000 },
      { number: 'R-1012', ward: 'General Ward', type: 'Semi-Private', capacity: 2, rate: 3000 },
      { number: 'R-103', ward: 'General Ward', type: 'Private', capacity: 1, rate: 5000 },
      { number: 'R-2101', ward: 'Cardiology Ward', type: 'ICU', capacity: 4, rate: 10000 },
    ];
    
    for (const room of rooms) {
      console.log(`Creating room: ${room.number} - ${room.type}`);
      
      await page.click('button:has-text("Create Room")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="R-"]', room.number);
      
      // Select ward
      await page.click('.ant-select-selector:has-text("Select ward")');
      await page.waitForTimeout(1500);
      await page.getByText(room.ward, { exact: true }).click();
      await page.waitForTimeout(500);
      
      // Select room type
      await page.click('.ant-select-selector:has-text("Select room type")');
      await page.waitForTimeout(1500);
      await page.getByText(room.type, { exact: true }).click();
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="4"]', room.capacity.toString());
      await page.fill('input[placeholder*="2000"]', room.rate.toString());
      
      await page.click('button:has-text("OK")');
      await page.waitForTimeout(3000);
      
      // Verify room created
      await expect(page.locator(`text=${room.number}`)).toBeVisible({ timeout: 10000 });
      console.log(`✅ Room created: ${room.number}`);
    }
    
    console.log('✅ All 4 rooms created successfully!');
  });

  test('Step 3: Create 11 Beds', async ({ page }) => {
    await login(page);
    
    // Navigate to Beds
    await page.goto(`${BASE_URL}/inpatient/beds`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const beds = [
      // R-1011: 4 beds
      { number: 'B-1011-A', room: 'R-1011' },
      { number: 'B-1011-B', room: 'R-1011' },
      { number: 'B-1011-C', room: 'R-1011' },
      { number: 'B-1011-D', room: 'R-1011' },
      // R-1012: 2 beds
      { number: 'B-1012-A', room: 'R-1012' },
      { number: 'B-1012-B', room: 'R-1012' },
      // R-103: 1 bed
      { number: 'B-103-A', room: 'R-103' },
      // R-2101: 4 beds
      { number: 'B-2101-A', room: 'R-2101' },
      { number: 'B-2101-B', room: 'R-2101' },
      { number: 'B-2101-C', room: 'R-2101' },
      { number: 'B-2101-D', room: 'R-2101' },
    ];
    
    for (const bed of beds) {
      console.log(`Creating bed: ${bed.number}`);
      
      await page.click('button:has-text("Create Bed")');
      await page.waitForSelector('.ant-modal', { timeout: 10000 });
      await page.waitForTimeout(1000);
      
      await page.fill('input[placeholder*="B-"]', bed.number);
      
      // Select room
      await page.click('.ant-select-selector:has-text("Select room")');
      await page.waitForTimeout(1500);
      await page.getByText(bed.room, { exact: true }).click();
      await page.waitForTimeout(500);
      
      await page.click('button:has-text("OK")');
      await page.waitForTimeout(3000);
      
      // Verify bed created
      await expect(page.locator(`text=${bed.number}`)).toBeVisible({ timeout: 10000 });
      console.log(`✅ Bed created: ${bed.number}`);
    }
    
    console.log('✅ All 11 beds created successfully!');
    
    // Verify final statistics
    await page.waitForTimeout(2000);
    const totalBeds = await page.locator('text=Total Beds').locator('..').locator('text=11').count();
    if (totalBeds > 0) {
      console.log('✅ Statistics verified: 11 beds total');
    }
  });

  test.afterAll(async () => {
    console.log('🎉 Sequential creation test completed!');
    console.log('✅ 3 Wards created');
    console.log('✅ 4 Rooms created');
    console.log('✅ 11 Beds created');
  });
});
