import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import { recomputeDerived } from '../services/pointsEngine.js';
import { broadcastChange } from '../services/realtime.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const {
    name, employeeId, email, password,
    department, location, lob, manager, designation, role,
  } = req.body;

  const exists = await Employee.findOne({ $or: [{ email }, { employeeId }] });
  if (exists) throw new ApiError(409, 'An account with that email or employee ID already exists');

  const employee = new Employee({
    name, employeeId, email,
    department, location, lob, manager, designation,
    role: role === 'admin' ? 'admin' : 'employee',
  });
  employee.password = password; // hashed by pre-save hook
  await employee.save();
  await recomputeDerived(employee);

  broadcastChange({ reason: 'register' });

  res.status(201).json({
    success: true,
    token: signToken(employee._id),
    user: employee.toJSON(),
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const employee = await Employee.findOne({ email }).select('+passwordHash');
  if (!employee || !(await employee.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({
    success: true,
    token: signToken(employee._id),
    user: employee.toJSON(),
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});
