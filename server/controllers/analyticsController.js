import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import Registration from '../models/Registration.js';
import PointsHistory from '../models/PointsHistory.js';
import { teamBoard } from '../services/leaderboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Build an employee match filter from query params.
const empFilter = (q = {}) => {
  const f = {};
  if (q.department) f.department = q.department;
  if (q.location) f.location = q.location;
  return f;
};

// GET /api/analytics/participation
export const participation = asyncHandler(async (req, res) => {
  const filter = empFilter(req.query);

  const totalRegistered = await Employee.countDocuments(filter);
  const participated = await Employee.countDocuments({ ...filter, 'activitiesJoined.0': { $exists: true } });
  const participationRate = totalRegistered ? Math.round((participated / totalRegistered) * 100) : 0;

  const activitiesConducted = await Activity.countDocuments();
  const activitiesCompleted = await Activity.countDocuments({ status: 'completed' });

  const byPopularity = await Activity.aggregate([
    { $project: { name: 1, type: 1, enrolledCount: { $size: '$enrolled' } } },
    { $sort: { enrolledCount: -1 } },
  ]);

  res.json({
    success: true,
    participation: {
      totalRegistered,
      participationRate,
      activitiesConducted,
      activitiesCompleted,
      mostPopular: byPopularity[0] || null,
      leastPopular: byPopularity[byPopularity.length - 1] || null,
      activityPopularity: byPopularity,
    },
  });
});

// GET /api/analytics/engagement
export const engagement = asyncHandler(async (req, res) => {
  const filter = empFilter(req.query);

  const topContributors = await Employee.find(filter)
    .sort({ totalPoints: -1 }).limit(10)
    .select('name department totalPoints').lean();

  const mostActive = await Employee.aggregate([
    { $match: filter },
    { $project: { name: 1, department: 1, joined: { $size: '$activitiesJoined' } } },
    { $sort: { joined: -1 } },
    { $limit: 10 },
  ]);

  const mostConsistent = await Employee.find(filter)
    .sort({ participationPct: -1 }).limit(10)
    .select('name department participationPct').lean();

  const topSocial = await Employee.find(filter)
    .sort({ socialPoints: -1 }).limit(10)
    .select('name department socialPoints socialMetrics').lean();

  res.json({
    success: true,
    engagement: { topContributors, mostActive, mostConsistent, topSocial },
  });
});

// GET /api/analytics/team
export const team = asyncHandler(async (_req, res) => {
  const teams = await teamBoard();
  res.json({
    success: true,
    team: {
      topTeams: teams.slice(0, 5),
      rankings: teams,
      participationRates: teams.map((t) => ({ manager: t.manager, rate: t.avgParticipation })),
      engagementScores: teams.map((t) => ({ manager: t.manager, social: t.socialScore })),
    },
  });
});

// GET /api/analytics/trends?from=&to=
export const trends = asyncHandler(async (req, res) => {
  const dateMatch = {};
  if (req.query.from) dateMatch.$gte = new Date(req.query.from);
  if (req.query.to) dateMatch.$lte = new Date(req.query.to);
  const hasRange = Object.keys(dateMatch).length > 0;

  // Daily participation = registrations grouped by enroll day
  const dailyParticipation = await Registration.aggregate([
    ...(hasRange ? [{ $match: { enrolledAt: dateMatch } }] : []),
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Engagement trend = social point history grouped by day
  const engagementTrend = await PointsHistory.aggregate([
    { $match: { source: 'social', ...(hasRange ? { createdAt: dateMatch } : {}) } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, points: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);

  // Points awarded per day (proxy for leaderboard movement)
  const pointsAwarded = await PointsHistory.aggregate([
    ...(hasRange ? [{ $match: { createdAt: dateMatch } }] : []),
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, points: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);

  // Activity-wise performance
  const activityPerformance = await Activity.aggregate([
    {
      $project: {
        name: 1,
        type: 1,
        enrolledCount: { $size: '$enrolled' },
        attendedCount: { $size: '$attended' },
      },
    },
    { $sort: { enrolledCount: -1 } },
  ]);

  res.json({
    success: true,
    trends: { dailyParticipation, engagementTrend, pointsAwarded, activityPerformance },
  });
});
