const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Feature flag for sample data - set via environment variable
const ENABLE_SAMPLE_DATA = process.env.ENABLE_SAMPLE_DATA === 'true';

class HospitalProvisioningService {
  constructor() {
    this.provisioningQueue = [];
    this.provisionedHospitals = new Map();
  }

  /**
   * Automatically provision a new hospital when they register
   */
  async provisionNewHospital(hospitalData) {
    const provisioningId = uuidv4();
    
    try {
      console.log(`🏥 Starting hospital provisioning for: ${hospitalData.name}`);
      
      // Phase 1: Create hospital record and infrastructure
      const hospital = await this.createHospitalInfrastructure(hospitalData, provisioningId);
      
      // Phase 2: Set up default configurations
      await this.setupDefaultConfigurations(hospital);
      
      // Phase 3: Create admin user
      const adminUser = await this.createAdminUser(hospital, hospitalData.adminUser);
      
      // Phase 4: Deploy default templates and data
      await this.deployDefaultTemplates(hospital);
      
      // Phase 5: Configure security and compliance
      await this.setupSecurityAndCompliance(hospital);
      
      // Phase 6: Send welcome communications
      await this.sendWelcomeCommunications(hospital, adminUser);
      
      console.log(`✅ Hospital provisioning completed for: ${hospital.name}`);
      
      return {
        success: true,
        hospital,
        adminUser,
        provisioningId,
        onboardingUrl: `https://${hospital.subdomain}.ayphen.care/onboarding`,
        estimatedSetupTime: '2-3 hours'
      };
      
    } catch (error) {
      console.error(`❌ Hospital provisioning failed:`, error);
      throw new Error(`Hospital provisioning failed: ${error.message}`);
    }
  }

  /**
   * Phase 1: Create hospital infrastructure
   */
  async createHospitalInfrastructure(hospitalData, provisioningId) {
    const hospital = {
      id: uuidv4(),
      provisioningId,
      name: hospitalData.name,
      subdomain: this.generateSubdomain(hospitalData.name),
      type: hospitalData.type || 'General Hospital',
      address: hospitalData.address,
      phone: hospitalData.phone,
      email: hospitalData.email,
      website: hospitalData.website,
      
      // System configuration
      status: 'provisioning',
      createdAt: new Date().toISOString(),
      
      // Database configuration
      databaseSchema: `hospital_${hospital.id.replace(/-/g, '_')}`,
      
      // Branding
      branding: {
        primaryColor: '#e91e63',
        logo: hospitalData.logo || null,
        theme: 'ayphen-pink'
      },
      
      // Subscription details
      subscription: {
        plan: hospitalData.plan || 'Professional',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        features: this.getPlanFeatures(hospitalData.plan || 'Professional')
      }
    };

    // Create database schema
    await this.createDatabaseSchema(hospital.databaseSchema);
    
    // Set up cloud infrastructure
    await this.setupCloudInfrastructure(hospital);
    
    return hospital;
  }

  /**
   * Phase 2: Set up default configurations
   */
  async setupDefaultConfigurations(hospital) {
    const defaultConfigs = {
      // Departments - controlled by feature flag (empty for clean portfolio)
      departments: ENABLE_SAMPLE_DATA ? [
        { name: 'Emergency Department', code: 'ER', active: true },
        { name: 'Cardiology', code: 'CARD', active: true },
        { name: 'Neurology', code: 'NEURO', active: true },
        { name: 'Orthopedics', code: 'ORTHO', active: true },
        { name: 'Pediatrics', code: 'PEDS', active: true },
        { name: 'Obstetrics & Gynecology', code: 'OBGYN', active: true },
        { name: 'Internal Medicine', code: 'IM', active: true },
        { name: 'Surgery', code: 'SURG', active: true },
        { name: 'Radiology', code: 'RAD', active: true },
        { name: 'Laboratory', code: 'LAB', active: true },
        { name: 'Pharmacy', code: 'PHARM', active: true },
        { name: 'ICU', code: 'ICU', active: true }
      ] : [],
      
      // Services - controlled by feature flag (empty for clean portfolio)
      services: ENABLE_SAMPLE_DATA ? [
        { name: 'General Consultation', department: 'IM', duration: 30, price: 150 },
        { name: 'Specialist Consultation', department: 'CARD', duration: 45, price: 200 },
        { name: 'Emergency Visit', department: 'ER', duration: 60, price: 300 },
        { name: 'Telemedicine Consultation', department: 'IM', duration: 20, price: 100 },
        { name: 'Health Checkup', department: 'IM', duration: 60, price: 250 },
        { name: 'Vaccination', department: 'PEDS', duration: 15, price: 50 }
      ] : [],
      
      // Roles - ALWAYS created (required for system to work)
      roles: [
        { name: 'super_admin', displayName: 'Super Administrator', permissions: ['*'] },
        { name: 'admin', displayName: 'Hospital Administrator', permissions: this.getAdminPermissions() },
        { name: 'doctor', displayName: 'Doctor', permissions: this.getDoctorPermissions() },
        { name: 'nurse', displayName: 'Nurse', permissions: this.getNursePermissions() },
        { name: 'receptionist', displayName: 'Receptionist', permissions: this.getReceptionistPermissions() },
        { name: 'pharmacist', displayName: 'Pharmacist', permissions: this.getPharmacistPermissions() },
        { name: 'lab_technician', displayName: 'Lab Technician', permissions: this.getLabTechPermissions() },
        { name: 'accountant', displayName: 'Accountant', permissions: this.getAccountantPermissions() },
        { name: 'patient', displayName: 'Patient', permissions: this.getPatientPermissions() }
      ],
      
      // Settings - ALWAYS created (required for system to work)
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        appointmentSlotDuration: 30,
        workingHours: {
          start: '09:00',
          end: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      }
    };

    // Save configurations to hospital database
    await this.saveConfigurations(hospital, defaultConfigs);
    
    return defaultConfigs;
  }

  /**
   * Phase 3: Create admin user
   */
  async createAdminUser(hospital, adminUserData) {
    const hashedPassword = await bcrypt.hash(adminUserData.tempPassword || 'Welcome123!', 10);
    
    const adminUser = {
      id: uuidv4(),
      hospitalId: hospital.id,
      firstName: adminUserData.firstName,
      lastName: adminUserData.lastName,
      email: adminUserData.email,
      phone: adminUserData.phone,
      role: 'admin',
      status: 'active',
      password: hashedPassword,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      
      // Profile information
      profile: {
        title: adminUserData.title || 'Hospital Administrator',
        department: 'Administration',
        employeeId: 'ADMIN001'
      }
    };

    // Save admin user to hospital database
    await this.saveAdminUser(hospital, adminUser);
    
    return adminUser;
  }

  /**
   * Phase 4: Deploy default templates and data
   */
  async deployDefaultTemplates(hospital) {
    const templates = {
      medicalForms: [
        'Patient Registration Form',
        'Medical History Form',
        'Consent Form',
        'Insurance Verification Form',
        'Discharge Summary Template',
        'Prescription Template',
        'Lab Request Form',
        'Radiology Request Form'
      ],
      
      emailTemplates: [
        'Appointment Confirmation',
        'Appointment Reminder',
        'Test Results Available',
        'Prescription Ready',
        'Payment Receipt',
        'Welcome Email',
        'Password Reset'
      ],
      
      reportTemplates: [
        'Daily Census Report',
        'Financial Summary',
        'Patient Satisfaction Report',
        'Staff Performance Report',
        'Inventory Report',
        'Appointment Statistics'
      ],
      
      sampleData: {
        patients: ENABLE_SAMPLE_DATA ? 10 : 0, // Sample data controlled by feature flag
        appointments: ENABLE_SAMPLE_DATA ? 20 : 0, // Sample data controlled by feature flag
        medicines: ENABLE_SAMPLE_DATA ? 50 : 0, // Sample data controlled by feature flag
        labTests: ENABLE_SAMPLE_DATA ? 30 : 0 // Sample data controlled by feature flag
      }
    };

    await this.deployTemplates(hospital, templates);
    
    return templates;
  }

  /**
   * Phase 5: Set up security and compliance
   */
  async setupSecurityAndCompliance(hospital) {
    const securityConfig = {
      encryption: {
        algorithm: 'AES-256-GCM',
        keyRotationDays: 90
      },
      
      backup: {
        frequency: 'daily',
        retention: '7 years',
        location: 'encrypted-cloud-storage'
      },
      
      audit: {
        enabled: true,
        logLevel: 'detailed',
        retention: '7 years'
      },
      
      compliance: {
        hipaa: true,
        gdpr: true,
        sox: false
      },
      
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expirationDays: 90
        },
        sessionTimeout: 30, // minutes
        maxLoginAttempts: 5,
        twoFactorAuth: 'optional'
      }
    };

    await this.setupSecurity(hospital, securityConfig);
    
    return securityConfig;
  }

  /**
   * Phase 6: Send welcome communications
   */
  async sendWelcomeCommunications(hospital, adminUser) {
    const communications = {
      welcomeEmail: {
        to: adminUser.email,
        subject: `🎉 Welcome to Ayphen Care - ${hospital.name} is Ready!`,
        template: 'hospital-welcome',
        data: {
          hospitalName: hospital.name,
          adminName: `${adminUser.firstName} ${adminUser.lastName}`,
          loginUrl: `https://${hospital.subdomain}.ayphen.care/login`,
          onboardingUrl: `https://${hospital.subdomain}.ayphen.care/onboarding`,
          supportEmail: 'support@ayphen.care',
          supportPhone: '+1-800-AYPHEN'
        }
      },
      
      setupGuide: {
        to: adminUser.email,
        subject: `📋 ${hospital.name} Setup Guide - Get Started in 2-3 Hours`,
        template: 'setup-guide',
        attachments: [
          'Hospital_Setup_Checklist.pdf',
          'User_Manual.pdf',
          'Training_Schedule.pdf'
        ]
      },
      
      trainingInvitation: {
        to: adminUser.email,
        subject: `🎓 Free Training Session for ${hospital.name}`,
        template: 'training-invitation',
        data: {
          hospitalName: hospital.name,
          bookingUrl: `https://ayphen.care/training/book?hospital=${hospital.id}`
        }
      }
    };

    await this.sendEmails(communications);
    
    return communications;
  }

  /**
   * Helper methods
   */
  generateSubdomain(hospitalName) {
    return hospitalName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  }

  getPlanFeatures(plan) {
    const features = {
      Basic: {
        maxUsers: 25,
        storage: '10GB',
        telemedicine: false,
        advancedReports: false,
        apiAccess: false,
        support: 'email'
      },
      Professional: {
        maxUsers: 100,
        storage: '100GB',
        telemedicine: true,
        advancedReports: true,
        apiAccess: false,
        support: 'phone+email'
      },
      Enterprise: {
        maxUsers: 500,
        storage: '1TB',
        telemedicine: true,
        advancedReports: true,
        apiAccess: true,
        support: 'dedicated'
      }
    };
    
    return features[plan] || features.Professional;
  }

  getAdminPermissions() {
    return [
      'view_user', 'create_user', 'update_user', 'delete_user',
      'view_patient', 'create_patient', 'update_patient',
      'view_appointment', 'create_appointment', 'update_appointment',
      'view_medical_record', 'view_bill', 'create_bill',
      'view_inventory', 'manage_settings', 'view_reports', 'generate_reports'
    ];
  }

  getDoctorPermissions() {
    return [
      'view_patient', 'view_appointment', 'create_appointment', 'update_appointment',
      'view_medical_record', 'create_medical_record', 'update_medical_record'
    ];
  }

  getNursePermissions() {
    return [
      'view_patient', 'view_appointment', 'view_medical_record', 'update_medical_record'
    ];
  }

  getReceptionistPermissions() {
    return [
      'view_patient', 'create_patient', 'update_patient',
      'view_appointment', 'create_appointment', 'update_appointment'
    ];
  }

  getPharmacistPermissions() {
    return [
      'view_patient', 'view_medical_record', 'view_inventory', 'manage_inventory'
    ];
  }

  getLabTechPermissions() {
    return [
      'view_patient', 'view_medical_record', 'update_medical_record', 'view_inventory'
    ];
  }

  getAccountantPermissions() {
    return [
      'view_bill', 'create_bill', 'update_bill', 'view_reports', 'generate_reports'
    ];
  }

  getPatientPermissions() {
    return [
      'view_appointment', 'create_appointment', 'view_medical_record', 'view_bill'
    ];
  }

  // Database and infrastructure methods (would integrate with actual services)
  async createDatabaseSchema(schemaName) {
    console.log(`📊 Creating database schema: ${schemaName}`);
    // Implementation would create actual database schema
    return true;
  }

  async setupCloudInfrastructure(hospital) {
    console.log(`☁️ Setting up cloud infrastructure for: ${hospital.name}`);
    // Implementation would set up actual cloud resources
    return true;
  }

  async saveConfigurations(hospital, configs) {
    console.log(`⚙️ Saving configurations for: ${hospital.name}`);
    // Implementation would save to actual database
    return true;
  }

  async saveAdminUser(hospital, adminUser) {
    console.log(`👤 Creating admin user for: ${hospital.name}`);
    // Implementation would save to actual database
    return true;
  }

  async deployTemplates(hospital, templates) {
    console.log(`📋 Deploying templates for: ${hospital.name}`);
    // Implementation would deploy actual templates
    return true;
  }

  async setupSecurity(hospital, securityConfig) {
    console.log(`🔒 Setting up security for: ${hospital.name}`);
    // Implementation would configure actual security
    return true;
  }

  async sendEmails(communications) {
    console.log(`📧 Sending welcome communications`);
    // Implementation would send actual emails
    return true;
  }

  /**
   * Get hospital onboarding status
   */
  async getOnboardingStatus(hospitalId) {
    // This would check actual database for onboarding progress
    return {
      hospitalId,
      status: 'in_progress',
      completedTasks: 2,
      totalTasks: 8,
      completionPercentage: 25,
      estimatedTimeRemaining: '2 hours',
      nextSteps: [
        'Add staff members',
        'Configure services',
        'Set up appointment slots',
        'Test telemedicine'
      ]
    };
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(hospitalId, taskId, status) {
    console.log(`📈 Updating onboarding progress: ${taskId} -> ${status}`);
    // Implementation would update actual database
    return true;
  }
}

module.exports = new HospitalProvisioningService();
