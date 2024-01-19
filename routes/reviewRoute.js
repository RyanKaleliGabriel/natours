const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController')

const router = express.Router({ mergeParams: true });
// POST /tour/1283das/reviews
// POST /tour/reviews
// GET /tour/1283das/reviews
// all of those routes above will end up in that other handler

router.route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router.route('/:id')
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview)

module.exports = router
