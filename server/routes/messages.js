import express from 'express';
import bcrypt from 'bcryptjs';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { requireVisitor } from '../middleware/auth.js';
import { validateMessage, validatePassword } from '../middleware/validator.js';
import { saveMessage, getMessagesByUsername, getUserByUsername } from '../utils/db.js';
import { sendPushNotification } from '../utils/push.js';

const router = express.Router();

// Send message - rate limit: 5 per 15 min per IP
router.post(
  '/send',
  requireVisitor,
  createRateLimiter('send_message', 15 * 60 * 1000, 5),
  validateMessage,
  async (req, res) => {
    try {
      const { content } = req.body;
      const senderUsername = req.visitor.username;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const message = await saveMessage({ senderUsername, content, ipAddress, userAgent });

      // Notify the owner instantly
      sendPushNotification('__owner__', {
        title: 'New Anonymous Message',
        body: 'Someone sent you a new message!',
        url: '/admin'
      });

      res.status(201).json({
        success: true,
        message: {
          id: message.id,
          senderUsername: message.senderUsername,
          content: message.content,
          createdAt: message.createdAt,
        },
      });
    } catch (err) {
      console.error('Error saving message:', err);
      res.status(500).json({ error: 'Failed to save message. Please try again.' });
    }
  }
);

// Get this visitor's replies - password is required every time.
router.post(
  '/replies',
  requireVisitor,
  createRateLimiter('get_replies', 15 * 60 * 1000, 10),
  validatePassword,
  async (req, res) => {
    try {
      const { password } = req.body;
      const username = req.visitor.username;
      const user = await getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ error: 'Username not found.' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Wrong password. Replies stay locked without it.' });
      }

      const messages = await getMessagesByUsername(username);
      res.json({ messages });
    } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: 'Failed to fetch messages.' });
    }
  }
);

router.get('/messages', (req, res) => {
  res.status(405).json({ error: 'Replies require your password. Use the secure replies form.' });
});

export default router;
