import { ApiError } from '../utils/asyncHandler.js';

/**
 * Gate a route to one or more roles. Use after `auth`.
 *   router.post('/', auth, roleCheck('admin'), handler)
 */
export const roleCheck = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authorized'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden — insufficient permissions'));
  }
  next();
};

export default roleCheck;
