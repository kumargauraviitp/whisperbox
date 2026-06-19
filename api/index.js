import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initDb } from './database.js';

const app = express();

// Trust only the configured proxy hops in hosted environments.
const trustProxyHops = process.env.TRUST_PROXY_HOPS
  ? Number.parseInt(process.env.TRUST_PROXY_HOPS, 10)
  : (process.env.VERCEL ? 1 : 0);
app.set('trust proxy', Number.isNaN(trustProxyHops) ? 0 : trustProxyHops);

// DB startup state: 'loading' | 'ready' | 'failed'. While loading, requests
// briefly wait; if init fails (or takes too long) we fail closed with 503 so
// nothing ever proceeds against a broken database.
let dbState = 'loading';
const DB_READY_TIMEOUT_MS = 8000;

initDb().then(async () => {
  dbState = 'ready';
  console.log('Database initialized');
  await initPush();
  console.log('Push notifications initialized');
}).catch(err => {
  dbState = 'failed';
  console.error('Database initialization failed:', err);
});

// Block requests until the DB is ready; fail closed if it never comes up.
app.use((req, res, next) => {
  if (dbState === 'failed') {
    return res.status(503).json({ error: 'Service unavailable. Please try again shortly.' });
  }
  if (dbState === 'ready') {
    return next();
  }
  // Still loading — give it a bounded amount of time, then give up cleanly.
  const deadline = Date.now() + DB_READY_TIMEOUT_MS;
  const check = () => {
    if (dbState === 'ready') return next();
    if (dbState === 'failed' || Date.now() >= deadline) {
      return res.status(503).json({ error: 'Service is starting up. Please try again shortly.' });
    }
    setTimeout(check, 100);
  };
  check();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ status: dbState === 'ready' ? 'ok' : dbState, timestamp: new Date().toISOString(), dbState });
});

// Routes
import messagesRouter from './routes/messages.js';
import adminRouter from './routes/admin.js';
import usersRouter from './routes/users.js';
import { router as notificationsRouter } from './routes/notifications.js';
import keepaliveRouter from './routes/keepalive.js';
import { initPush } from './utils/push.js';

app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);
// Background heartbeat to keep the Supabase project from being paused for
// inactivity. Called by Vercel Cron; auth-gated and self-throttling.
app.use('/api/cron', keepaliveRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
