// server/middleware/errorHandler.js
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma duplicate key
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target.join(', ') : (target || 'field');
    message = `Duplicate value for ${field}`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  // Prisma validation error
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided to database';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large. Maximum size is 10MB.';
  }

  if (process.env.NODE_ENV === 'development') {
    logger.error(`${statusCode} — ${message}`, { stack: err.stack, url: req.originalUrl });
  }

  res.status(statusCode).json({
    error: String(message),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
