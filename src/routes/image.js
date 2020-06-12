// // import dependencies
// const express = require('express');
// const { query, body } = require('express-validator/check');
// // import controller
// const imageController = require('../controllers/image');
// // import route middleware
// const isAuth = require('../middleware/is-auth');
// const imageUpload = require('../middleware/image-upload');

// // set up router
// const router = express.Router();

// // upload an image
// router.post(
//   '/',
//   isAuth,
//   [body('name').optional().isString(), body('linkedNode').optional().isJSON()],
//   imageUpload,
//   imageController.createImage
// );

// // return the router
// module.exports = router;
