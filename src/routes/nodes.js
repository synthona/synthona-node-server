// import dependencies
const express = require('express');
const { query, body } = require('express-validator/check');
// import controller
const nodeController = require('../controllers/nodes');
// import route middleware
const isAuth = require('../middleware/is-auth');

// set up router
const router = express.Router();

// create a new node
router.post(
  '/',
  isAuth,
  [
    body('local').exists().isBoolean(),
    body('type').exists().isString(),
    body('name').exists().isString(),
    body('summary').exists().isString(),
    body('content').exists().isString(),
  ],
  nodeController.createNode
);

// update a node by id
router.patch(
  '/',
  isAuth,
  [
    body('id').exists().isNumeric(),
    body('name').optional().isString(),
    body('hidden').optional().isBoolean(),
    body('summary').optional().isString(),
    body('content').optional().isString(),
  ],
  nodeController.updateNode
);

// fetch a node by id
router.get('/', isAuth, [query('id').exists().isNumeric()], nodeController.getNodeById);

// mark a node as viewed
router.patch('/viewed', isAuth, [body('id').exists().isNumeric()], nodeController.markNodeView);

// return search as a page
// empty search returns all
router.get(
  '/search',
  isAuth,
  [
    query('page').optional().isNumeric(),
    query('type').optional().isString(),
    query('searchQuery').optional().isString(),
  ],
  nodeController.searchNodes
);

// Delete node by id
router.delete('/', isAuth, [query('id').exists().isNumeric()], nodeController.deleteNodeById);

// return the router
module.exports = router;
