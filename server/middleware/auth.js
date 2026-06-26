import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

/**
 * Verify the Bearer token and attach the current employee to req.user.
 */
export const auth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authorized — no token provided');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Not authorized — invalid or expired token');
  }

  const user = await Employee.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Not authorized — user no longer exists');

  req.user = user;
  next();
});

export default auth;
