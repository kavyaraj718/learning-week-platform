import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import PointsHistory from '../models/PointsHistory.js';
import { rankFor, teamBoard } from '../services/leaderboardService.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

// GET /api/employees
export const listEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find().sort({ totalPoints: -1 }).lean();
  res.json({ success: true, count: employees.length, employees });
});

// GET /api/employees/:id
export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('activitiesJoined', 'name date type')
    .populate('activitiesWon', 'name date type');
  if (!employee) throw new ApiError(404, 'Employee not found');
  res.json({ success: true, employee });
});

// GET /api/employees/:id/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).lean();
  if (!employee) throw new ApiError(404, 'Employee not found');

  const rank = await rankFor(req.params.id);

  // Team rank for this employee's manager
  const teams = await teamBoard();
  const team = teams.find((t) => t.manager === employee.manager);

  // Nearest competitors (one above, one below) by total points
  const above = await Employee.findOne({ totalPoints: { $gt: employee.totalPoints } })
    .sort({ totalPoints: 1 })
    .select('name totalPoints')
    .lean();
  const below = await Employee.findOne({ totalPoints: { $lt: employee.totalPoints } })
    .sort({ totalPoints: -1 })
    .select('name totalPoints')
    .lean();

  // Next upcoming activity the employee hasn't joined
  const nextActivity = await Activity.findOne({
    date: { $gte: new Date() },
    _id: { $nin: employee.activitiesJoined || [] },
  })
    .sort({ date: 1 })
    .select('name date time type participationPoints')
    .lean();

  const recentPoints = await PointsHistory.find({ employee: req.params.id })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('activity', 'name')
    .lean();

  res.json({
    success: true,
    dashboard: {
      totalPoints: employee.totalPoints,
      rank,
      teamRank: team ? team.rank : null,
      teamName: employee.manager,
      activitiesJoined: employee.activitiesJoined?.length || 0,
      activitiesWon: employee.activitiesWon?.length || 0,
      participationPct: employee.participationPct,
      socialPoints: employee.socialPoints,
      badges: employee.badges,
      buckets: {
        participation: employee.participationPoints,
        winner: employee.winnerPoints,
        bonus: employee.bonusPoints,
        social: employee.socialPoints,
      },
      competitors: { above, below },
      nextActivity,
      recentPoints,
    },
  });
});

// GET /api/employees/:id/points-history
export const getPointsHistory = asyncHandler(async (req, res) => {
  const history = await PointsHistory.find({ employee: req.params.id })
    .sort({ createdAt: -1 })
    .populate('activity', 'name')
    .lean();
  res.json({ success: true, count: history.length, history });
});
