import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/db.js';

async function verifyToken(token) {
  const secret = await getJwtSecret();
  return jwt.verify(token, secret);
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.admin_token || req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }

  try {
    const decoded = await verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export async function requireVisitor(req, res, next) {
  const token = req.cookies?.visitor_token;

  if (!token) {
    return res.status(401).json({ error: 'Please create your private username first.' });
  }

  try {
    const decoded = await verifyToken(token);
    if (decoded.role !== 'visitor' || typeof decoded.username !== 'string') {
      return res.status(403).json({ error: 'Invalid or expired visitor session.' });
    }

    req.visitor = { username: decoded.username };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired visitor session.' });
  }
}
