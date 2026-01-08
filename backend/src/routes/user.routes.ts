import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { authorize, isDoctor } from '../middleware/rbac.middleware';
import { Permission, UserRole, hasPermission } from '../types/roles';
import { errorHandler } from '../middleware/error.middleware';
import { validateDto } from '../middleware/validation.middleware';
import { UpdateUserDto } from '../dto/update-user.dto';

const router = Router();

// Multer storage for user photos
const uploadDir = path.resolve(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The user's unique ID
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             postalCode:
 *               type: string
 *         profileImage:
 *           type: string
 *           format: uri
 *         role:
 *           type: string
 *           enum: [patient, doctor, admin]
 *         isEmailVerified:
 *           type: boolean
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     UpdateUserProfile:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             postalCode:
 *               type: string
 *         profileImage:
 *           type: string
 *           format: uri
 *         role:
 *           type: string
 *           enum: [patient, doctor, admin]
 *         isEmailVerified:
 *           type: boolean
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Apply authentication and tenant context middleware to all user routes
router.use(authenticate);
router.use(tenantContext);

// Self routes (must come before parameterized routes)
router.get('/me', errorHandler(UserController.getCurrentUser));
router.patch('/me', validateDto(UpdateUserDto, true), errorHandler(UserController.updateProfile));
router.get('/me/appointments', errorHandler(UserController.getUserAppointments));
router.post('/me/photo', upload.single('photo'), errorHandler(UserController.uploadMyPhoto));
router.patch('/me/organization', errorHandler(UserController.setMyOrganization));

// TODO: Add doctors endpoint later when UserController is fixed

// Doctor routes
router.get('/doctor/my-patients', isDoctor, errorHandler(UserController.listDoctorPatients));
router.get('/doctor/my-patients.csv', isDoctor, errorHandler(UserController.listDoctorPatientsCsv));

// Admin routes (permission-aware)
router.get('/', authorize({ requireOneOf: [Permission.VIEW_USER, Permission.VIEW_PATIENT] }), errorHandler(UserController.listUsers));
router.get('/export/csv', authorize({ requireOneOf: [Permission.VIEW_USER, Permission.VIEW_PATIENT] }), errorHandler(UserController.exportUsersCsv));
// Create user (patient by default)
// Admins (CREATE_USER) can create any role.
// Receptionists (CREATE_PATIENT) can create only PATIENT role.
router.post('/',
  authorize({
    customCheck: (user: any, req) => {
      const intendedRole = String((req?.body || {}).role || UserRole.PATIENT).toLowerCase();
      if (hasPermission(user.role, Permission.CREATE_USER)) return true; // admins
      if (hasPermission(user.role, Permission.CREATE_PATIENT) && intendedRole === UserRole.PATIENT) return true; // receptionists
      return false;
    }
  }),
  errorHandler(UserController.adminCreateUser)
);
router.delete('/bulk-delete', authorize({ requireOneOf: [Permission.DELETE_USER] }), errorHandler(UserController.adminBulkDeleteUsers));
router.get('/:id', authorize({ requireOneOf: [Permission.VIEW_USER, Permission.VIEW_PATIENT] }), errorHandler(UserController.adminGetUserById));
router.put('/:id', authorize({ requireOneOf: [Permission.UPDATE_USER] }), errorHandler(UserController.adminUpdateUser));
router.delete('/:id', authorize({ requireOneOf: [Permission.DELETE_USER] }), errorHandler(UserController.adminDeleteUser));
router.post('/:id/photo', authorize({ requireOneOf: [Permission.UPDATE_USER] }), upload.single('photo'), errorHandler(UserController.uploadUserPhoto));


/**
 * @swagger
 * /users/me/medical-records:
 *   get:
 *     summary: Get current user's medical records (Placeholder)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Placeholder response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Medical records endpoint is not implemented yet
 *                 data:
 *                   type: array
 *                   items: {}
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/me/medical-records', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Medical records endpoint is not implemented yet',
    data: []
  });
});

// Update user's organization
router.patch('/me', authenticate, errorHandler(UserController.updateUserOrganization));

// Admin: update user by id
router.put(
  '/:id',
  authorize({ requireOneOf: [Permission.UPDATE_USER] }),
  errorHandler(UserController.adminUpdateUser)
);

export default router;
