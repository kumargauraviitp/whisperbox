import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

export const db = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function initDb() {
  const { error: connectionError } = await db
    .from('admin_config')
    .select('key')
    .limit(1);

  if (connectionError) {
    throw new Error(
      `Supabase initialization failed. Run supabase/schema.sql first. ${connectionError.message}`
    );
  }

  const { data: pinRow, error: pinError } = await db
    .from('admin_config')
    .select('value')
    .eq('key', 'admin_pin_hash')
    .maybeSingle();

  if (pinError) {
    throw pinError;
  }

  if (!pinRow) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const defaultHash = bcrypt.hashSync(adminPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'));
      const { error } = await db
        .from('admin_config')
        .upsert({ key: 'admin_pin_hash', value: defaultHash });
      if (error) {
        throw error;
      }
    }
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a long random value of at least 32 characters.');
  }
}

// Cleanup old rate limit logs (older than 24 hours)
async function cleanupRateLimit() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  await db.from('rate_limit_log').delete().lt('timestamp', cutoff);
}

// Run cleanup every hour
setInterval(cleanupRateLimit, 60 * 60 * 1000);
