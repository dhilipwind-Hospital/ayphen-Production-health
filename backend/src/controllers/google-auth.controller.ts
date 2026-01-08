import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../utils/jwt';
import axios from 'axios';

/**
 * Google OAuth Authentication Controller
 * Handles Google Sign-In integration
 */

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  verified_email?: boolean;
}

/**
 * Verify Google ID Token and authenticate user
 * POST /api/auth/google
 */
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Google auth request received');
    const { idToken, organizationId } = req.body;

    if (!idToken) {
      console.error('No Google ID token provided');
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    console.log('Verifying Google token with client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
    
    const googleUser = await verifyGoogleToken(idToken, process.env.GOOGLE_CLIENT_ID);
    
    if (!googleUser) {
      console.error('Google token verification failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    console.log('Google user verified:', googleUser.email);

    const userRepository = AppDataSource.getRepository(User);

    // Check if user exists with this Google email
    let user = await userRepository.findOne({
      where: { 
        email: googleUser.email,
        ...(organizationId && { organizationId })
      }
    });

    if (user) {
      // User exists, update Google info if needed
      if (!user.googleId) {
        user.googleId = googleUser.id;
        user.profilePicture = googleUser.picture;
        await userRepository.save(user);
      }
    } else {
      // Create new user with Google info
      // Use provided organizationId, tenant context, or default organization
      const defaultOrgId = organizationId || 
                          (req as any)?.tenant?.id || 
                          process.env.DEFAULT_TENANT_ID || 
                          '00000000-0000-0000-0000-000000000001';
      
      console.log('Creating new user with organization ID:', defaultOrgId);
      
      user = userRepository.create({
        email: String(googleUser.email || '').toLowerCase(),
        firstName: googleUser.given_name || (googleUser.name ? String(googleUser.name).split(' ')[0] : ''),
        lastName: googleUser.family_name || (googleUser.name ? String(googleUser.name).split(' ').slice(1).join(' ') : ''),
        googleId: googleUser.id,
        profilePicture: googleUser.picture,
        role: UserRole.PATIENT, // Default role for Google sign-up
        organizationId: defaultOrgId,
        isActive: true,
        password: '', // No password needed for Google auth
      });

      await userRepository.save(user);
      console.log('New user created successfully:', user.email);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken, expiresIn } = generateTokens(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePicture: user.profilePicture,
          organizationId: user.organizationId
        },
        accessToken,
        refreshToken,
        expiresIn
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Google authentication',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getGoogleConfig = async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    return res.status(200).json({ success: false, message: 'GOOGLE_CLIENT_ID is not set' });
  }
  return res.json({ success: true, data: { clientId } });
};

/**
 * Verify Google ID token with Google's API
 */
async function verifyGoogleToken(idToken: string, expectedAud?: string): Promise<GoogleUserInfo | null> {
  try {
    console.log('Verifying Google token...');
    
    // Add timeout and better error handling
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Hospital-Management-System/1.0'
      }
    });
    
    console.log('Google token verification response:', response.status);
    
    const d = response.data || {};
    if (d.error) {
      console.error('Google token verification error:', d.error);
      return null;
    }
    
    if (expectedAud && d.aud && String(d.aud) !== String(expectedAud)) {
      console.error('Google token audience mismatch:', d.aud, 'expected:', expectedAud);
      return null;
    }
    
    console.log('Google token verified successfully for email:', d.email);
    
    return {
      id: d.sub,
      email: d.email,
      name: d.name,
      given_name: d.given_name,
      family_name: d.family_name,
      picture: d.picture,
      verified_email: d.email_verified === true || d.email_verified === 'true'
    } as GoogleUserInfo;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
    }
    return null;
  }
}

/**
 * Get Google OAuth URL for frontend
 * GET /api/auth/google/url
 */
export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
  
  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth not configured'
    });
  }

  const scope = 'openid email profile';
  const responseType = 'code';
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=${responseType}&` +
    `state=${state}`;

  res.json({
    success: true,
    data: {
      authUrl,
      state
    }
  });
};
