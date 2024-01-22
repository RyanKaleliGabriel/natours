const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
// Middleware runs in sequence
// so this next line of code will protect all routes after it
router.use(authController.protect);
// POST /tour/1283das/reviews
// POST /tour/reviews
// GET /tour/1283das/reviews
// all of those routes above will end up in that other handler

router.route('/')
  .get(reviewController.getAllReviews)

  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router.route('/:id')
  .get(reviewController.getReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

module.exports = router;
