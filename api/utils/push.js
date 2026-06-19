import webpush from 'web-push';
import crypto from 'crypto';
import { db } from '../database.js';

let vapidKeys = null;

export async function initPush() {
  const { data: pubKeyRow, error: pubKeyError } = await db
    .from('admin_config')
    .select('value')
    .eq('key', 'vapid_public_key')
    .maybeSingle();

  const { data: privKeyRow, error: privKeyError } = await db
    .from('admin_config')
    .select('value')
    .eq('key', 'vapid_private_key')
    .maybeSingle();

  if (pubKeyError) throw pubKeyError;
  if (privKeyError) throw privKeyError;

  if (pubKeyRow && privKeyRow) {
    vapidKeys = {
      publicKey: pubKeyRow.value,
      privateKey: privKeyRow.value
    };
  } else {
    // Generate new VAPID keys
    vapidKeys = webpush.generateVAPIDKeys();
    
    await db.from('admin_config').upsert({ key: 'vapid_public_key', value: vapidKeys.publicKey });
    await db.from('admin_config').upsert({ key: 'vapid_private_key', value: vapidKeys.privateKey });
  }

  // Use a dummy email if process.env.VAPID_MAILTO is not set
  const subject = process.env.VAPID_MAILTO || 'mailto:admin@whisperbox.local';
  webpush.setVapidDetails(subject, vapidKeys.publicKey, vapidKeys.privateKey);
}

export function getVapidPublicKey() {
  if (!vapidKeys) throw new Error("Push not initialized");
  return vapidKeys.publicKey;
}

export async function sendPushNotification(target, payload) {
  try {
    const { data: subs, error } = await db
      .from('push_subscriptions')
      .select('*')
      .eq('target', target);

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return;
    }

    if (!subs || subs.length === 0) return;

    const payloadString = JSON.stringify(payload);

    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payloadString);
      } catch (err) {
        // If the subscription is gone (410), delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Error sending push notification:', err);
        }
      }
    }));
  } catch (error) {
    console.error('Critical error in sendPushNotification:', error);
  }
}
