const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateDB = err => {
  const message = `Duplicate field value: ${err.keyValue.name}. PLease use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDb = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please Login again', 401);

const handleJWTExpiredError = () => new AppError("You're token has expired! Please login again.", 401);

const sendErrorDev = (req, err, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // B) RENDERED WEBSITE
  console.error('Error 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (req, err, res) => {
  // A) API
  // A) Operational, trusted error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming error or other unknown error: don't leak error details
    // 1)Log error
    console.error('Error 💥', err);

    // 2)SEND A GENERIC MESSAGE
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }

  // B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // Programming error or other unknown error: don't leak error details
  // 1)Log error
  console.error('Error 💥', err);

  // 2)SEND A GENERIC MESSAGE
  return res.status(err.statusCode).render('error', {
    title: 'Something went very wrong',
    msg: 'Please try again later'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, err, res);
  } else if (process.env.NODE_ENV === 'production ') {
    let error = JSON.stringify(err);
    error = JSON.parse(error);
    error.message = err.message

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(req, error, res);
  }
};

/// In the package.json the script is this
// "start:prod": "set NODE_ENV=production && nodemon server.js",
// there is space after production
// if there is space you should also leave space in the else if block

// More error handling features
// Defining different error handling levels like error not important, medium important, critical important
// Email admin for critical errors
