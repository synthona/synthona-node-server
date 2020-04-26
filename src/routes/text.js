// import dependencies
const express = require('express');
const { body, query } = require('express-validator/check');
// import controller
const textController = require('../controllers/text');
// import route middleware
const isAuth = require('../middleware/is-auth');
// set up router
const router = express.Router();

// Create text node
// TODO: add custom check to make sure it is a quilljs delta
router.post(
  '/',
  isAuth,
  [
    body('content')
      .exists()
      .isJSON(),
    body('name')
      .optional()
      .isString()
  ],
  textController.createText
);

// Get text node
router.get(
  '/',
  isAuth,
  [
    query('id')
      .exists()
      .isNumeric()
  ],
  textController.getText
);

// Delete text node
router.delete(
  '/',
  isAuth,
  [
    query('id')
      .exists()
      .isNumeric()
  ],
  textController.deleteText
);

// update text node
router.patch(
  '/',
  isAuth,
  [
    body('id')
      .exists()
      .isNumeric(),
    body('content')
      .optional()
      .isJSON()
  ],
  textController.setText
);

// Process text node
router.patch(
  '/process',
  isAuth,
  [
    body('id')
      .exists()
      .isNumeric(),
    body('summary')
      .exists()
      .isString()
  ],
  textController.processText
);

// return the router
module.exports = router;
