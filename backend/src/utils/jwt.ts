import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const getJwtSecret = () => process.env.JWT_SECRET || 'your-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organization_id?: string;
}

export const generateTokens = (user: User) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organization_id: user.organizationId
  };

  const accessToken = jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });

  const refreshToken = jwt.sign(payload, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
};
