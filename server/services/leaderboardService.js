import Employee from '../models/Employee.js';

/**
 * leaderboardService — all ranking + rollup logic via MongoDB aggregation.
 */

/** Organization leaderboard: every employee ranked by totalPoints. */
export const organizationBoard = async (limit = 0) => {
  const q = Employee.find({}, 'name employeeId department location totalPoints participationPct badges')
    .sort({ totalPoints: -1, name: 1 });
  if (limit) q.limit(limit);
  const rows = await q.lean();
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
};

/** Find an employee's organization rank (1-based). */
export const rankFor = async (employeeId) => {
  const emp = await Employee.findById(employeeId).select('totalPoints').lean();
  if (!emp) return null;
  const higher = await Employee.countDocuments({ totalPoints: { $gt: emp.totalPoints } });
  return higher + 1;
};

/** Team leaderboard grouped by People Manager. */
export const teamBoard = async () => {
  const rows = await Employee.aggregate([
    {
      $group: {
        _id: '$manager',
        teamSize: { $sum: 1 },
        teamScore: { $sum: '$totalPoints' },
        avgParticipation: { $avg: '$participationPct' },
        socialScore: { $sum: '$socialPoints' },
      },
    },
    { $sort: { teamScore: -1 } },
  ]);
  return rows.map((r, i) => ({
    rank: i + 1,
    manager: r._id,
    teamSize: r.teamSize,
    teamScore: r.teamScore,
    avgParticipation: Math.round(r.avgParticipation || 0),
    socialScore: r.socialScore,
  }));
};

/** Drill-down: all members of one manager's team with their scores. */
export const teamMembers = async (manager) => {
  const members = await Employee.find(
    { manager },
    'name employeeId department location totalPoints participationPct activitiesJoined activitiesWon socialPoints'
  )
    .sort({ totalPoints: -1 })
    .lean();
  return members.map((m, i) => ({
    rank: i + 1,
    ...m,
    activitiesJoined: m.activitiesJoined?.length || 0,
    activitiesWon: m.activitiesWon?.length || 0,
  }));
};

/** Department leaderboard. */
export const departmentBoard = async () => {
  const rows = await Employee.aggregate([
    {
      $group: {
        _id: '$department',
        totalPoints: { $sum: '$totalPoints' },
        headcount: { $sum: 1 },
        avgParticipation: { $avg: '$participationPct' },
      },
    },
    { $sort: { totalPoints: -1 } },
  ]);
  return rows.map((r, i) => ({
    rank: i + 1,
    department: r._id,
    totalPoints: r.totalPoints,
    avgPointsPerEmployee: r.headcount ? Math.round(r.totalPoints / r.headcount) : 0,
    participationRate: Math.round(r.avgParticipation || 0),
  }));
};

/** Location leaderboard. */
export const locationBoard = async () => {
  const rows = await Employee.aggregate([
    {
      $group: {
        _id: '$location',
        totalPoints: { $sum: '$totalPoints' },
        participants: { $sum: 1 },
        avgParticipation: { $avg: '$participationPct' },
      },
    },
    { $sort: { totalPoints: -1 } },
  ]);
  return rows.map((r, i) => ({
    rank: i + 1,
    location: r._id,
    totalParticipants: r.participants,
    totalPoints: r.totalPoints,
    participationPct: Math.round(r.avgParticipation || 0),
  }));
};

export default {
  organizationBoard,
  rankFor,
  teamBoard,
  teamMembers,
  departmentBoard,
  locationBoard,
};
