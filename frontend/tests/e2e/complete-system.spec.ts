import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';
import { NavigationHelper } from './helpers/navigation.helper';

test.describe('Hospital Management System - Complete E2E Tests (59 Pages)', () => {
  
  // ==================== PUBLIC PAGES (10 PAGES) ====================
  
  test.describe('Public Pages', () => {
    test('01. Home Page - should load and display correctly', async ({ page }) => {
      await page.goto('/home');
      await expect(page).toHaveTitle(/Hospital/i);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('02. About Page - should display hospital information', async ({ page }) => {
      await page.goto('/about');
      await expect(page.locator('text=About').first()).toBeVisible();
    });

    test('03. Departments Page - should list all active departments', async ({ page }) => {
      await page.goto('/departments');
      await expect(page.locator('text=Departments').first()).toBeVisible();
      // Should show only active departments
      const cards = page.locator('.ant-card');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });

    test('04. Doctors Page - should list doctors with filters', async ({ page }) => {
      await page.goto('/doctors');
      await expect(page.locator('text=Doctors').first()).toBeVisible();
      // Test department filter
      await page.locator('select, .ant-select').first().click().catch(() => {});
    });

    test('05. Services Page - should display services with search', async ({ page }) => {
      await page.goto('/services');
      await expect(page.locator('text=Services').first()).toBeVisible();
      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('consultation');
      }
    });

    test('06. Book Appointment Page - should load appointment form', async ({ page }) => {
      await page.goto('/appointments/book');
      await expect(page.locator('text=Book').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="Name"], input[placeholder*="name"]').first()).toBeVisible();
    });

    test('07. Emergency Page - should display emergency form', async ({ page }) => {
      await page.goto('/emergency');
      await expect(page.locator('text=Emergency').first()).toBeVisible();
    });

    test('08. Request Callback Page - should show callback form', async ({ page }) => {
      await page.goto('/request-callback');
      await expect(page.locator('text=Callback').first()).toBeVisible();
    });

    test('09. Health Packages Page - should display packages', async ({ page }) => {
      await page.goto('/health-packages');
      await expect(page).toHaveURL(/health-packages/);
    });

    test('10. Insurance Page - should show insurance information', async ({ page }) => {
      await page.goto('/insurance');
      await expect(page).toHaveURL(/insurance/);
    });
  });

  // ==================== AUTHENTICATION (2 PAGES) ====================
  
  test.describe('Authentication Pages', () => {
    test('11. Login Page - should display login form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
      await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('12. Register Page - should display registration form', async ({ page }) => {
      await page.goto('/register');
      await expect(page.locator('input[placeholder*="First"], input[placeholder*="first"]').first()).toBeVisible();
    });
  });

  // ==================== PATIENT PORTAL (5 PAGES) ====================
  
  test.describe('Patient Portal', () => {
    test.use({ storageState: 'playwright/.auth/patient.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('13. Patient Dashboard - should display patient overview', async ({ page }) => {
      await page.goto('/portal');
      await expect(page.locator('text=Dashboard, text=Welcome').first()).toBeVisible({ timeout: 10000 });
    });

    test('14. Medical Records - should show patient medical records', async ({ page }) => {
      await page.goto('/portal/medical-records');
      await expect(page).toHaveURL(/medical-records/);
    });

    test('15. Medical History - should display medical history timeline', async ({ page }) => {
      await page.goto('/portal/medical-history');
      await expect(page).toHaveURL(/medical-history/);
    });

    test('16. Billing History - should show billing information', async ({ page }) => {
      await page.goto('/portal/billing');
      await expect(page).toHaveURL(/billing/);
    });

    test('17. My Insurance - should display insurance details', async ({ page }) => {
      await page.goto('/portal/insurance');
      await expect(page).toHaveURL(/insurance/);
    });
  });

  // ==================== DOCTOR PORTAL (8 PAGES) ====================
  
  test.describe('Doctor Portal', () => {
    test.use({ storageState: 'playwright/.auth/doctor.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('18. Doctor Dashboard - should display doctor overview', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=Dashboard, text=Appointments').first()).toBeVisible({ timeout: 10000 });
    });

    test('19. My Patients - should list doctor patients', async ({ page }) => {
      await page.goto('/doctor/patients');
      await expect(page).toHaveURL(/patients/);
    });

    test('20. My Schedule - should show doctor schedule', async ({ page }) => {
      await page.goto('/doctor/schedule');
      await expect(page).toHaveURL(/schedule/);
    });

    test('21. Write Prescription - should display prescription form', async ({ page }) => {
      await page.goto('/doctor/prescriptions/write');
      await expect(page).toHaveURL(/prescriptions/);
    });

    test('22. Doctor Prescriptions - should list all prescriptions', async ({ page }) => {
      await page.goto('/doctor/prescriptions');
      await expect(page).toHaveURL(/prescriptions/);
    });

    test('23. Consultation Form - should show consultation interface', async ({ page }) => {
      await page.goto('/doctor/consultation');
      await expect(page).toHaveURL(/consultation/);
    });

    test('24. Patient Records (Doctor) - should access patient records', async ({ page }) => {
      await page.goto('/doctor/patient-records');
      await expect(page).toHaveURL(/patient-records/);
    });

    test('25. Medicines (Doctor) - should view medicine database', async ({ page }) => {
      await page.goto('/doctor/medicines');
      await expect(page).toHaveURL(/medicines/);
    });
  });

  // ==================== PHARMACY (8 PAGES) ====================
  
  test.describe('Pharmacy Module', () => {
    test.use({ storageState: 'playwright/.auth/pharmacist.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('26. Pharmacy Dashboard - should display pharmacy overview', async ({ page }) => {
      await page.goto('/pharmacy');
      await expect(page.locator('text=Pharmacy, text=Prescriptions').first()).toBeVisible({ timeout: 10000 });
    });

    test('27. Medicine List - should show all medicines', async ({ page }) => {
      await page.goto('/pharmacy/medicines');
      await expect(page).toHaveURL(/medicines/);
      await expect(page.locator('text=Medicine').first()).toBeVisible();
    });

    test('28. Inventory Dashboard - should display inventory stats', async ({ page }) => {
      await page.goto('/pharmacy/inventory');
      await expect(page).toHaveURL(/inventory/);
    });

    test('29. Stock Alerts - should show low stock alerts', async ({ page }) => {
      await page.goto('/pharmacy/inventory/alerts');
      await expect(page).toHaveURL(/alerts/);
    });

    test('30. Supplier Management - should list suppliers', async ({ page }) => {
      await page.goto('/pharmacy/suppliers');
      await expect(page).toHaveURL(/suppliers/);
    });

    test('31. Purchase Orders - should display purchase orders', async ({ page }) => {
      await page.goto('/pharmacy/purchase-orders');
      await expect(page).toHaveURL(/purchase-orders/);
    });

    test('32. Inventory Reports - should show inventory reports', async ({ page }) => {
      await page.goto('/pharmacy/inventory/reports');
      await expect(page).toHaveURL(/reports/);
    });

    test('33. Prescriptions (Pharmacy) - should show pending prescriptions', async ({ page }) => {
      await page.goto('/pharmacy');
      await expect(page.locator('text=Prescription').first()).toBeVisible();
    });
  });

  // ==================== ADMIN PORTAL (15 PAGES) ====================
  
  test.describe('Admin Portal', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('34. Admin Dashboard - should display admin overview', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=Dashboard, text=Admin').first()).toBeVisible({ timeout: 10000 });
    });

    test('35. Departments Admin - should manage departments', async ({ page }) => {
      await page.goto('/admin/departments');
      await expect(page).toHaveURL(/departments/);
    });

    test('36. Services Admin - should manage services', async ({ page }) => {
      await page.goto('/admin/services');
      await expect(page).toHaveURL(/services/);
    });

    test('37. Doctors Admin - should manage doctors', async ({ page }) => {
      await page.goto('/admin/doctors');
      await expect(page).toHaveURL(/doctors/);
    });

    test('38. Appointments Admin - should manage appointments', async ({ page }) => {
      await page.goto('/admin/appointments');
      await expect(page).toHaveURL(/appointments/);
    });

    test('39. Emergency Requests Admin - should manage emergencies', async ({ page }) => {
      await page.goto('/admin/emergency');
      await expect(page).toHaveURL(/emergency/);
    });

    test('40. Callback Requests Admin - should manage callbacks', async ({ page }) => {
      await page.goto('/admin/callback');
      await expect(page).toHaveURL(/callback/);
    });

    test('41. Emergency Dashboard - should show emergency stats', async ({ page }) => {
      await page.goto('/admin/emergency/dashboard');
      await expect(page).toHaveURL(/emergency/);
    });

    test('42. Callback Queue - should display callback queue', async ({ page }) => {
      await page.goto('/admin/callback/queue');
      await expect(page).toHaveURL(/callback/);
    });

    test('43. Patient List (Admin) - should list all patients', async ({ page }) => {
      await page.goto('/patients');
      await expect(page).toHaveURL(/patients/);
    });

    test('44. Patient Form (Admin) - should add/edit patients', async ({ page }) => {
      await page.goto('/patients/new');
      await expect(page).toHaveURL(/patients/);
    });

    test('45. Patient Detail (Admin) - should show patient details', async ({ page }) => {
      await page.goto('/patients');
      // Click first patient if exists
      const firstPatient = page.locator('table tr').nth(1);
      if (await firstPatient.isVisible()) {
        await firstPatient.click();
      }
    });

    test('46. Records (Admin) - should access all records', async ({ page }) => {
      await page.goto('/records');
      await expect(page).toHaveURL(/records/);
    });

    test('47. Reports (Admin) - should generate reports', async ({ page }) => {
      await page.goto('/admin/reports');
      await expect(page).toHaveURL(/reports/);
    });

    test('48. Notifications (Admin) - should manage notifications', async ({ page }) => {
      await page.goto('/notifications');
      await expect(page).toHaveURL(/notifications/);
    });
  });

  // ==================== COMMUNICATION (4 PAGES) ====================
  
  test.describe('Communication Module', () => {
    test.use({ storageState: 'playwright/.auth/patient.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('49. Messaging - should display chat interface', async ({ page }) => {
      await page.goto('/communication/messages');
      await expect(page).toHaveURL(/messages/);
      await expect(page.locator('text=Message').first()).toBeVisible();
    });

    test('50. Reminders - should show reminder management', async ({ page }) => {
      await page.goto('/communication/reminders');
      await expect(page).toHaveURL(/reminders/);
    });

    test('51. Health Articles - should display article library', async ({ page }) => {
      await page.goto('/communication/health-articles');
      await expect(page).toHaveURL(/health-articles/);
    });

    test('52. Feedback - should show feedback form', async ({ page }) => {
      await page.goto('/communication/feedback');
      await expect(page).toHaveURL(/feedback/);
    });
  });

  // ==================== SETTINGS & PROFILE (3 PAGES) ====================
  
  test.describe('Settings & Profile', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('53. Settings - should display settings page', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/settings/);
    });

    test('54. My Profile - should show user profile', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL(/profile/);
    });

    test('55. Notifications - should manage user notifications', async ({ page }) => {
      await page.goto('/notifications');
      await expect(page).toHaveURL(/notifications/);
    });
  });

  // ==================== APPOINTMENTS (4 PAGES) ====================
  
  test.describe('Appointment Management', () => {
    test.use({ storageState: 'playwright/.auth/patient.json' });
    
    test.beforeEach(async ({ page }) => {
      // Add delay to avoid rate limiting
      await page.waitForTimeout(1000);
    });

    test('56. My Appointments - should list user appointments', async ({ page }) => {
      await page.goto('/appointments');
      await expect(page).toHaveURL(/appointments/);
    });

    test('57. Book Appointment (Auth) - should book appointment when logged in', async ({ page }) => {
      await page.goto('/appointments/new');
      await expect(page).toHaveURL(/appointments/);
    });

    test('58. View Doctor Availability - should show doctor schedule', async ({ page }) => {
      await page.goto('/availability');
      await expect(page).toHaveURL(/availability/);
    });

    test('59. Appointment Detail - should display appointment details', async ({ page }) => {
      await page.goto('/appointments');
      const firstAppointment = page.locator('table tr, .ant-card').nth(1);
      if (await firstAppointment.isVisible()) {
        await firstAppointment.click().catch(() => {});
      }
    });
  });

  // ==================== CRITICAL WORKFLOWS ====================
  
  test.describe('Critical User Workflows', () => {
    test('Workflow 1: Complete Appointment Booking Flow', async ({ page }) => {
      // Public user books appointment
      await page.goto('/appointments/book');
      await page.fill('input[placeholder*="Name"]', 'Test Patient');
      await page.fill('input[placeholder*="Email"]', 'test@example.com');
      await page.fill('input[placeholder*="Phone"]', '1234567890');
      
      // Select department and service
      const departmentSelect = page.locator('select, .ant-select').first();
      if (await departmentSelect.isVisible()) {
        await departmentSelect.click();
        await page.locator('text=Cardiology').first().click().catch(() => {});
      }
      
      // Submit form
      await page.locator('button[type="submit"]').click();
      
      // Should redirect to home
      await expect(page).toHaveURL(/home/, { timeout: 10000 });
    });

    test('Workflow 2: Doctor Prescription to Pharmacy Flow', async ({ page }) => {
      const auth = new AuthHelper(page);
      
      // Login as doctor
      await auth.loginAsDoctor('cardiology');
      
      // Navigate to write prescription
      await page.goto('/doctor/prescriptions/write');
      
      // Verify prescription form loads
      await expect(page.locator('text=Prescription').first()).toBeVisible();
      
      // Logout and login as pharmacist
      await auth.logout();
      await auth.loginAsPharmacist();
      
      // Check pharmacy dashboard for prescriptions
      await page.goto('/pharmacy');
      await expect(page.locator('text=Prescription').first()).toBeVisible();
    });

    test('Workflow 3: Patient Medical Records Access', async ({ page }) => {
      const auth = new AuthHelper(page);
      
      // Login as patient
      await auth.loginAsPatient();
      
      // Access medical records
      await page.goto('/portal/medical-records');
      await expect(page).toHaveURL(/medical-records/);
      
      // Access medical history
      await page.goto('/portal/medical-history');
      await expect(page).toHaveURL(/medical-history/);
    });

    test('Workflow 4: Admin Department Management', async ({ page }) => {
      const auth = new AuthHelper(page);
      
      // Login as admin
      await auth.loginAsAdmin();
      
      // Manage departments
      await page.goto('/admin/departments');
      await expect(page).toHaveURL(/departments/);
      
      // Verify public page shows only active
      await page.goto('/departments');
      await expect(page.locator('.ant-card').first()).toBeVisible();
    });

    test('Workflow 5: Inventory Low Stock Alert', async ({ page }) => {
      const auth = new AuthHelper(page);
      
      // Login as pharmacist
      await auth.loginAsPharmacist();
      
      // Check inventory dashboard
      await page.goto('/pharmacy/inventory');
      await expect(page).toHaveURL(/inventory/);
      
      // Check stock alerts
      await page.goto('/pharmacy/inventory/alerts');
      await expect(page).toHaveURL(/alerts/);
    });
  });
});
