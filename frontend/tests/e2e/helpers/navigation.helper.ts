import { Page } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) {}

  // Public Pages
  async goToHome() {
    await this.page.goto('/home');
  }

  async goToAbout() {
    await this.page.goto('/about');
  }

  async goToDepartments() {
    await this.page.goto('/departments');
  }

  async goToDoctors() {
    await this.page.goto('/doctors');
  }

  async goToServices() {
    await this.page.goto('/services');
  }

  async goToBookAppointment() {
    await this.page.goto('/appointments/book');
  }

  async goToEmergency() {
    await this.page.goto('/emergency');
  }

  async goToRequestCallback() {
    await this.page.goto('/request-callback');
  }

  // Patient Portal
  async goToPatientDashboard() {
    await this.page.goto('/portal');
  }

  async goToMedicalRecords() {
    await this.page.goto('/portal/medical-records');
  }

  async goToMedicalHistory() {
    await this.page.goto('/portal/medical-history');
  }

  async goToBillingHistory() {
    await this.page.goto('/portal/billing');
  }

  async goToMyInsurance() {
    await this.page.goto('/portal/insurance');
  }

  // Doctor Portal
  async goToDoctorDashboard() {
    await this.page.goto('/');
  }

  async goToMyPatients() {
    await this.page.goto('/doctor/patients');
  }

  async goToMySchedule() {
    await this.page.goto('/doctor/schedule');
  }

  async goToWritePrescription() {
    await this.page.goto('/doctor/prescriptions/write');
  }

  async goToDoctorPrescriptions() {
    await this.page.goto('/doctor/prescriptions');
  }

  // Pharmacy
  async goToPharmacyDashboard() {
    await this.page.goto('/pharmacy');
  }

  async goToMedicines() {
    await this.page.goto('/pharmacy/medicines');
  }

  async goToInventoryDashboard() {
    await this.page.goto('/pharmacy/inventory');
  }

  async goToStockAlerts() {
    await this.page.goto('/pharmacy/inventory/alerts');
  }

  async goToSuppliers() {
    await this.page.goto('/pharmacy/suppliers');
  }

  async goToPurchaseOrders() {
    await this.page.goto('/pharmacy/purchase-orders');
  }

  async goToInventoryReports() {
    await this.page.goto('/pharmacy/inventory/reports');
  }

  // Admin
  async goToAdminDashboard() {
    await this.page.goto('/');
  }

  async goToDepartmentsAdmin() {
    await this.page.goto('/admin/departments');
  }

  async goToServicesAdmin() {
    await this.page.goto('/admin/services');
  }

  async goToDoctorsAdmin() {
    await this.page.goto('/admin/doctors');
  }

  async goToAppointmentsAdmin() {
    await this.page.goto('/admin/appointments');
  }

  async goToEmergencyAdmin() {
    await this.page.goto('/admin/emergency');
  }

  async goToCallbackAdmin() {
    await this.page.goto('/admin/callback');
  }

  // Communication
  async goToMessaging() {
    await this.page.goto('/communication/messages');
  }

  async goToReminders() {
    await this.page.goto('/communication/reminders');
  }

  async goToHealthArticles() {
    await this.page.goto('/communication/health-articles');
  }

  async goToFeedback() {
    await this.page.goto('/communication/feedback');
  }

  // Settings
  async goToSettings() {
    await this.page.goto('/settings');
  }

  async goToProfile() {
    await this.page.goto('/profile');
  }
}
