const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser')
const compression = require('compression')
const cors = require('cors')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoute')
const bookingRouter = require('./routes/bookingRoutes')
const bookingController = require('./controllers/bookingController')
const viewRouter = require('./routes/viewRoutes')

const app = express();

// for secure cookie options
app.enable('trust proxy')

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// 1) GLOBAL MIDDLEWARES

// Implement Cors
// Access-Control-Allow-Origin Header is set
app.use(cors());

// (backend, api.natours.com) (frontend natours.com)
// if we had the frontend and backend in a different subdomains or domain this is what we should do
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

// Cors for non-simple requests(put, patch, delete or request that send cookies or use non standard headers),
// The browser does an option request to see if the request is safe,
// When we get the options request we send back to the browser cors() to tell it the nonsimple request
// is safe to perform
app.options('*', cors())
// app.options('/api/v1/tours:/id', cors())

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Setting security https headers
app.use(helmet({ contentSecurityPolicy: false }));

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

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookcheckout)

// Body PArser, reading the data from body into req.body
// if we have abody larger than 10 kilobytes it will not be accepted
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

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

// Compress all texts sent to clients
app.use(compression())

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
