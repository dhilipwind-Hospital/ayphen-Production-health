import { Router } from 'express';
import { googleAuth, getGoogleAuthUrl, getGoogleConfig } from '../controllers/google-auth.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Google Auth
 *   description: Google OAuth authentication
 */

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google ID token
 *     tags: [Google Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token
 *               organizationId:
 *                 type: string
 *                 description: Organization ID (optional)
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid token
 */
router.post('/google', googleAuth);

/**
 * @swagger
 * /api/auth/google/url:
 *   get:
 *     summary: Get Google OAuth authorization URL
 *     tags: [Google Auth]
 *     responses:
 *       200:
 *         description: Google auth URL generated
 *       500:
 *         description: Google OAuth not configured
 */
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/config', getGoogleConfig);

export default router;
