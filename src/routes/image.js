// import dependencies
const express = require('express');
const { query, body } = require('express-validator/check');
// import controller
const imageController = require('../controllers/image');
// import route middleware
const isAuth = require('../middleware/is-auth');
const imageUpload = require('../middleware/image-uploads');

// set up router
const router = express.Router();

// upload an image
router.post(
  '/',
  isAuth,
  [body('name').optional().isString()],
  imageUpload,
  imageController.createImage
);

// fetch an image
// router.get(
//   '/',
//   isAuth,
//   [
//     query('id')
//       .exists()
//       .isNumeric()
//   ],
//   imageController.getImageById
// );

// return the router
module.exports = router;
