// import dependencies
const express = require('express');
const { query, body } = require('express-validator/check');
// import controller
const portController = require('../controllers/port');
// import route middleware
const isAuth = require('../middleware/is-auth');

// set up router
const router = express.Router();

// generate a user-data export
router.put('/export/all', isAuth, portController.exportAllUserData);

router.put(
  '/export',
  isAuth,
  [body('uuid').exists().isUUID()],
  portController.exportFromAnchorUUID
);

// import a synthona package
router.put(
  '/import',
  isAuth,
  [body('uuid').exists().isUUID()],
  portController.unpackSynthonaImport
);

// return the router
module.exports = router;
