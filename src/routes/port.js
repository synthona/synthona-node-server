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
router.post('/export/all', isAuth, portController.exportAllUserData);

router.post(
  '/export',
  isAuth,
  [body('uuid').exists().isUUID()],
  portController.exportFromAnchorUUID
);

// import a synthona package
router.post(
  '/import',
  isAuth,
  [body('uuid').exists().isUUID()],
  portController.unpackSynthonaImport
);

// request a single export by the associated uuid
// router.get('/exports/', [query('uuid').exists().isUUID()], isAuth, portController.getExportByUUID);

// return the router
module.exports = router;
