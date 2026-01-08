import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import {
  getOrganization,
  updateOrganization,
  getOrganizationStats,
  createOrganization,
  listOrganizations,
  deactivateOrganization
} from '../controllers/organization.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================

// GET /api/organizations - List all organizations (public for SaaS admin panel)
router.get('/', listOrganizations);

// GET /api/organizations/public - Minimal public list for patient hospital selection (Option B)
router.get('/public', async (_req, res) => {
  try {
    const repo = AppDataSource.getRepository(Organization);
    const orgs = await repo.find({ where: { isActive: true } });
    res.json({
      success: true,
      data: orgs.map(o => ({
        id: o.id,
        name: o.name,
        subdomain: o.subdomain,
        branding: o.settings?.branding || {}
      }))
    });
  } catch (e) {
    console.error('organizations/public error:', e);
    res.status(500).json({ success: false, message: 'Failed to load organizations' });
  }
});

// GET /api/organizations/check-subdomain/:subdomain - Check subdomain availability
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
      });
    }

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

    res.json({
      success: true,
      available: true,
      message: 'Subdomain is available'
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

// GET /api/organizations/plans - Get subscription plans
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

// POST /api/organizations - Create new organization (public signup)
router.post('/', createOrganization);

// ============================================
// AUTHENTICATED ENDPOINTS
// ============================================

// GET /api/organization - Get current organization (authenticated)
router.get('/', authenticate, getOrganization);

// PUT /api/organization - Update organization (authenticated, admin only)
router.put('/', authenticate, authorize(['admin', 'super_admin']), updateOrganization);

// GET /api/organization/stats - Get organization stats (authenticated)
router.get('/stats', authenticate, getOrganizationStats);

// POST /api/organizations/all - Create organization (authenticated, super admin only)
router.post('/all', authenticate, authorize(['super_admin']), createOrganization);

// GET /api/organizations/all - List all organizations (authenticated, super admin only)
router.get('/all', authenticate, authorize(['super_admin']), listOrganizations);

// DELETE /api/organizations/all/:id - Deactivate organization (authenticated, super admin only)
router.delete('/all/:id', authenticate, authorize(['super_admin']), deactivateOrganization);

export default router;
