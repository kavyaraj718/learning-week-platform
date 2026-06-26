/* eslint-disable no-unused-vars */

// 404 for unmatched routes
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found — ${req.originalUrl}`));
};

// Central error handler. Translates common Mongoose errors to friendly messages.
export const errorHandler = (err, req, res, _next) => {
  let status = err.statusCode || res.statusCode >= 400 ? err.statusCode || res.statusCode : 500;
  let message = err.message || 'Server error';

  // Duplicate key (e.g. employeeId/email already taken)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('; ');
  }

  // Bad ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }

  if (status < 400) status = 500;

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
