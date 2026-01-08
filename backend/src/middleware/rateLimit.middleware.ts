import { Request, Response, NextFunction } from 'express';

export type RateLimitOptions = {
  windowMs: number; // time window in ms
  max: number; // max requests per window
  keyGenerator?: (req: Request) => string; // default: req.ip
  message?: string;
};

// Simple in-memory fixed-window rate limiter
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator, message } = options;
  const store = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = (keyGenerator ? keyGenerator(req) : req.ip) || req.ip || 'unknown';

    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      return res.status(429).json({ message: message || 'Too many requests, please try again later.' });
    }

    return next();
  };
}

// Preconfigured limiters
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for testing/development
  keyGenerator: (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`,
  message: 'Too many login attempts. Please try again later.',
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => req.ip || 'unknown',
  message: 'Too many sign-up attempts from this IP. Please try again later.',
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => `${req.ip || 'unknown'}:${String(req.body?.email || '').toLowerCase()}`,
  message: 'Too many password reset requests. Please try again later.',
});
