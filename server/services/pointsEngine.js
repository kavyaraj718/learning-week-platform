import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import Registration from '../models/Registration.js';
import PointsHistory from '../models/PointsHistory.js';
import PointsConfig from '../models/PointsConfig.js';
import SocialEngagement from '../models/SocialEngagement.js';
import { broadcastChange } from './realtime.js';

/**
 * pointsEngine — the ONLY module that mutates employee point buckets.
 *
 * Total score = participationPoints + winnerPoints + bonusPoints + socialPoints
 *
 * Every change:
 *   1. updates the relevant bucket,
 *   2. recomputes totalPoints + participationPct,
 *   3. writes a PointsHistory entry,
 *   4. (callers) broadcast realtime updates.
 */

const log = async (employeeId, source, amount, { activity = null, note = '' } = {}) => {
  if (!amount) return;
  await PointsHistory.create({ employee: employeeId, source, amount, activity, note });
};

const totalActivityCount = async () => Activity.countDocuments();

/** Recompute derived fields (total + participation %) for one employee doc. */
export const recomputeDerived = async (employee, activityCount) => {
  const count = activityCount ?? (await totalActivityCount());
  employee.totalPoints =
    (employee.participationPoints || 0) +
    (employee.winnerPoints || 0) +
    (employee.bonusPoints || 0) +
    (employee.socialPoints || 0);
  employee.participationPct = count
    ? Math.round(((employee.activitiesJoined?.length || 0) / count) * 100)
    : 0;
  await employee.save();
  return employee;
};

/** Award participation points for enrolling in an activity. */
export const awardParticipation = async (employeeId, activity) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;

  const cfg = await PointsConfig.getConfig();
  const pts = activity.participationPoints ?? cfg.participationPoints;

  if (!employee.activitiesJoined.some((a) => a.equals(activity._id))) {
    employee.activitiesJoined.push(activity._id);
  }
  employee.participationPoints += pts;
  await log(employee._id, 'participation', pts, { activity: activity._id, note: `Joined ${activity.name}` });
  await recomputeDerived(employee);
  return { employee, pointsAwarded: pts };
};

/**
 * Assign winners for an activity and award winner points.
 * `winnerIds` = { first, second, third } (each an Employee _id or null).
 * Re-running replaces prior winners and reverses their points.
 */
export const awardWinners = async (activity, winnerIds) => {
  const cfg = await PointsConfig.getConfig();
  const map = { first: cfg.winnerPoints.first, second: cfg.winnerPoints.second, third: cfg.winnerPoints.third };

  // Reverse any previously-assigned winners for this activity.
  const prev = ['first', 'second', 'third']
    .map((p) => activity.winners?.[p])
    .filter(Boolean);
  for (const pid of prev) {
    const emp = await Employee.findById(pid);
    if (!emp) continue;
    // Subtract the winner-points that were logged for this activity.
    const prior = await PointsHistory.find({ employee: emp._id, source: 'winner', activity: activity._id });
    const sub = prior.reduce((s, h) => s + h.amount, 0);
    emp.winnerPoints = Math.max(0, emp.winnerPoints - sub);
    emp.activitiesWon = emp.activitiesWon.filter((a) => !a.equals(activity._id));
    await PointsHistory.deleteMany({ employee: emp._id, source: 'winner', activity: activity._id });
    await recomputeDerived(emp);
  }

  // Apply new winners.
  activity.winners = { first: null, second: null, third: null };
  for (const place of ['first', 'second', 'third']) {
    const empId = winnerIds[place];
    if (!empId) continue;
    activity.winners[place] = empId;
    const emp = await Employee.findById(empId);
    if (!emp) continue;
    const pts = map[place];
    emp.winnerPoints += pts;
    if (!emp.activitiesWon.some((a) => a.equals(activity._id))) emp.activitiesWon.push(activity._id);
    if (!emp.badges.includes('Activity Winner')) emp.badges.push('Activity Winner');
    await Registration.findOneAndUpdate(
      { employee: emp._id, activity: activity._id },
      { status: 'won' }
    );
    await log(emp._id, 'winner', pts, { activity: activity._id, note: `${place} place — ${activity.name}` });
    await recomputeDerived(emp);
  }

  activity.status = 'completed';
  await activity.save();
  return activity;
};

/** Admin-awarded bonus points with a reason note. */
export const awardBonus = async (employeeId, amount, note = 'Bonus') => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;
  employee.bonusPoints += Number(amount);
  await log(employee._id, 'bonus', Number(amount), { note });
  await recomputeDerived(employee);
  return employee;
};

/**
 * Sync social engagement points from the SocialEngagement collection into
 * employee.socialPoints. Returns the number of employees updated.
 */
export const syncSocial = async () => {
  const feeds = await SocialEngagement.find();
  const activityCount = await totalActivityCount();
  let updated = 0;
  const now = new Date();

  for (const feed of feeds) {
    const emp = await Employee.findOne({ employeeId: feed.employeeId });
    if (!emp) continue;

    const delta = feed.engagementPoints - (emp.socialPoints || 0);
    emp.socialPoints = feed.engagementPoints;
    emp.socialMetrics = {
      likes: feed.likes,
      comments: feed.comments,
      shares: feed.shares,
      posts: feed.posts,
      interactions: feed.interactions,
    };
    if (delta) await log(emp._id, 'social', delta, { note: 'Social engagement sync' });
    await recomputeDerived(emp, activityCount);

    feed.lastSyncedAt = now;
    await feed.save();
    updated += 1;
  }
  return { updated, lastSyncedAt: now };
};

export default {
  recomputeDerived,
  awardParticipation,
  awardWinners,
  awardBonus,
  syncSocial,
  broadcastChange,
};
