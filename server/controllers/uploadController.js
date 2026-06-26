import xlsx from 'xlsx';
import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import Registration from '../models/Registration.js';
import { awardParticipation, awardWinners, awardBonus } from '../services/pointsEngine.js';
import { broadcastChange, emitActivityUpdate } from '../services/realtime.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

// Parse an uploaded .xlsx/.csv buffer into an array of row objects.
const readRows = (file) => {
  if (!file) throw new ApiError(400, 'No file uploaded');
  const wb = xlsx.read(file.buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
};

const findEmployee = async (employeeId) =>
  Employee.findOne({ employeeId: String(employeeId).trim() });

const findActivity = async (name) =>
  Activity.findOne({ name: new RegExp(`^${String(name).trim()}$`, 'i') });

const isPreview = (req) => String(req.body.mode || req.query.mode || 'apply') === 'preview';

// POST /api/upload/participation  (admin)  columns: employeeId, activityName
export const bulkParticipation = asyncHandler(async (req, res) => {
  const rows = readRows(req.file);
  const results = [];
  const preview = isPreview(req);

  for (const [i, row] of rows.entries()) {
    const employeeId = row.employeeId || row.EmployeeID || row['Employee ID'];
    const activityName = row.activityName || row.Activity || row['Activity Name'];
    const r = { line: i + 2, employeeId, activityName, status: 'ok', message: '' };

    const emp = await findEmployee(employeeId);
    const act = await findActivity(activityName);
    if (!emp) { r.status = 'error'; r.message = 'Unknown employeeId'; results.push(r); continue; }
    if (!act) { r.status = 'error'; r.message = 'Unknown activity'; results.push(r); continue; }

    if (!preview) {
      const exists = await Registration.findOne({ employee: emp._id, activity: act._id });
      if (!exists) {
        await Registration.create({ employee: emp._id, activity: act._id, status: 'attended' });
        if (!act.enrolled.some((e) => e.equals(emp._id))) { act.enrolled.push(emp._id); await act.save(); }
        await awardParticipation(emp._id, act);
        r.message = 'Participation recorded';
      } else {
        r.message = 'Already enrolled — skipped';
      }
    }
    results.push(r);
  }

  if (!preview) { emitActivityUpdate({ reason: 'bulk-participation' }); broadcastChange({ reason: 'bulk-participation' }); }
  res.json({ success: true, mode: preview ? 'preview' : 'applied', total: rows.length, results });
});

// POST /api/upload/winners  (admin)  columns: activityName, position(first|second|third), employeeId
export const bulkWinners = asyncHandler(async (req, res) => {
  const rows = readRows(req.file);
  const preview = isPreview(req);
  const results = [];

  // Group rows by activity → { first, second, third }
  const byActivity = new Map();
  for (const [i, row] of rows.entries()) {
    const activityName = row.activityName || row.Activity || row['Activity Name'];
    const position = String(row.position || row.Position || '').toLowerCase().trim();
    const employeeId = row.employeeId || row.EmployeeID || row['Employee ID'];
    const r = { line: i + 2, activityName, position, employeeId, status: 'ok', message: '' };

    const act = await findActivity(activityName);
    const emp = await findEmployee(employeeId);
    if (!act) { r.status = 'error'; r.message = 'Unknown activity'; results.push(r); continue; }
    if (!['first', 'second', 'third'].includes(position)) { r.status = 'error'; r.message = 'position must be first/second/third'; results.push(r); continue; }
    if (!emp) { r.status = 'error'; r.message = 'Unknown employeeId'; results.push(r); continue; }

    const key = String(act._id);
    if (!byActivity.has(key)) byActivity.set(key, { activity: act, winners: { first: null, second: null, third: null } });
    byActivity.get(key).winners[position] = emp._id;
    r.message = 'Validated';
    results.push(r);
  }

  if (!preview) {
    for (const { activity, winners } of byActivity.values()) {
      await awardWinners(activity, winners);
      emitActivityUpdate({ reason: 'bulk-winners', id: activity._id });
    }
    broadcastChange({ reason: 'bulk-winners' });
  }
  res.json({ success: true, mode: preview ? 'preview' : 'applied', total: rows.length, results });
});

// POST /api/upload/bonus  (admin)  columns: employeeId, amount, note
export const bulkBonus = asyncHandler(async (req, res) => {
  const rows = readRows(req.file);
  const preview = isPreview(req);
  const results = [];

  for (const [i, row] of rows.entries()) {
    const employeeId = row.employeeId || row.EmployeeID || row['Employee ID'];
    const amount = Number(row.amount || row.Amount || row.Points || 0);
    const note = row.note || row.Note || row.Reason || 'Bulk bonus';
    const r = { line: i + 2, employeeId, amount, status: 'ok', message: '' };

    const emp = await findEmployee(employeeId);
    if (!emp) { r.status = 'error'; r.message = 'Unknown employeeId'; results.push(r); continue; }
    if (!amount || Number.isNaN(amount)) { r.status = 'error'; r.message = 'Invalid amount'; results.push(r); continue; }

    if (!preview) { await awardBonus(emp._id, amount, note); r.message = `+${amount} bonus`; }
    results.push(r);
  }

  if (!preview) broadcastChange({ reason: 'bulk-bonus' });
  res.json({ success: true, mode: preview ? 'preview' : 'applied', total: rows.length, results });
});

// POST /api/upload/attendance  (admin)  columns: employeeId, activityName, attended(yes/no)
export const bulkAttendance = asyncHandler(async (req, res) => {
  const rows = readRows(req.file);
  const preview = isPreview(req);
  const results = [];

  for (const [i, row] of rows.entries()) {
    const employeeId = row.employeeId || row.EmployeeID || row['Employee ID'];
    const activityName = row.activityName || row.Activity || row['Activity Name'];
    const attendedRaw = String(row.attended ?? row.Attended ?? 'yes').toLowerCase().trim();
    const attended = ['yes', 'y', 'true', '1', 'present'].includes(attendedRaw);
    const r = { line: i + 2, employeeId, activityName, attended, status: 'ok', message: '' };

    const emp = await findEmployee(employeeId);
    const act = await findActivity(activityName);
    if (!emp) { r.status = 'error'; r.message = 'Unknown employeeId'; results.push(r); continue; }
    if (!act) { r.status = 'error'; r.message = 'Unknown activity'; results.push(r); continue; }

    if (!preview) {
      const has = act.attended.some((e) => e.equals(emp._id));
      if (attended && !has) act.attended.push(emp._id);
      if (!attended && has) act.attended = act.attended.filter((e) => !e.equals(emp._id));
      await act.save();
      await Registration.findOneAndUpdate(
        { employee: emp._id, activity: act._id },
        { status: attended ? 'attended' : 'enrolled' }
      );
      r.message = attended ? 'Marked present' : 'Marked absent';
    }
    results.push(r);
  }

  if (!preview) emitActivityUpdate({ reason: 'bulk-attendance' });
  res.json({ success: true, mode: preview ? 'preview' : 'applied', total: rows.length, results });
});

// GET /api/upload/template/:type  → downloadable .xlsx with the right headers
export const downloadTemplate = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const headers = {
    winners: [{ activityName: 'Trivia & Quiz Night', position: 'first', employeeId: 'EMP1001' }],
    participation: [{ employeeId: 'EMP1001', activityName: 'Cloud Fundamentals Bootcamp' }],
    bonus: [{ employeeId: 'EMP1001', amount: 20, note: 'Event facilitation' }],
    attendance: [{ employeeId: 'EMP1001', activityName: 'Design Thinking Workshop', attended: 'yes' }],
  };
  const sample = headers[type];
  if (!sample) throw new ApiError(400, 'Unknown template type');

  const ws = xlsx.utils.json_to_sheet(sample);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'template');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${type}-template.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});
