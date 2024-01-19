const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute')

const app = express();

// 1) GLOBAL MIDDLEWARES

// Setting security https headers
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same Api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP please try again in an hour!'
});

// Applies the limiter to all routes only in the application
app.use('/api', limiter);

// Body PArser, reading the data from body into req.body
// if we have abody larger than 10 kilobytes it will not be accepted
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against NO-SQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (Cross site scripting)
app.use(xss());

// Prevent Parameter Pollution

// In this case, only the parameters listed in the whitelist array are allowed to be duplicated.
// Any other parameters will be removed from the request or handled according to the middleware's
//  logic.
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsAverage',
    'ratingsQuantity',
    'maxGroupSize',
    'difficulty',
    'price']
}));

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
