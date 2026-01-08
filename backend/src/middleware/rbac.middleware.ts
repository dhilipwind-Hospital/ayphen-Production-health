import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission, UserRole } from '../types/roles';
import { ForbiddenException, UnauthorizedException } from '../exceptions/http.exception';

type RequireAtLeastOne<T> = {
  [K in keyof T]: { [P in K]: T[K] } & { [P in keyof T]?: T[P] }[keyof T];
}[keyof T];

type PermissionCheck = {
  requireAll?: Permission[];
  requireOneOf?: Permission[];
  requireRole?: UserRole | UserRole[];
  customCheck?: (user: any, req: Request) => Promise<boolean> | boolean;
};

export const authorize = (options: PermissionCheck) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new UnauthorizedException('Authentication required');
      }

      const { role, permissions = [] } = req.user;
      
      // Super admin bypasses all checks
      if (role === UserRole.SUPER_ADMIN) {
        return next();
      }

      // Check for custom permission check
      if (options.customCheck) {
        const hasAccess = await Promise.resolve(options.customCheck(req.user, req));
        if (hasAccess) return next();
        throw new ForbiddenException('Insufficient permissions');
      }

      // Check role requirement
      if (options.requireRole) {
        const requiredRoles = Array.isArray(options.requireRole) 
          ? options.requireRole 
          : [options.requireRole];
        
        if (requiredRoles.includes(role)) {
          return next();
        }
      }

      // Check if all required permissions are present
      if (options.requireAll && options.requireAll.length > 0) {
        const hasAllPermissions = options.requireAll.every(permission => 
          hasPermission(role, permission) || permissions.includes(permission)
        );
        
        if (hasAllPermissions) {
          return next();
        }
      }

      // Check if any of the required permissions are present
      if (options.requireOneOf && options.requireOneOf.length > 0) {
        const hasAnyPermission = options.requireOneOf.some(permission => 
          hasPermission(role, permission) || permissions.includes(permission)
        );
        
        if (hasAnyPermission) {
          return next();
        }
      }

      // If no conditions are met, deny access
      throw new ForbiddenException('Insufficient permissions');
      
    } catch (error) {
      next(error);
    }
  };
};

// Predefined permission sets for common use cases
export const canViewUsers = authorize({
  requireOneOf: [
    Permission.VIEW_USER,
    Permission.VIEW_PATIENT
  ]
});

export const canManageUsers = authorize({
  requireOneOf: [
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER
  ]
});

export const canManageAppointments = authorize({
  requireOneOf: [
    Permission.CREATE_APPOINTMENT,
    Permission.UPDATE_APPOINTMENT,
    Permission.DELETE_APPOINTMENT
  ]
});

export const canManageMedicalRecords = authorize({
  requireOneOf: [
    Permission.CREATE_MEDICAL_RECORD,
    Permission.UPDATE_MEDICAL_RECORD
  ]
});

export const isAdmin = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

export const isDoctor = authorize({
  requireRole: UserRole.DOCTOR
});

export const isPatient = authorize({
  requireRole: UserRole.PATIENT
});

// Middleware to check if the user is accessing their own resource
export const isSelfOrAllowed = (paramName = 'id') => {
  return authorize({
    customCheck: (user, req) => {
      // Allow if user is accessing their own resource
      if (user.id === req.params[paramName]) {
        return true;
      }
      
      // Or if they have permission to manage users
      return hasPermission(user.role, Permission.UPDATE_USER) || 
             hasPermission(user.role, Permission.VIEW_USER);
    }
  });
};
