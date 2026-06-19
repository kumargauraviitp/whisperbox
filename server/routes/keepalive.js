import express from 'express';
import { getKeepAliveState, setKeepAliveState } from '../utils/db.js';

const router = express.Router();

// How long to wait between real Supabase writes. Vercel Hobby crons only
// support once-per-day, so the cron fires daily but we only touch Supabase
// (a single tiny upsert) every PING_INTERVAL_MS. The daily reads themselves
// already count as DB activity and keep the project from going idle.
const PING_INTERVAL_MS = Number.parseInt(process.env.KEEPALIVE_INTERVAL_HOURS || '96', 10) * 60 * 60 * 1000;
const PING_INTERVAL_LABEL = `${PING_INTERVAL_MS / (60 * 60 * 1000)}h`;

// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` on
// every cron invocation, and also passes an x-vercel-cron header. Require
// either so random visitors/crawlers can't trigger the heartbeat. Allow
// CRON_SECRET to be unset in local dev for manual testing.
function authorize(req) {
  if (!process.env.CRON_SECRET) {
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = req.get('authorization') || '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
  const headerSecret = req.get('x-vercel-cron-secret')?.trim();

  // Timing-safe comparison against the configured secret.
  const expected = process.env.CRON_SECRET;
  const provided = bearer || headerSecret || '';
  if (provided.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * GET /api/cron/keepalive
 *
 * Intended to be called once per day by Vercel Cron. Each call reads a tiny
 * row from Supabase (already counts as activity). Only when KEEPALIVE_INTERVAL_HOURS
 * (default 96h = ~4 days) have elapsed since the last real ping do we perform
 * a single small upsert. Runs fully in the background; never touches app data.
 */
router.get('/keepalive', async (req, res) => {
  if (!authorize(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const startedAt = Date.now();
  const now = startedAt;
  let state;

  try {
    state = await getKeepAliveState();
  } catch (err) {
    console.error('Keep-alive read failed:', err.message);
    return res.status(200).json({
      ok: false,
      reason: 'read_failed',
      error: err.message,
      checkedAt: new Date(now).toISOString(),
    });
  }

  const elapsed = now - (state.lastPingAt || 0);
  const due = (state.lastPingAt || 0) === 0 || elapsed >= PING_INTERVAL_MS;

  if (!due) {
    // Not yet time for a real ping. The read above already registered activity;
    // stay quiet and return. This is the common, cheap path.
    const nextInHours = Math.max(0, Math.round((PING_INTERVAL_MS - elapsed) / (60 * 60 * 1000)));
    return res.status(200).json({
      ok: true,
      pinged: false,
      reason: 'not_due',
      lastPingAt: state.lastPingAt ? new Date(state.lastPingAt).toISOString() : null,
      pings: state.pings,
      intervalHours: PING_INTERVAL_MS / (60 * 60 * 1000),
      nextPingInHours: nextInHours,
      checkedAt: new Date(now).toISOString(),
    });
  }

  // Due for a real heartbeat — perform one tiny write and bump the counter.
  try {
    const nextState = {
      lastPingAt: now,
      pings: (state.pings || 0) + 1,
    };
    await setKeepAliveState(nextState);

    return res.status(200).json({
      ok: true,
      pinged: true,
      lastPingAt: new Date(now).toISOString(),
      pings: nextState.pings,
      intervalHours: PING_INTERVAL_MS / (60 * 60 * 1000),
      durationMs: Date.now() - startedAt,
      checkedAt: new Date(now).toISOString(),
    });
  } catch (err) {
    console.error('Keep-alive write failed:', err.message);
    return res.status(200).json({
      ok: false,
      pinged: false,
      reason: 'write_failed',
      error: err.message,
      checkedAt: new Date(now).toISOString(),
    });
  }
});

// Friendly note if someone GETs the cron root by accident.
router.get('/', (req, res) => {
  res.json({
    endpoint: '/api/cron/keepalive',
    interval: PING_INTERVAL_LABEL,
    authRequired: Boolean(process.env.CRON_SECRET) || process.env.NODE_ENV !== 'production',
  });
});

export default router;
