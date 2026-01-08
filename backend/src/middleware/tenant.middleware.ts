import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { NotFoundException, ForbiddenException } from '../exceptions/http.exception';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenant?: Organization;
    }
  }
}

/**
 * Tenant Context Middleware
 * 
 * Detects and validates the organization/tenant from (in priority order):
 * 0. User's organization_id (if authenticated) - HIGHEST PRIORITY
 * 1. Subdomain (e.g., apollo.yourhospital.com)
 * 2. Custom domain (e.g., apollo-hospital.com)
 * 3. Header X-Tenant-Subdomain (for development/testing)
 * 4. Query parameter ?tenant=subdomain (for development/testing)
 * 
 * Ensures:
 * - Organization exists
 * - Organization is active
 * - Subscription is valid (if applicable)
 * 
 * Attaches organization to req.tenant for use in controllers
 */
export const tenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgRepository = AppDataSource.getRepository(Organization);
    
    // Option 0: Get from authenticated user's organizationId (HIGHEST PRIORITY)
    // This ensures users always see their own organization's data
    if (req.user?.organizationId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Tenant Middleware] Using user's organizationId: ${req.user.organizationId}`);
      }
      
      const userOrganization = await orgRepository.findOne({
        where: { id: req.user.organizationId }
      });
      
      if (userOrganization) {
        // Validate organization is active
        if (!userOrganization.isActive) {
          throw new ForbiddenException(`Organization '${userOrganization.name}' is not active`);
        }
        
        req.tenant = userOrganization;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Tenant Middleware] Organization: ${userOrganization.name} (${userOrganization.id})`);
        }
        return next();
      }
    }
    
    let subdomain = 'default'; // Default for backward compatibility
    
    // Option 1: Extract from subdomain (production)
    // e.g., apollo.yourhospital.com → apollo
    const host = req.hostname;
    const parts = host.split('.');
    
    // If we have at least 3 parts (subdomain.domain.tld), use the first part
    if (parts.length >= 3 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
    
    // Option 2: From header (for development/testing)
    // Useful when testing locally without DNS setup
    if (req.headers['x-tenant-subdomain']) {
      subdomain = req.headers['x-tenant-subdomain'] as string;
    }
    
    // Option 3: From query parameter (for development/testing)
    // Useful for quick testing: /api/users?tenant=apollo
    if (req.query.tenant) {
      subdomain = req.query.tenant as string;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Tenant Middleware] Detected subdomain: ${subdomain} from ${host}`);
    }

    // Find organization by subdomain or custom domain
    const organization = await orgRepository.findOne({
      where: [
        { subdomain },
        { customDomain: host }
      ]
    });

    if (!organization) {
      // For backward compatibility, if no tenant found and subdomain is not specified,
      // try to use default organization
      if (subdomain === 'default' || !subdomain) {
        const defaultOrg = await orgRepository.findOne({
          where: { subdomain: 'default' }
        });
        
        if (defaultOrg) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Tenant Middleware] Using default organization: ${defaultOrg.name}`);
          }
          req.tenant = defaultOrg;
          return next();
        }
      }
      
      throw new NotFoundException(`Organization not found: ${subdomain}`);
    }

    // Validate organization is active
    if (!organization.isActive) {
      throw new ForbiddenException(`Organization '${organization.name}' is not active`);
    }

    // Check subscription status (if subscription system is implemented)
    if (organization.settings?.subscription?.status === 'suspended') {
      throw new ForbiddenException(
        `Subscription suspended for '${organization.name}'. Please contact support.`
      );
    }

    if (organization.settings?.subscription?.status === 'cancelled') {
      throw new ForbiddenException(
        `Subscription cancelled for '${organization.name}'. Please renew your subscription.`
      );
    }

    // Attach organization to request
    req.tenant = organization;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Tenant Middleware] Organization: ${organization.name} (${organization.id})`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to get tenant ID from request
 * Use this in controllers to ensure tenant context exists
 */
export const getTenantId = (req: Request): string => {
  if (!req.tenant) {
    throw new Error('Tenant context not found. Did you add tenantContext middleware?');
  }
  return req.tenant.id;
};

/**
 * Helper function to get tenant from request
 */
export const getTenant = (req: Request): Organization => {
  if (!req.tenant) {
    throw new Error('Tenant context not found. Did you add tenantContext middleware?');
  }
  return req.tenant;
};

/**
 * Optional: Tenant middleware that allows requests without tenant
 * Useful for public endpoints that don't require tenant context
 */
export const optionalTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tenantContext(req, res, next);
  } catch (error) {
    // If tenant not found, continue without tenant context
    // This allows public endpoints to work without tenant
    if (error instanceof NotFoundException) {
      console.log('[Tenant Middleware] No tenant found, continuing without tenant context');
      next();
    } else {
      next(error);
    }
  }
};
