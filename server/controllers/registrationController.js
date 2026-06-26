import Activity from '../models/Activity.js';
import Registration from '../models/Registration.js';
import Employee from '../models/Employee.js';
import { awardWinners } from '../services/pointsEngine.js';
import { broadcastChange, emitActivityUpdate } from '../services/realtime.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

// GET /api/activities/:id/registrations  (admin)
export const listRegistrations = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id).lean();
  if (!activity) throw new ApiError(404, 'Activity not found');

  const regs = await Registration.find({ activity: req.params.id })
    .populate('employee', 'name employeeId department location totalPoints')
    .sort({ enrolledAt: 1 })
    .lean();

  const attendedSet = new Set((activity.attended || []).map(String));
  const rows = regs.map((r) => ({
    registrationId: r._id,
    status: r.status,
    enrolledAt: r.enrolledAt,
    attended: attendedSet.has(String(r.employee?._id)),
    employee: r.employee,
  }));

  res.json({
    success: true,
    activity: { _id: activity._id, name: activity.name, type: activity.type },
    count: rows.length,
    registrations: rows,
  });
});

// PATCH /api/activities/:id/attendance  (admin)  body: { employeeId, attended }
export const toggleAttendance = asyncHandler(async (req, res) => {
  const { employeeId, attended } = req.body;
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, 'Activity not found');

  const emp = await Employee.findById(employeeId);
  if (!emp) throw new ApiError(404, 'Employee not found');

  const has = activity.attended.some((e) => e.equals(emp._id));
  if (attended && !has) activity.attended.push(emp._id);
  if (!attended && has) activity.attended = activity.attended.filter((e) => !e.equals(emp._id));
  await activity.save();

  await Registration.findOneAndUpdate(
    { employee: emp._id, activity: activity._id },
    { status: attended ? 'attended' : 'enrolled' }
  );

  emitActivityUpdate({ reason: 'attendance', id: activity._id });
  res.json({ success: true, message: 'Attendance updated' });
});

// POST /api/activities/:id/winners  (admin)  body: { first, second, third }
export const assignWinners = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, 'Activity not found');

  const { first = null, second = null, third = null } = req.body;
  await awardWinners(activity, { first, second, third });

  emitActivityUpdate({ reason: 'winners', id: activity._id });
  broadcastChange({ reason: 'winners', activity: activity._id });

  const populated = await Activity.findById(activity._id)
    .populate('winners.first winners.second winners.third', 'name employeeId')
    .lean();
  res.json({ success: true, message: 'Winners assigned and points awarded', activity: populated });
});
