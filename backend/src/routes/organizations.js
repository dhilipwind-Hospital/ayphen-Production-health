const express = require('express');
const router = express.Router();
const hospitalProvisioningService = require('../services/hospitalProvisioningService');
const { AppDataSource } = require('../config/database');
const { Organization } = require('../models/Organization');

// Helper function to ensure database is initialized
const ensureDbInitialized = async () => {
  if (!AppDataSource.isInitialized) {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
  }
};

// POST /api/organizations - Create new organization/hospital
router.post('/', async (req, res) => {
  try {
    const {
      name,
      subdomain,
      description,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      plan
    } = req.body;

    // Validate required fields
    if (!name || !subdomain || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check if subdomain is already taken (mock check)
    const existingSubdomains = ['demo', 'test', 'admin', 'api', 'www', 'mail'];
    if (existingSubdomains.includes(subdomain)) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain is already taken'
      });
    }

    // Ensure database is initialized
    await ensureDbInitialized();

    // Prepare hospital data for provisioning
    const hospitalData = {
      name,
      subdomain,
      description: description || '',
      type: 'General Hospital',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      phone: '',
      email: adminEmail,
      website: '',
      plan: plan || 'professional',
      adminUser: {
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        phone: '',
        tempPassword: adminPassword,
        title: 'Hospital Administrator'
      }
    };

    // Provision the new hospital
    const provisioningResult = await hospitalProvisioningService.provisionNewHospital(hospitalData);

    // Save organization to database
    const organizationRepository = AppDataSource.getRepository(Organization);
    const newOrganization = organizationRepository.create({
      id: provisioningResult.hospital.id,
      name: provisioningResult.hospital.name,
      subdomain: provisioningResult.hospital.subdomain,
      description: hospitalData.description || '',
      email: hospitalData.email,
      phone: hospitalData.phone || '',
      address: hospitalData.address?.street || '',
      settings: {
        branding: provisioningResult.hospital.branding,
        subscription: provisioningResult.hospital.subscription,
        limits: {
          maxUsers: provisioningResult.hospital.subscription.features?.maxUsers || 100,
          maxPatients: 1000,
          maxStorage: 100
        }
      },
      isActive: true
    });

    await organizationRepository.save(newOrganization);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Hospital created successfully!',
      data: {
        hospitalId: provisioningResult.hospital.id,
        hospitalName: provisioningResult.hospital.name,
        subdomain: provisioningResult.hospital.subdomain,
        adminUserId: provisioningResult.adminUser.id,
        onboardingUrl: provisioningResult.onboardingUrl,
        estimatedSetupTime: provisioningResult.estimatedSetupTime,
        trialEndsAt: provisioningResult.hospital.subscription.trialEndsAt
      }
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Handle specific errors
    if (error.message.includes('subdomain')) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain is already taken'
      });
    }
    
    if (error.message.includes('email')) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create hospital. Please try again.'
    });
  }
});

// GET /api/organizations/check-subdomain/:subdomain - Check if subdomain is available
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
      });
    }

    // Check reserved subdomains
    const reservedSubdomains = [
      'www', 'api', 'admin', 'mail', 'ftp', 'blog', 'shop', 'store',
      'support', 'help', 'docs', 'cdn', 'assets', 'static', 'media',
      'demo', 'test', 'staging', 'dev', 'beta', 'alpha'
    ];

    if (reservedSubdomains.includes(subdomain)) {
      return res.json({
        success: true,
        available: false,
        message: 'This subdomain is reserved'
      });
    }

    // Ensure database is initialized
    await ensureDbInitialized();

    // Check against existing subdomains in database
    const organizationRepository = AppDataSource.getRepository(Organization);
    const existingOrg = await organizationRepository.findOne({ where: { subdomain } });
    const isAvailable = !existingOrg;

    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Subdomain is available' : 'Subdomain is already taken'
    });

  } catch (error) {
    console.error('Error checking subdomain:', error);
    res.status(500).json({
      success: false,
      available: false,
      message: 'Failed to check subdomain availability'
    });
  }
});

// GET /api/organizations/plans - Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Up to 5 doctors',
          'Up to 100 patients',
          'Basic features',
          'Email support',
          '5 GB storage'
        ],
        maxUsers: 25,
        maxPatients: 100,
        storage: '5GB',
        support: 'email'
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 299,
        currency: 'USD',
        interval: 'month',
        popular: true,
        features: [
          'Up to 20 doctors',
          'Up to 1000 patients',
          'All features',
          'Priority support',
          '50 GB storage',
          'Custom branding',
          'Telemedicine',
          'Advanced reports'
        ],
        maxUsers: 100,
        maxPatients: 1000,
        storage: '50GB',
        support: 'phone+email',
        telemedicine: true,
        advancedReports: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 999,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited doctors',
          'Unlimited patients',
          'All features',
          'Dedicated support',
          'Unlimited storage',
          'Custom domain',
          'SLA guarantee',
          'API access',
          'White-label solution'
        ],
        maxUsers: 'unlimited',
        maxPatients: 'unlimited',
        storage: 'unlimited',
        support: 'dedicated',
        telemedicine: true,
        advancedReports: true,
        apiAccess: true,
        whiteLabel: true
      }
    ];

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
});

// GET /api/organizations - Get all organizations (for SaaS admin)
router.get('/', async (req, res) => {
  try {
    // Ensure database is initialized
    await ensureDbInitialized();

    const organizationRepository = AppDataSource.getRepository(Organization);
    const organizations = await organizationRepository.find();

    // Transform database data to match frontend interface
    const transformedOrganizations = organizations.map(org => {
      const plan = org.settings?.subscription?.plan || 'professional';
      const status = org.settings?.subscription?.status || 'active';
      
      return {
        id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        domain: org.customDomain || `${org.subdomain}.hospital.com`,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        users: 0,
        maxUsers: org.settings?.limits?.maxUsers || 100,
        status: status.charAt(0).toUpperCase() + status.slice(1),
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastActive: org.updatedAt ? new Date(org.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        monthlyRevenue: 0
      };
    });

    res.json({
      success: true,
      data: transformedOrganizations
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
});

module.exports = router;
