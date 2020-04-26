// imports
const multer = require('multer');
const shortId = require('shortid');
const fs = require('fs');

// set up multer config for file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // create image director for user files if there is none
    if (!fs.existsSync(`uploads/images/${req.user.uid}`)) {
      fs.mkdirSync(`uploads/images/${req.user.uid}`);
    }
    // second param is storage location
    cb(null, `uploads/images/${req.user.uid}`);
  },
  filename: (req, file, cb) => {
    // second param is file name
    cb(null, new Date().getTime() + '-' + shortId.generate() + '-' + file.originalname);
  }
});

// set up allowed mimetype config
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/gif'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const limits = {
  files: 1 // allow only 1 file per request
  // fileSize: '1024 * 1024' // 1 MB (max file size)
};

module.exports = multer({ storage: fileStorage, limits: limits, fileFilter: fileFilter }).single(
  'image'
);
