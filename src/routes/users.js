// import dependencies
const express = require('express');
const { body, query } = require('express-validator/check');
// import controller
const userController = require('../controllers/users');
// import route middleware
const isAuth = require('../middleware/is-auth');
const imageUpload = require('../middleware/image-uploads');
// import data models
const { user } = require('../db/models');
// set up router
const router = express.Router();

// Get basic profile info by username
router.get(
  '/username',
  isAuth,
  [
    query('username')
      .exists()
      .isString()
  ],
  userController.getUserByUsername
);

// Get basic profile info by email
router.get(
  '/email',
  isAuth,
  [
    query('email')
      .exists()
      .isString()
      .custom((value, { req }) => {
        const tokenUid = parseInt(req.user.uid);
        return user
          .findOne({
            where: { email: value }
          })
          .then(user => {
            // only let users fetch their own profile by email
            if (user.id !== tokenUid) {
              return Promise.reject('You are not authorized to make this request!');
            }
          });
      })
  ],
  userController.getUserByEmail
);

// update user by username
router.patch(
  '/info',
  isAuth,
  [
    body('username')
      .exists()
      .isString()
      .custom((value, { req }) => {
        const tokenUid = parseInt(req.user.uid);
        return user
          .findOne({
            where: { username: value }
          })
          .then(user => {
            // only let users edit their own profile
            if (user.id !== tokenUid) {
              return Promise.reject('You are not authorized to update this user!');
            }
          });
      }),
    body('displayName')
      .optional()
      .isString(),
    body('bio')
      .optional()
      .isString()
  ],
  userController.setUserInfo
);

// need to update this so you can only update your own
router.patch('/avatar', isAuth, imageUpload, userController.setAvatar);

// need to update this so you can only update your own
router.patch('/header', isAuth, imageUpload, userController.setHeader);

// update the username
router.patch(
  '/username',
  isAuth,
  [
    body('username')
      .exists()
      .isString()
      .custom((value, { req }) => {
        return user
          .findOne({
            where: { username: value }
          })
          .then(user => {
            // only let users change their name to an available username
            if (user) {
              return Promise.reject('That username is already in use!');
            }
          });
      })
  ],
  userController.setUsername
);

// update the email
router.patch(
  '/email',
  isAuth,
  [
    body('email')
      .exists()
      .isString()
      .isEmail()
      .custom((value, { req }) => {
        return user
          .findOne({
            where: { email: value }
          })
          .then(user => {
            // only let users change their email to an available email
            if (user) {
              return Promise.reject('That email address is already in use!');
            }
          });
      })
  ],
  userController.setEmail
);

// return the router
module.exports = router;
