import SocialEngagement from '../models/SocialEngagement.js';
import { syncSocial } from './pointsEngine.js';
import { broadcastChange } from './realtime.js';

/**
 * socialSyncService — represents the integration with the org's existing
 * social engagement platform. In this build it reads from the SocialEngagement
 * collection (the "secure Excel feed / DB sync"), folds engagement points into
 * employee totals via the points engine, and broadcasts live updates.
 */

export const runSync = async () => {
  const result = await syncSocial();
  broadcastChange({ reason: 'social-sync', ...result });
  return result;
};

export const getStatus = async () => {
  const feeds = await SocialEngagement.find().lean();
  const last = feeds.reduce((acc, f) => {
    if (f.lastSyncedAt && (!acc || f.lastSyncedAt > acc)) return f.lastSyncedAt;
    return acc;
  }, null);
  const totalEngagementPoints = feeds.reduce((s, f) => s + (f.engagementPoints || 0), 0);
  return {
    connectedAccounts: feeds.length,
    lastSyncedAt: last,
    totalEngagementPoints,
    modes: ['API integration', 'Scheduled DB sync', 'Secure Excel feed'],
  };
};

/** Optional scheduled re-sync controlled by SOCIAL_SYNC_INTERVAL_MS. */
export const startScheduledSync = () => {
  const ms = Number(process.env.SOCIAL_SYNC_INTERVAL_MS || 0);
  if (!ms) return null;
  console.log(`⏱️  Scheduled social sync every ${ms}ms`);
  return setInterval(() => {
    runSync().catch((e) => console.error('Scheduled social sync failed:', e.message));
  }, ms);
};

export default { runSync, getStatus, startScheduledSync };
