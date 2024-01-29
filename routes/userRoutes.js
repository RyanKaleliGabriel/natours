const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword);

// Middleware runs in sequence
// so this next line of code will protect all routes after it
router.use(authController.protect)

// Th id of the user that is going to be updated comes from request.user
// Which was set by the protect middleware
// Which in turngot the id from the jwt
// No one can change the id from the jwt without knowing the secret
// In the get method the getUser handler is called to put that user id into the params.id (faking that the id is coming from the url )
router.get('/me', userController.getMe, userController.getUser)
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
