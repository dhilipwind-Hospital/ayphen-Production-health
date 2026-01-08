import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UnauthorizedException } from '../exceptions/http.exception';
import { TokenPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth.authenticate] authorization header:', authHeader);
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth.authenticate] token (first 16):', token?.slice(0,16));
    }
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
      if (process.env.NODE_ENV === 'test') {
        console.log('[auth.authenticate] decoded userId:', decoded?.userId);
      }
    } catch (e: any) {
      if (process.env.NODE_ENV === 'test') {
        console.log('[auth.authenticate] jwt.verify error:', e?.message);
      }
      throw new UnauthorizedException('Invalid token');
    }
    
    // Get user from database (TypeORM v0.3)
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId as any },
      select: ['id', 'email', 'role', 'isActive', 'permissions', 'organizationId'] as any
    });
    if (process.env.NODE_ENV === 'test') {
      console.log('[auth.authenticate] user found?', !!user, 'isActive:', user?.isActive, 'role:', user?.role);
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Attach user to request object and ensure organizationId is present if available
    req.user = {
      ...user,
      organizationId: decoded?.organization_id ?? (user as any)?.organizationId
    } as any;

    // Option B gating (flagged, non-breaking): if enabled and user has no organization, restrict access
    const requireOrg = String(process.env.REQUIRE_ORGANIZATION_FOR_PATIENTS || '').toLowerCase() === 'true';
    if (requireOrg && !(req.user as any).organizationId && req.method !== 'OPTIONS') {
      const url = (req as any).originalUrl || req.url || '';
      const allowedRegex: RegExp[] = [
        /^\/api\/auth(\/|$)/,
        /^\/api\/organizations(\/|$)/, // public listing/lookup
        /^\/health(\/|$)/,
        /^\/swagger(\/|$)/,
      ];
      const allowUserMe = /^\/api\/users\/me(\/|$)/.test(url); // fetch profile
      const allowSetOrg = req.method === 'PATCH' && /^\/api\/users\/me\/organization(\/|$)/.test(url);
      const isAllowed = allowUserMe || allowSetOrg || allowedRegex.some(rx => rx.test(url));
      if (!isAllowed) {
        return (res as any).status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedException('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedException('Token expired'));
    } else {
      next(error);
    }
  }
};

// Role-based access control middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedException('Insufficient permissions'));
    }

    next();
  };
};
