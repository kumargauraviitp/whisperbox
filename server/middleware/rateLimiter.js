import { checkRateLimit } from '../utils/db.js';

export function createRateLimiter(endpoint, windowMs, max) {
  const actualWindowMs = windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
  const actualMax = max || parseInt(process.env.RATE_LIMIT_MAX || '30');

  return async function rateLimiter(req, res, next) {
    // Skip rate limiting only for local development.
    const isLocalDev = process.env.NODE_ENV === 'development';
    if (isLocalDev) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const allowed = await checkRateLimit(ip, endpoint, actualWindowMs, actualMax);

    if (!allowed) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil(actualWindowMs / 1000),
      });
    }

    next();
  };
}
