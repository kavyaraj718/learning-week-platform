import Activity from '../models/Activity.js';
import Registration from '../models/Registration.js';
import { awardParticipation } from '../services/pointsEngine.js';
import { broadcastChange, emitActivityUpdate } from '../services/realtime.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

// GET /api/activities
export const listActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find().sort({ date: 1 }).lean();

  // Annotate each with the current user's status, if authenticated.
  let myRegs = [];
  if (req.user) {
    myRegs = await Registration.find({ employee: req.user._id }).lean();
  }
  const statusByActivity = Object.fromEntries(myRegs.map((r) => [String(r.activity), r.status]));

  const enriched = activities.map((a) => ({
    ...a,
    enrolledCount: a.enrolled?.length || 0,
    myStatus: statusByActivity[String(a._id)] || null,
  }));

  res.json({ success: true, count: enriched.length, activities: enriched });
});

// GET /api/activities/:id
export const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
    .populate('winners.first winners.second winners.third', 'name employeeId')
    .lean();
  if (!activity) throw new ApiError(404, 'Activity not found');

  let myStatus = null;
  if (req.user) {
    const reg = await Registration.findOne({ employee: req.user._id, activity: activity._id }).lean();
    myStatus = reg?.status || null;
  }
  res.json({ success: true, activity: { ...activity, enrolledCount: activity.enrolled?.length || 0, myStatus } });
});

// POST /api/activities  (admin)
export const createActivity = asyncHandler(async (req, res) => {
  const { name, description, category, date, time, type, participationPoints } = req.body;
  const activity = await Activity.create({
    name, description, category, date, time, type, participationPoints,
  });
  emitActivityUpdate({ reason: 'create', id: activity._id });
  broadcastChange({ reason: 'activity-create' });
  res.status(201).json({ success: true, activity });
});

// PUT /api/activities/:id  (admin)
export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!activity) throw new ApiError(404, 'Activity not found');
  emitActivityUpdate({ reason: 'update', id: activity._id });
  res.json({ success: true, activity });
});

// DELETE /api/activities/:id  (admin)
export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findByIdAndDelete(req.params.id);
  if (!activity) throw new ApiError(404, 'Activity not found');
  await Registration.deleteMany({ activity: activity._id });
  emitActivityUpdate({ reason: 'delete', id: req.params.id });
  broadcastChange({ reason: 'activity-delete' });
  res.json({ success: true, message: 'Activity deleted' });
});

// POST /api/activities/:id/enroll  (employee)
export const enroll = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new ApiError(404, 'Activity not found');

  const already = await Registration.findOne({ employee: req.user._id, activity: activity._id });
  if (already) throw new ApiError(409, 'You are already enrolled in this activity');

  await Registration.create({ employee: req.user._id, activity: activity._id, status: 'enrolled' });
  if (!activity.enrolled.some((e) => e.equals(req.user._id))) {
    activity.enrolled.push(req.user._id);
    if (activity.status === 'upcoming') activity.status = 'running';
    await activity.save();
  }

  const result = await awardParticipation(req.user._id, activity);
  emitActivityUpdate({ reason: 'enroll', id: activity._id });
  broadcastChange({ reason: 'enroll', employee: req.user._id });

  res.status(201).json({
    success: true,
    message: `Enrolled — +${result?.pointsAwarded || 0} points`,
    pointsAwarded: result?.pointsAwarded || 0,
    user: result?.employee?.toJSON?.() || null,
  });
});
