export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error stack only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    error.message = 'Duplicate field value';
    error.statusCode = 400;
  }

  // Handle JWT JsonWebTokenError
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again!';
    error.statusCode = 401;
  }

  // Handle JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    error.message = 'Your token has expired! Please log in again.';
    error.statusCode = 401;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong!';

  res.status(statusCode).json({
    success: false,
    message,
    statusCode
  });
};

export default errorHandler;