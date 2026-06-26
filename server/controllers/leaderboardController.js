import {
  organizationBoard,
  teamBoard,
  teamMembers,
  departmentBoard,
  locationBoard,
} from '../services/leaderboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/leaderboards/organization?limit=
export const organization = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 0);
  const rows = await organizationBoard(limit);
  res.json({ success: true, count: rows.length, leaderboard: rows });
});

// GET /api/leaderboards/team
export const team = asyncHandler(async (_req, res) => {
  const rows = await teamBoard();
  res.json({ success: true, count: rows.length, leaderboard: rows });
});

// GET /api/leaderboards/team/:manager
export const teamDetail = asyncHandler(async (req, res) => {
  const manager = decodeURIComponent(req.params.manager);
  const members = await teamMembers(manager);
  res.json({ success: true, manager, count: members.length, members });
});

// GET /api/leaderboards/department
export const department = asyncHandler(async (_req, res) => {
  const rows = await departmentBoard();
  res.json({ success: true, count: rows.length, leaderboard: rows });
});

// GET /api/leaderboards/location
export const location = asyncHandler(async (_req, res) => {
  const rows = await locationBoard();
  res.json({ success: true, count: rows.length, leaderboard: rows });
});
