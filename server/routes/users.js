import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { requireVisitor } from '../middleware/auth.js';
import { validateVisitorStart } from '../middleware/validator.js';
import { createUser, getJwtSecret, getUserByUsername, touchUser, checkUsernameRateLimit, logFailedAttempt } from '../utils/db.js';

const router = express.Router();

// How long a "remember me on this device" visitor session lasts. Shorter is
// safer if a cookie is ever stolen; the visitor can still re-log in with their
// password, and replies always require the password regardless of this value.
const VISITOR_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  };
}

async function setVisitorCookie(res, username) {
  const secret = await getJwtSecret();
  const token = jwt.sign({ role: 'visitor', username }, secret, { expiresIn: '30d' });
  res.cookie('visitor_token', token, cookieOptions(VISITOR_SESSION_MS));
}

router.post(
  '/start',
  createRateLimiter('visitor_start', 15 * 60 * 1000, 10),
  validateVisitorStart,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const normalizedUsername = username.trim().toLowerCase();
      const existingUser = await getUserByUsername(normalizedUsername);

      if (existingUser) {
        // Check username-specific rate limits to prevent brute-forcing
        const isLocalDev = process.env.NODE_ENV === 'development';
        if (!isLocalDev) {
          const allowed = await checkUsernameRateLimit(normalizedUsername, 'visitor_login_fail', 15 * 60 * 1000, 5);
          if (!allowed) {
            return res.status(429).json({
              error: 'Too many failed login attempts. This username is temporarily locked. Please try again in 15 minutes.',
            });
          }
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, existingUser.password_hash);
        if (!isMatch) {
          if (!isLocalDev) {
            await logFailedAttempt(normalizedUsername, 'visitor_login_fail');
          }
          return res.status(401).json({
            error: 'Incorrect password for this username. Please try again.',
          });
        }

        // Password is correct, log in existing user
        await setVisitorCookie(res, existingUser.username);
        return res.status(200).json({ success: true, username: existingUser.username });
      }

      const passwordHash = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)
      );

      const user = await createUser({
        username: normalizedUsername,
        usernameDisplay: username.trim(),
        passwordHash,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      await setVisitorCookie(res, user.username);
      res.status(201).json({ success: true, username: user.username });
    } catch (err) {
      if (err?.code === '23505') {
        return res.status(409).json({
          error: 'That username is already taken. Please choose another one.',
        });
      }

      console.error('Visitor start error:', err);
      res.status(500).json({ error: 'Could not create your private username. Please try again.' });
    }
  }
);

router.get('/me', requireVisitor, async (req, res) => {
  try {
    const user = await getUserByUsername(req.visitor.username);

    if (!user) {
      res.clearCookie('visitor_token', { path: '/' });
      return res.status(401).json({ error: 'Visitor session no longer exists.' });
    }

    await touchUser(user.username);
    res.json({ username: user.username });
  } catch (err) {
    console.error('Visitor verify error:', err);
    res.status(500).json({ error: 'Could not verify your session.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('visitor_token', { path: '/' });
  res.json({ success: true });
});

export default router;
