// import dependencies
const express = require('express');
const { body } = require('express-validator/check');
// import data models
const { user } = require('../db/models');
const authController = require('../controllers/auth');
// import auth middleware
const isAuth = require('../middleware/is-auth');

// set up router
const router = express.Router();

router.post(
  '/signup',
  [
    body('email')
      .exists()
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
      .custom((value, { req }) => {
        return user
          .findOne({
            where: { email: value }
          })
          .then(user => {
            if (user) {
              return Promise.reject('Email address already exists!');
            }
          });
      }),
    body('password')
      .exists()
      .isString()
      .trim()
      .isLength({ min: 5 }),
    body('username')
      .exists()
      .isString()
      .trim()
      .custom((value, { req }) => {
        return user
          .findOne({
            where: { username: value }
          })
          .then(user => {
            if (user) {
              return Promise.reject('User already exists!');
            }
          });
      })
  ],
  authController.signup
);

router.post(
  '/login',
  [
    body('email')
      .exists()
      .isEmail()
      .normalizeEmail(),
    body('password')
      .trim()
      .isString()
      .isLength({ min: 5 })
  ],
  authController.login
);

router.patch(
  '/password',
  isAuth,
  [
    body('oldPassword')
      .exists()
      .trim()
      .isString(),
    body('newPassword')
      .exists()
      .trim()
      .isString()
      .isLength({ min: 5 })
  ],
  authController.changePassword
);

router.get('/refresh', isAuth, authController.refreshAuth);

router.get('/signout', isAuth, authController.signOut);

// return the router
module.exports = router;
