import { validationResult } from 'express-validator';
import { ApiError } from '../utils/asyncHandler.js';

/**
 * Run after a chain of express-validator checks. Collapses errors into a 400.
 */
export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join('; ');
    return next(new ApiError(400, msg));
  }
  next();
};

export default validate;
