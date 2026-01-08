import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserResponse } from '../models/User';
import { validate } from 'class-validator';
import { generateTokens, TokenPayload } from '../utils/jwt';
import { RefreshToken } from '../models/RefreshToken';
import { PasswordResetToken } from '../models/PasswordResetToken';
import * as crypto from 'crypto';
import { UserRole } from '../types/roles';

type ErrorWithMessage = {
  message: string;
  [key: string]: any;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export class AuthController {
  static login = async (req: Request, res: Response) => {
    try {
      let { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Normalize email
      email = String(email).trim().toLowerCase();

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ 
        where: { email },
        relations: ['organization'] // Include organization data
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Ensure user has a valid UUID primary key (legacy records may have empty id)
      if (!user.id || user.id.trim() === '') {
        user.id = crypto.randomUUID();
        await AppDataSource.getRepository(User).save(user);
      }

      // Generate JWT tokens
      const tokens = generateTokens(user);
      
      // Create refresh token in database
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const refreshToken = refreshTokenRepository.create({
        token: tokens.refreshToken,
        user: user,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdByIp: req.ip
      });
      await refreshTokenRepository.save(refreshToken);

      // Prepare user data for response (exclude password)
      const { password: _, ...userData } = user;
      
      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return res.json({
        message: 'Login successful',
        user: userData,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });

    } catch (error: unknown) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        message: 'An error occurred during login',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static register = async (req: Request, res: Response) => {
    try {
      let { firstName, lastName, email, phone, password, confirmPassword, gender } = req.body;

      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      // Enforce strong password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special
      const passwordStr = String(password);
      const policy = {
        min: 8,
        upper: /[A-Z]/,
        lower: /[a-z]/,
        digit: /\d/,
        special: /[@$!%*?&]/
      };
      const violations: string[] = [];
      if (!passwordStr || passwordStr.length < policy.min) violations.push('at least 8 characters');
      if (!policy.upper.test(passwordStr)) violations.push('one uppercase letter');
      if (!policy.lower.test(passwordStr)) violations.push('one lowercase letter');
      if (!policy.digit.test(passwordStr)) violations.push('one number');
      if (!policy.special.test(passwordStr)) violations.push('one special character');
      if (violations.length) {
        return res.status(400).json({ message: `Password must contain ${violations.join(', ')}` });
      }

      // MULTI-TENANT: Get organization context
      // FIXED: Use the correct default organization ID from database
      // Patients default to "Default Hospital" (00000000-0000-0000-0000-000000000001)
      // They can select their actual hospital later via ChooseHospital page
      const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
      const orgId = (req as any).tenant?.id || req.body.organizationId || DEFAULT_ORG_ID;

      // Check if user already exists
      const userRepository = AppDataSource.getRepository(User);
      // Normalize email
      email = String(email).trim().toLowerCase();

      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create new user
      const user = new User();
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.phone = phone;
      user.password = password;
      user.gender = gender; // Save gender
      user.role = UserRole.PATIENT; // Default role
      user.isActive = true;
      user.organizationId = orgId; // MULTI-TENANT: Assign organization

      // Validate user input
      const errors = await validate(user);
      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.map(e => e.constraints) 
        });
      }

      // Hash password and save user
      await user.hashPassword();
      await userRepository.save(user);

      // Send welcome email (don't wait for it)
      try {
        const { EmailService } = await import('../services/email.service');
        EmailService.sendWelcomeEmail(user.email, user.firstName).catch(err => 
          console.error('Failed to send welcome email:', err)
        );
      } catch (emailError) {
        console.error('Email service not available:', emailError);
      }

      // Prepare response (exclude password)
      const userResponse: UserResponse = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const tail = String(user.id || '').replace(/-/g, '').slice(-6).toUpperCase();
      const sub = String(((req as any)?.tenant?.subdomain) || '').toUpperCase();
      const displayPatientId = sub ? `PID-${sub}-${tail}` : `PID-${tail}`;

      return res.status(201).json({
        message: 'Registration successful',
        user: userResponse,
        displayPatientId
      });

    } catch (error: unknown) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        message: 'An error occurred during registration',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static logout = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookies or request body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      
      if (refreshToken) {
        // Delete the refresh token from database
        const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
        await refreshTokenRepository.delete({ token: refreshToken });
        
        // Clear the refresh token cookie
        res.clearCookie('refreshToken');
      }
      
      return res.status(200).json({ message: 'Successfully logged out' });
    } catch (error: unknown) {
      console.error('Logout error:', error);
      return res.status(500).json({ 
        message: 'An error occurred during logout',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static refreshToken = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Verify the refresh token
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const storedToken = await refreshTokenRepository.findOne({
        where: { token: refreshToken },
        relations: ['user']
      });

      // Check if token exists and is not expired
      if (!storedToken || storedToken.isExpired) {
        if (storedToken) {
          // Remove expired token from database
          await refreshTokenRepository.remove(storedToken);
        }
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }

      // Get user from token
      const user = storedToken.user;
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }
      
      // Generate new tokens
      const tokens = generateTokens(user);
      
      // Update refresh token in database
      storedToken.token = tokens.refreshToken;
      storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      storedToken.isRevoked = false;
      storedToken.revokedByIp = null;
      storedToken.revokedAt = null;
      storedToken.replacedByToken = null;
      
      await refreshTokenRepository.save(storedToken);
      
      // Set HTTP-only cookie for new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });
    } catch (error: unknown) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ 
        message: 'Failed to refresh token',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      // For security reasons, we don't reveal if the email exists or not
      if (!user) {
        // In production, we would still return a 200 response to prevent email enumeration
        if (process.env.NODE_ENV === 'development') {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link' });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Save token to database with 15-minute expiration
      const resetTokenRepository = AppDataSource.getRepository(PasswordResetToken);
      
      // Delete any existing tokens for this email
      await resetTokenRepository.delete({ email });
      
      // Create new reset token
      const passwordResetToken = resetTokenRepository.create({
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        userId: user.id
      });
      await resetTokenRepository.save(passwordResetToken);
      
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      // Send email with reset link
      try {
        const { EmailService } = await import('../services/email.service');
        await EmailService.sendPasswordResetEmail(email, user.firstName, resetUrl);
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send reset email:', emailError);
        // Continue - don't fail the request if email fails
      }
      
      console.log(`Password reset link for ${email}: ${resetUrl}`);
      
      return res.status(200).json({ 
        message: 'If your email exists in our system, you will receive a password reset link',
        // In development, return the reset URL for testing
        ...(process.env.NODE_ENV === 'development' && { resetUrl })
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ 
        message: 'Failed to process password reset request',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Hash the provided token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find the reset token in database
      const resetTokenRepository = AppDataSource.getRepository(PasswordResetToken);
      const resetTokenRecord = await resetTokenRepository.findOne({
        where: { token: hashedToken },
        relations: ['user']
      });
      
      // Validate token exists, not expired, and not used
      if (!resetTokenRecord || 
          resetTokenRecord.expiresAt < new Date() || 
          resetTokenRecord.isUsed) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const user = resetTokenRecord.user;
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      // Validate new password strength
      const passwordStr = String(newPassword);
      const policy = {
        min: 8,
        upper: /[A-Z]/,
        lower: /[a-z]/,
        digit: /\d/,
        special: /[@$!%*?&]/
      };
      const violations: string[] = [];
      if (!passwordStr || passwordStr.length < policy.min) violations.push('at least 8 characters');
      if (!policy.upper.test(passwordStr)) violations.push('one uppercase letter');
      if (!policy.lower.test(passwordStr)) violations.push('one lowercase letter');
      if (!policy.digit.test(passwordStr)) violations.push('one number');
      if (!policy.special.test(passwordStr)) violations.push('one special character');
      if (violations.length) {
        return res.status(400).json({ message: `Password must contain ${violations.join(', ')}` });
      }

      // Update the password
      const userRepository = AppDataSource.getRepository(User);
      user.password = newPassword;
      await user.hashPassword();
      await userRepository.save(user);
      
      // Mark token as used
      resetTokenRecord.isUsed = true;
      await resetTokenRepository.save(resetTokenRecord);
      
      // Delete all other reset tokens for this user (except the current one)
      await resetTokenRepository
        .createQueryBuilder()
        .delete()
        .where('userId = :userId AND id != :currentId', { 
          userId: user.id, 
          currentId: resetTokenRecord.id 
        })
        .execute();

      // Send confirmation email
      try {
        const { EmailService } = await import('../services/email.service');
        await EmailService.sendEmail({
          to: user.email,
          subject: '✅ Password Successfully Changed',
          html: `
            <h2>Password Changed Successfully</h2>
            <p>Hello ${user.firstName},</p>
            <p>Your password has been successfully changed. If you did not make this change, please contact support immediately.</p>
            <p>For security, you may want to review your recent account activity.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send password change confirmation:', emailError);
      }
      
      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({ 
        message: 'Failed to reset password',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static getCurrentUser = async (req: Request, res: Response) => {
    try {
      // The user is already attached to req by the auth middleware
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Fetch fresh user data from database
      const userRepository = AppDataSource.getRepository(User);
      const currentUser = await userRepository.findOne({ 
        where: { id: user.id },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'isActive', 'createdAt', 'updatedAt']
      });

      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!currentUser.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const tail = String(currentUser.id || '').replace(/-/g, '').slice(-6).toUpperCase();
      const sub = String(((req as any)?.tenant?.subdomain) || '').toUpperCase();
      const displayPatientId = sub ? `PID-${sub}-${tail}` : `PID-${tail}`;

      return res.json({
        ...currentUser,
        displayPatientId
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ 
        message: 'Failed to get user information',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };
}
