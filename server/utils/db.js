import { db } from '../database.js';
import crypto from 'crypto';

// Max push subscriptions stored per target (one target = one visitor username,
// or '__owner__'). Old entries are evicted FIFO once the cap is reached.
const MAX_PUSH_SUBSCRIPTIONS_PER_TARGET = 5;

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function mapMessageRow(row) {
  return {
    id: row.id,
    sender_username: row.sender_username,
    content: row.content,
    created_at: row.created_at,
    reply: row.reply,
    replied_at: row.replied_at,
  };
}

export async function getMessages() {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(mapMessageRow);
}

export async function getMessagesByUsername(username) {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('sender_username', username.trim().toLowerCase())
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(mapMessageRow);
}

export async function saveMessage({ senderUsername, content, ipAddress, userAgent }) {
  const id = generateId();
  const username = senderUsername.trim().toLowerCase();
  const cleanContent = content.trim();
  const now = Date.now();

  const { error } = await db.from('messages').insert({
    id,
    sender_username: username,
    content: cleanContent,
    created_at: now,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  if (error) {
    throw error;
  }

  return { id, senderUsername: username, content: cleanContent, createdAt: now };
}

export async function addReply(id, reply) {
  const now = Date.now();
  const { data, error } = await db
    .from('messages')
    .update({ reply: reply.trim(), replied_at: now })
    .eq('id', id)
    .select('id, sender_username');

  if (error) {
    throw error;
  }

  return data.length > 0 ? data[0] : null;
}

export async function deleteMessage(id) {
  const { data, error } = await db
    .from('messages')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw error;
  }
  return (data && data.length > 0);
}

export async function getStats() {
  const [totalResult, pendingResult, repliedResult] = await Promise.all([
    db.from('messages').select('id', { count: 'exact', head: true }),
    db.from('messages').select('id', { count: 'exact', head: true }).is('reply', null),
    db.from('messages').select('id', { count: 'exact', head: true }).not('reply', 'is', null),
  ]);

  if (totalResult.error) throw totalResult.error;
  if (pendingResult.error) throw pendingResult.error;
  if (repliedResult.error) throw repliedResult.error;

  return {
    total: totalResult.count || 0,
    pending: pendingResult.count || 0,
    replied: repliedResult.count || 0,
  };
}

export async function getAdminPinHash() {
  const { data, error } = await db
    .from('admin_config')
    .select('value')
    .eq('key', 'admin_pin_hash')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.value || null;
}

export async function setAdminPinHash(hash) {
  const { error } = await db
    .from('admin_config')
    .upsert({ key: 'admin_pin_hash', value: hash });

  if (error) {
    throw error;
  }
}

export async function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a long random value of at least 32 characters.');
  }

  return process.env.JWT_SECRET;
}

export async function checkRateLimit(ip, endpoint, windowMs, max) {
  const cutoff = Date.now() - windowMs;
  const now = Date.now();

  const { count, error: countError } = await db
    .from('rate_limit_log')
    .select('timestamp', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('endpoint', endpoint)
    .gt('timestamp', cutoff);

  if (countError) {
    throw countError;
  }

  if ((count || 0) >= max) {
    return false;
  }

  const { error: insertError } = await db
    .from('rate_limit_log')
    .insert({ ip, endpoint, timestamp: now });

  if (insertError) {
    throw insertError;
  }

  return true;
}

export async function getUserByUsername(username) {
  const { data, error } = await db
    .from('app_users')
    .select('*')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createUser({
  username,
  usernameDisplay,
  passwordHash,
  ipAddress,
  userAgent,
}) {
  const now = Date.now();
  const user = {
    id: generateId(),
    username: username.trim().toLowerCase(),
    username_display: usernameDisplay.trim(),
    password_hash: passwordHash,
    created_at: now,
    last_seen_at: now,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  };

  const { data, error } = await db
    .from('app_users')
    .insert(user)
    .select('id, username, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function touchUser(username) {
  const { error } = await db
    .from('app_users')
    .update({ last_seen_at: Date.now() })
    .eq('username', username.trim().toLowerCase());

  if (error) {
    throw error;
  }
}

export async function checkUsernameRateLimit(username, endpoint, windowMs, max) {
  const cutoff = Date.now() - windowMs;

  const { count, error: countError } = await db
    .from('rate_limit_log')
    .select('timestamp', { count: 'exact', head: true })
    .eq('ip', `username:${username.trim().toLowerCase()}`)
    .eq('endpoint', endpoint)
    .gt('timestamp', cutoff);

  if (countError) {
    throw countError;
  }

  return (count || 0) < max;
}

export async function logFailedAttempt(username, endpoint) {
  const now = Date.now();
  const { error } = await db
    .from('rate_limit_log')
    .insert({
      ip: `username:${username.trim().toLowerCase()}`,
      endpoint,
      timestamp: now,
    });

  if (error) {
    throw error;
  }
}

export async function savePushSubscription(target, subscription) {
  const id = generateId();
  const now = Date.now();
  const endpoint = subscription?.endpoint || null;

  // Dedup: if this browser (by push endpoint) already subscribed for this
  // target, refresh its subscription payload instead of inserting a duplicate.
  if (endpoint) {
    const { data: existing, error: findError } = await db
      .from('push_subscriptions')
      .select('id')
      .eq('target', target)
      .eq('subscription->>endpoint', endpoint)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error: updateError } = await db
        .from('push_subscriptions')
        .update({ subscription, created_at: now })
        .eq('id', existing.id);
      if (updateError) throw updateError;
      return existing.id;
    }
  }

  // Cap: avoid unbounded growth per target. If the target is already at the
  // limit, drop the oldest before inserting the new one.
  const { count, error: countError } = await db
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('target', target);

  if (countError) throw countError;

  if ((count || 0) >= MAX_PUSH_SUBSCRIPTIONS_PER_TARGET) {
    const { data: oldest, error: oldestError } = await db
      .from('push_subscriptions')
      .select('id')
      .eq('target', target)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (oldestError) throw oldestError;
    if (oldest) {
      const { error: delError } = await db.from('push_subscriptions').delete().eq('id', oldest.id);
      if (delError) throw delError;
    }
  }

  const { error } = await db.from('push_subscriptions').insert({
    id,
    target,
    subscription,
    created_at: now
  });

  if (error) {
    throw error;
  }
  return id;
}

export async function getPushSubscriptions(target) {
  const { data, error } = await db
    .from('push_subscriptions')
    .select('*')
    .eq('target', target);

  if (error) {
    throw error;
  }
  return data;
}

export async function deletePushSubscription(id) {
  const { error } = await db
    .from('push_subscriptions')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
}

// --- Supabase keep-alive -------------------------------------------------
// Reuses the existing admin_config (key/value) table to store a tiny
// heartbeat. This touches no app data and needs no schema migration.
// The value is stored as a JSON string for easy forward compatibility.
export async function getKeepAliveState() {
  const { data, error } = await db
    .from('admin_config')
    .select('value')
    .eq('key', '_keepalive_state')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.value) {
    return { lastPingAt: 0, pings: 0 };
  }

  try {
    const parsed = JSON.parse(data.value);
    return {
      lastPingAt: Number(parsed.lastPingAt) || 0,
      pings: Number(parsed.pings) || 0,
    };
  } catch {
    return { lastPingAt: 0, pings: 0 };
  }
}

export async function setKeepAliveState(state) {
  const value = JSON.stringify({
    lastPingAt: Number(state.lastPingAt) || Date.now(),
    pings: Number(state.pings) || 0,
  });

  const { error } = await db
    .from('admin_config')
    .upsert({ key: '_keepalive_state', value });

  if (error) {
    throw error;
  }
}

