const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

// will not follow the rest principal
router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession)

module.exports = router;
