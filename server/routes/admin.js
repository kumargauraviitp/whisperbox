import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { validateReply, validatePassword } from '../middleware/validator.js';
import { getMessages, addReply, deleteMessage, getStats, getAdminPinHash, getJwtSecret } from '../utils/db.js';
import { sendPushNotification } from '../utils/push.js';

const router = express.Router();

// Admin login - rate limit: 5 attempts per 15 min per IP
router.post(
  '/login',
  createRateLimiter('admin_login', 15 * 60 * 1000, 5),
  validatePassword,
  async (req, res) => {
    try {
      const { password } = req.body;
      const hash = await getAdminPinHash();

      if (!hash) {
        return res.status(500).json({ error: 'Server configuration error.' });
      }

      const valid = await bcrypt.compare(password, hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid password.' });
      }

      const secret = await getJwtSecret();
      const token = jwt.sign({ role: 'admin', iat: Date.now() }, secret, { expiresIn: '7d' });

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// Logout (clear admin cookie)
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ success: true });
});

// Get all messages (admin only)
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const messages = await getMessages();
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching admin messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Reply to a message (admin only)
router.post('/reply/:id', requireAuth, validateReply, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const message = await addReply(id, reply);
    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    sendPushNotification(message.sender_username, {
      title: 'New Reply from Owner',
      body: 'The owner has securely replied to your message.',
      url: '/replies'
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding reply:', err);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
});

// Get stats (admin only)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Delete a message (admin only)
router.delete('/messages/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteMessage(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// Verify token (admin only)
router.get('/verify', requireAuth, async (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

export default router;
