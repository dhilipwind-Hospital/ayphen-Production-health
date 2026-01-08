import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { Permission } from '../types/roles';

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Healthcare services management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The service ID
 *         name:
 *           type: string
 *           description: Name of the service
 *         description:
 *           type: string
 *           description: Detailed description of the service
 *         duration:
 *           type: integer
 *           description: Duration of the service in minutes
 *         price:
 *           type: number
 *           format: float
 *           description: Price of the service
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: ID of the department this service belongs to
 *         isActive:
 *           type: boolean
 *           description: Whether the service is currently offered
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         department:
 *           $ref: '#/components/schemas/Department'
 *
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           format: uri
 *
 *     PaginatedServices:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Service'
 *         meta:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

const router = Router();

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all services with optional filters
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by department ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedServices'
 */
router.get('/', authenticate, tenantContext, ServiceController.listAll);

/**
 * @swagger
 * /services/search:
 *   get:
 *     summary: Search services by name or description
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: List of matching services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       400:
 *         description: Missing search query
 */
router.get('/search', authenticate, tenantContext, ServiceController.search);

/**
 * @swagger
 * /services/department/{departmentId}:
 *   get:
 *     summary: Get all services for a specific department
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the department
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of services in the department
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 *       404:
 *         description: Department not found
 */
router.get('/department/:departmentId', authenticate, tenantContext, ServiceController.getByDepartment);

/**
 * @swagger
 * /services/stats/by-department:
 *   get:
 *     summary: Get counts of services grouped by department
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats by department
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       departmentId:
 *                         type: string
 *                         nullable: true
 *                       departmentName:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 */
router.get('/stats/by-department', authenticate, tenantContext, ServiceController.statsByDepartment);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get a service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       404:
 *         description: Service not found
 */
router.get('/:id', authenticate, tenantContext, ServiceController.getOneById);

// Admin routes
router.post('/', authenticate, tenantContext, authorize({ requireOneOf: [Permission.MANAGE_SETTINGS] }), ServiceController.create);
router.put('/:id', authenticate, tenantContext, authorize({ requireOneOf: [Permission.MANAGE_SETTINGS] }), ServiceController.update);
router.patch('/:id/status', authenticate, tenantContext, authorize({ requireOneOf: [Permission.MANAGE_SETTINGS] }), ServiceController.setStatus);

export default router;
