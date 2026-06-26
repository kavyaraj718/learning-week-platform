import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import { teamBoard, departmentBoard } from '../services/leaderboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/recognition  — recomputed live from current data
export const getRecognition = asyncHandler(async (_req, res) => {
  const totalActivities = await Activity.countDocuments();

  const champion = await Employee.findOne().sort({ totalPoints: -1 })
    .select('name department totalPoints').lean();

  const mostEngaged = await Employee.findOne().sort({ participationPct: -1, totalPoints: -1 })
    .select('name department participationPct').lean();

  const socialChamp = await Employee.findOne().sort({ socialPoints: -1 })
    .select('name department socialPoints').lean();

  const teams = await teamBoard();
  const teamChamp = teams[0] || null;

  const depts = await departmentBoard();
  const deptChamp = depts[0] || null;

  // Consistency: participated in EVERY activity
  let consistency = [];
  if (totalActivities > 0) {
    consistency = await Employee.aggregate([
      { $project: { name: 1, department: 1, joined: { $size: '$activitiesJoined' } } },
      { $match: { joined: { $gte: totalActivities } } },
      { $sort: { name: 1 } },
    ]);
  }

  res.json({
    success: true,
    recognition: {
      learningWeekChampion: champion,
      mostEngagedEmployee: mostEngaged,
      socialEngagementChampion: socialChamp,
      teamChampion: teamChamp,
      departmentChampion: deptChamp,
      consistencyAward: consistency, // may be several or empty
      totalActivities,
    },
  });
});
