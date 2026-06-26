import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/stats/live
export const liveStats = asyncHandler(async (_req, res) => {
  const totalParticipants = await Employee.countDocuments({ role: 'employee' });
  const activitiesRunning = await Activity.countDocuments({ status: { $in: ['running', 'upcoming'] } });

  const [agg] = await Employee.aggregate([
    { $group: { _id: null, totalPoints: { $sum: '$totalPoints' } } },
  ]);
  const totalPointsAwarded = agg?.totalPoints || 0;

  const teams = await Employee.distinct('manager');

  res.json({
    success: true,
    stats: {
      totalParticipants,
      activitiesRunning,
      totalPointsAwarded,
      teamsCompeting: teams.length,
    },
  });
});
