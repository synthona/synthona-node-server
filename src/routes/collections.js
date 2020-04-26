// import dependencies
const express = require('express');
const { body, query } = require('express-validator/check');
// import controller
const collectionController = require('../controllers/collections');
// import route middleware
const isAuth = require('../middleware/is-auth');

// set up router
const router = express.Router();

// Create collection
router.post(
  '/',
  isAuth,
  [
    body('name')
      .exists()
      .isString(),
    body('content')
      .optional()
      .isString()
  ],
  collectionController.createCollection
);

// Get collection list by id
router.get(
  '/',
  isAuth,
  [
    body('nodeId')
      .exists()
      .isNumeric()
  ],
  collectionController.getCollection
);
// );

// router.post(
//   '/add',
//   isAuth,
//   [
//     body('nodeId')
//       .exists()
//       .isNumeric(),
//     body('collectionId')
//       .exists()
//       .isNumeric()
//   ],
//   collectionController.addToCollection
// );

// // Get associated collections
// router.get(
//   '/',
//   [
//     body('nodeId')
//       .exists()
//       .isNumeric()
//   ],
//   isAuth,
//   collectionController.getAssociatedCollections
// );

// // Get text node
// router.get(
//   '/',
//   [
//     query('contextId')
//       .exists()
//       .isUUID()
//   ],
//   isAuth,
//   textController.getText
// );

// // Delete text node
// router.delete(
//   '/',
//   [
//     query('contextId')
//       .exists()
//       .isUUID()
//   ],
//   isAuth,
//   textController.deleteText
// );

// // update text node
// router.patch(
//   '/',
//   isAuth,
//   [
//     body('contextId')
//       .exists()
//       .isUUID(),
//     body('content')
//       .optional()
//       .isJSON()
//   ],
//   textController.setText
// );

// // Process text node
// router.patch(
//   '/process',
//   isAuth,
//   [
//     body('contextId')
//       .exists()
//       .isUUID(),
//     body('summary')
//       .exists()
//       .isString()
//   ],
//   textController.processText
// );

// return the router
module.exports = router;
