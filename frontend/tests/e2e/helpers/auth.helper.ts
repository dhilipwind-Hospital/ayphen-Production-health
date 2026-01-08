import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAsAdmin() {
    await this.page.goto('/login');
    await this.page.fill('input[placeholder="Email"]', 'admin@hospital.com');
    await this.page.fill('input[placeholder="Password"]', 'Admin@2025');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async loginAsDoctor(department: string = 'cardiology') {
    await this.page.goto('/login');
    await this.page.fill('input[placeholder="Email"]', `${department}@hospital.com`);
    await this.page.fill('input[placeholder="Password"]', 'doctor123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async loginAsPharmacist() {
    await this.page.goto('/login');
    await this.page.fill('input[placeholder="Email"]', 'pharmacist@example.com');
    await this.page.fill('input[placeholder="Password"]', 'Pharmacist@123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async loginAsPatient() {
    await this.page.goto('/login');
    await this.page.fill('input[placeholder="Email"]', 'raja.patient@example.com');
    await this.page.fill('input[placeholder="Password"]', 'Patient@123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/', { timeout: 10000 });
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]').catch(() => {});
    await this.page.click('text=Logout').catch(() => {});
    await this.page.waitForURL('/login', { timeout: 5000 }).catch(() => {});
  }
}
