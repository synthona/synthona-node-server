// import dependencies
const express = require('express');
const { body, query } = require('express-validator/check');
// import controller
const associationController = require('../controllers/associations');
// import route middleware
const isAuth = require('../middleware/is-auth');

// set up router
const router = express.Router();

// Create association
router.post(
  '/',
  isAuth,
  [body('nodeId').exists().isNumeric(), body('linkedNode').exists().isNumeric()],
  associationController.createAssociation
);

// Get associations
router.get(
  '/',
  isAuth,
  [query('nodeId').exists().isNumeric(), query('page').optional().isNumeric()],
  associationController.getAssociations
);

// delete association
router.delete(
  '/',
  isAuth,
  [query('nodeA').exists().isNumeric(), query('nodeB').exists().isNumeric()],
  associationController.deleteAssociation
);

// autocomplete for creating associations
router.get(
  '/autocomplete',
  isAuth,
  [query('nodeId').exists().isNumeric(), query('searchQuery').optional().isString()],
  associationController.associationAutocomplete
);

// update link strength
router.post(
  '/linkstrength',
  isAuth,
  [body('nodeA').exists().isNumeric(), body('nodeB').exists().isNumeric()],
  associationController.updateLinkStrength
);

// return the router
module.exports = router;
