import { Router } from 'express';
import { requireAuth, requireVisitor } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/db.js';
import { getVapidPublicKey } from '../utils/push.js';
import { savePushSubscription } from '../utils/db.js';

export const router = Router();

// Custom middleware to allow either admin or visitor
async function requireAnyUser(req, res, next) {
  const adminToken = req.cookies?.admin_token || req.headers['authorization']?.replace('Bearer ', '');
  const visitorToken = req.cookies?.visitor_token;
  const secret = await getJwtSecret();

  if (adminToken) {
    try {
      const decoded = jwt.verify(adminToken, secret);
      if (decoded.role === 'admin') {
        req.userContext = { isAdmin: true };
        return next();
      }
    } catch {}
  }

  if (visitorToken) {
    try {
      const decoded = jwt.verify(visitorToken, secret);
      if (decoded.role === 'visitor' && typeof decoded.username === 'string') {
        req.userContext = { isAdmin: false, username: decoded.username };
        return next();
      }
    } catch {}
  }

  return res.status(401).json({ error: 'Unauthorized to subscribe to notifications' });
}

router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.json({ publicKey });
  } catch (error) {
    console.error('Error fetching VAPID public key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/subscribe', requireAnyUser, async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    const target = req.userContext.isAdmin ? '__owner__' : req.userContext.username;

    await savePushSubscription(target, subscription);
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
