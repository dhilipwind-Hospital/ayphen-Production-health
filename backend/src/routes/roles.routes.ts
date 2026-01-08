import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { Permission } from '../types/roles';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Apply authentication and tenant context middleware
router.use(authenticate);
router.use(tenantContext);

// Role management routes (Admin only)
router.get('/', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.getAllRoles)
);

router.post('/', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.createRole)
);

router.put('/:id', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.updateRole)
);

router.delete('/:id', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.deleteRole)
);

// User role assignments
router.get('/assignments', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.getUserRoleAssignments)
);

router.post('/assignments', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.assignUserRole)
);

router.put('/assignments/:id', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.updateUserRoleAssignment)
);

router.delete('/assignments/:id', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.revokeUserRole)
);

router.delete('/assignments/bulk', 
  authorize({ requireOneOf: [Permission.MANAGE_ROLES] }), 
  errorHandler(RoleController.bulkRevokeUserRoles)
);

export default router;
