import { runSync, getStatus } from '../services/socialSyncService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/integration/social/sync  (admin)
export const syncNow = asyncHandler(async (_req, res) => {
  const result = await runSync();
  res.json({ success: true, message: `Synced ${result.updated} accounts`, ...result });
});

// GET /api/integration/social/status
export const status = asyncHandler(async (_req, res) => {
  const s = await getStatus();
  res.json({ success: true, status: s });
});
