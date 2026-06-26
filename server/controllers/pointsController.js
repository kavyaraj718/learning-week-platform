import PointsConfig from '../models/PointsConfig.js';
import { awardBonus } from '../services/pointsEngine.js';
import { broadcastChange } from '../services/realtime.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

// POST /api/points/bonus  (admin)  body: { employeeId, amount, note }
export const giveBonus = asyncHandler(async (req, res) => {
  const { employeeId, amount, note } = req.body;
  if (!amount || Number.isNaN(Number(amount))) throw new ApiError(400, 'A numeric amount is required');

  const employee = await awardBonus(employeeId, Number(amount), note || 'Bonus points');
  if (!employee) throw new ApiError(404, 'Employee not found');

  broadcastChange({ reason: 'bonus', employee: employeeId });
  res.json({ success: true, message: `Awarded ${amount} bonus points`, employee: employee.toJSON() });
});

// GET /api/points/config
export const getConfig = asyncHandler(async (_req, res) => {
  const cfg = await PointsConfig.getConfig();
  res.json({ success: true, config: cfg });
});

// PUT /api/points/config  (admin)
export const updateConfig = asyncHandler(async (req, res) => {
  const cfg = await PointsConfig.getConfig();
  const { participationPoints, winnerPoints } = req.body;

  if (participationPoints != null) cfg.participationPoints = Number(participationPoints);
  if (winnerPoints) {
    if (winnerPoints.first != null) cfg.winnerPoints.first = Number(winnerPoints.first);
    if (winnerPoints.second != null) cfg.winnerPoints.second = Number(winnerPoints.second);
    if (winnerPoints.third != null) cfg.winnerPoints.third = Number(winnerPoints.third);
  }
  await cfg.save();
  res.json({ success: true, message: 'Point configuration updated', config: cfg });
});
