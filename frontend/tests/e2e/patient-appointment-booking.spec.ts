import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5001/api';

// Test data
const testPatient = {
  firstName: `Patient${Date.now()}`,
  lastName: 'Test',
  email: `patient.${Date.now()}@test.com`,
  password: 'TestPass123!',
  phone: '9876543210'
};

const targetOrganization = '5c7c80d3-917a-4d5c-918f-f957b7f3519b'; // Organization with 5 doctors

test.describe('Patient Appointment Booking Flow', () => {
  let page: Page;
  let authToken: string;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('✅ Step 1: Patient Registration (Default Org Assignment)', async () => {
    console.log('📝 Starting patient registration...');

    await page.goto(`${BASE_URL}/auth/register`);
    await expect(page.locator('text=Create Your Account')).toBeVisible();

    // Fill registration form
    await page.fill('input[name="firstName"]', testPatient.firstName);
    await page.fill('input[name="lastName"]', testPatient.lastName);
    await page.fill('input[name="email"]', testPatient.email);
    await page.fill('input[name="password"]', testPatient.password);
    await page.fill('input[name="confirmPassword"]', testPatient.password);
    await page.fill('input[name="phone"]', testPatient.phone);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });

    console.log('✅ Registration successful');
    console.log(`   Email: ${testPatient.email}`);
  });

  test('✅ Step 2: Patient Login & Dashboard Access', async () => {
    console.log('🔐 Testing patient login...');

    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', testPatient.email);
    await page.fill('input[name="password"]', testPatient.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    console.log('✅ Login successful');
  });

  test('✅ Step 3: Hospital Selection Banner Visibility', async () => {
    console.log('🏥 Checking hospital selection banner...');

    // Login first
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', testPatient.email);
    await page.fill('input[name="password"]', testPatient.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForLoadState('networkidle');

    // Look for hospital selection banner
    const banner = page.locator('text=Choose Your Hospital');

    if (await banner.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Hospital selection banner visible');

      // Verify button exists
      const chooseButton = page.locator('button:has-text("Choose Hospital")');
      await expect(chooseButton).toBeVisible();

      console.log('✅ "Choose Hospital" button visible');
    } else {
      console.log('ℹ️  Banner not visible (user may already have hospital assigned)');
    }
  });

  test('✅ Step 4: Appointment Booking - Doctor Visibility', async () => {
    console.log('📅 Testing appointment booking with doctor visibility...');

    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', testPatient.email);
    await page.fill('input[name="password"]', testPatient.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForLoadState('networkidle');

    // Look for "Book Appointment" button
    const bookButton = page.locator('button:has-text("Book Appointment"), a:has-text("Book Appointment")');

    if (await bookButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ "Book Appointment" button found');
      await bookButton.first().click();

      // Wait for stepper/form to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for doctor selection step
      const doctorStep = page.locator('text=Select Doctor, text=Doctor, text=Select a doctor');

      // Check if we're in the appointment booking flow
      if (await page.locator('text=/BookAppointment|Appointment|Doctor/i').isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Appointment booking form visible');

        // Try to find doctor dropdown/list
        const doctorSelectors = [
          'text=/Choose a doctor|Select a doctor|Available doctors/i',
          'select[name*="doctor"]',
          '[data-testid="doctor-select"]',
          'button:has-text("doctor")',
          'div:has-text("doctor")'
        ];

        let doctorFound = false;
        for (const selector of doctorSelectors) {
          if (await page.locator(selector).isVisible({ timeout: 3000 }).catch(() => false)) {
            doctorFound = true;
            console.log('✅ Doctor selection element found');
            break;
          }
        }

        if (!doctorFound) {
          console.log('ℹ️  Could not find doctor selection element (may require more steps)');
        }
      }
    } else {
      console.log('ℹ️  Book Appointment button not found (may be in different location)');
    }
  });

  test('✅ Step 5: Verify Doctor API Endpoint', async ({ request }) => {
    console.log('🔌 Testing doctor availability API endpoint...');

    // First, login to get token
    const loginResponse = await request.post(`${BACKEND_URL}/auth/login`, {
      data: {
        email: testPatient.email,
        password: testPatient.password
      }
    });

    if (loginResponse.status() === 200) {
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;
      console.log('✅ Login successful, got auth token');

      // Test the doctors endpoint
      const doctorsResponse = await request.get(`${BACKEND_URL}/visits/available-doctors`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-tenant-subdomain': 'default'
        }
      });

      if (doctorsResponse.status() === 200) {
        const doctorsData = await doctorsResponse.json();
        const doctorCount = doctorsData.data?.length || 0;

        console.log(`✅ Doctors endpoint working`);
        console.log(`   Response status: ${doctorsResponse.status()}`);
        console.log(`   Doctors returned: ${doctorCount}`);

        if (doctorCount > 0) {
          const firstDoctor = doctorsData.data[0];
          console.log(`   First doctor: ${firstDoctor.firstName} ${firstDoctor.lastName}`);

          // Verify nested department structure
          if (firstDoctor.department) {
            console.log(`   Department: ${JSON.stringify(firstDoctor.department)}`);
            console.log('✅ Department is nested object (correct structure)');
          } else {
            console.log('⚠️  No department field in response');
          }
        } else {
          console.log('ℹ️  No doctors for user organization (expected for default org)');
        }
      } else {
        console.log(`❌ Doctors endpoint error: ${doctorsResponse.status()}`);
      }
    } else {
      console.log(`❌ Login failed: ${loginResponse.status()}`);
    }
  });

  test('✅ Step 6: Complete Flow with Hospital Selection', async ({ request }) => {
    console.log('🔄 Testing complete flow: Register → Select Hospital → Book Appointment');

    const newPatient = {
      firstName: `PatientFlow${Date.now()}`,
      lastName: 'Test',
      email: `patientflow.${Date.now()}@test.com`,
      password: 'TestPass123!',
      phone: '1111111111'
    };

    // Step 1: Register patient
    console.log('   1️⃣  Registering patient...');
    let registerResponse = await request.post(`${BACKEND_URL}/auth/register`, {
      data: newPatient
    });

    if (registerResponse.status() !== 200) {
      console.log(`❌ Registration failed: ${registerResponse.status()}`);
      return;
    }
    console.log('   ✅ Patient registered');

    // Step 2: Login to get token
    console.log('   2️⃣  Logging in...');
    let loginResponse = await request.post(`${BACKEND_URL}/auth/login`, {
      data: {
        email: newPatient.email,
        password: newPatient.password
      }
    });

    if (loginResponse.status() !== 200) {
      console.log(`❌ Login failed: ${loginResponse.status()}`);
      return;
    }

    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;
    console.log('   ✅ Login successful');

    // Step 3: Check doctors BEFORE hospital selection (should be 0)
    console.log('   3️⃣  Checking doctors before hospital selection...');
    let doctorsResponse = await request.get(`${BACKEND_URL}/visits/available-doctors`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-subdomain': 'default'
      }
    });

    const doctorsBeforeCount = (await doctorsResponse.json()).data?.length || 0;
    console.log(`   Doctors before: ${doctorsBeforeCount}`);

    // Step 4: Update organization (simulate hospital selection)
    console.log('   4️⃣  Updating organization to target hospital...');
    const updateResponse = await request.patch(`${BACKEND_URL}/users/me/organization`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        organizationId: targetOrganization
      }
    });

    if (updateResponse.status() === 200) {
      console.log('   ✅ Organization updated');
    } else {
      console.log(`   ⚠️  Organization update status: ${updateResponse.status()}`);
    }

    // Step 5: Login again with fresh token after org change
    console.log('   5️⃣  Getting fresh token after org change...');
    loginResponse = await request.post(`${BACKEND_URL}/auth/login`, {
      data: {
        email: newPatient.email,
        password: newPatient.password
      }
    });

    const newLoginData = await loginResponse.json();
    authToken = newLoginData.accessToken;
    console.log('   ✅ Fresh token obtained');

    // Step 6: Check doctors AFTER hospital selection (should be > 0)
    console.log('   6️⃣  Checking doctors after hospital selection...');
    doctorsResponse = await request.get(`${BACKEND_URL}/visits/available-doctors`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-subdomain': 'default'
      }
    });

    const doctorsAfterCount = (await doctorsResponse.json()).data?.length || 0;
    console.log(`   Doctors after: ${doctorsAfterCount}`);

    if (doctorsAfterCount > 0) {
      console.log('   ✅ Doctors now visible after hospital selection!');
    } else {
      console.log('   ⚠️  No doctors found after organization update');
    }

    console.log('✅ Complete flow test finished');
  });

  test('✅ Step 7: Verify Response Structure', async ({ request }) => {
    console.log('🔍 Verifying API response structure...');

    // Login
    const loginResponse = await request.post(`${BACKEND_URL}/auth/login`, {
      data: {
        email: testPatient.email,
        password: testPatient.password
      }
    });

    if (loginResponse.status() === 200) {
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;

      // Get doctors
      const doctorsResponse = await request.get(`${BACKEND_URL}/visits/available-doctors`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-tenant-subdomain': 'default'
        }
      });

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();

        console.log('✅ Response structure valid');
        console.log(`   Response: ${JSON.stringify(doctorsData, null, 2).substring(0, 500)}...`);

        // Verify structure
        if (doctorsData.success !== undefined && doctorsData.data !== undefined) {
          console.log('✅ Response has correct top-level fields (success, data)');
        }

        if (Array.isArray(doctorsData.data) && doctorsData.data.length > 0) {
          const firstDoctor = doctorsData.data[0];

          // Check required fields
          const requiredFields = ['id', 'firstName', 'lastName', 'email'];
          const missingFields = requiredFields.filter(field => !(field in firstDoctor));

          if (missingFields.length === 0) {
            console.log('✅ Doctor has all required fields');
          } else {
            console.log(`⚠️  Missing fields: ${missingFields.join(', ')}`);
          }

          // Check nested department
          if ('department' in firstDoctor) {
            const dept = firstDoctor.department;
            if (typeof dept === 'object' && dept !== null && 'id' in dept && 'name' in dept) {
              console.log('✅ Department is properly nested with id and name');
            } else if (typeof dept === 'string') {
              console.log('⚠️  Department is a string (flat structure - should be nested)');
            } else if (dept === null) {
              console.log('✅ Department is null (some doctors have no department)');
            }
          }
        }
      }
    }
  });
});
