// imports
const multer = require('multer');
const shortId = require('shortid');
const fs = require('fs');

const allowedMimetypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];

// set up multer config for file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // create a hash of the filename
    file.hash = crypto.createHash('md5').update(file.originalname).digest('hex');
    // generate directories
    if (
      !fs.existsSync(
        'data/' + req.user.uid + '/' + file.hash.substring(0, 3) + '/' + file.hash.substring(3, 6)
      )
    ) {
      // if new directories are needed generate them
      fs.mkdirSync('data/' + req.user.uid + '/' + file.hash.substring(0, 3));
      fs.mkdirSync(
        'data/' + req.user.uid + '/' + file.hash.substring(0, 3) + '/' + file.hash.substring(3, 6)
      );
    }
    // second param is storage location
    cb(
      null,
      'data/' + req.user.uid + '/' + file.hash.substring(0, 3) + '/' + file.hash.substring(3, 6)
    );
  },
  filename: (req, file, cb) => {
    // second param is file name
    cb(
      null,
      file.hash + '-' + shortId.generate() + '-' + file.originalname.trim().replace(/\s/g, '')
    );
  },
});

// set up allowed mimetype config
const fileFilter = (req, file, cb) => {
  if (allowedMimetypes.includes(file.mimetype)) {
    file.nodeType = 'image';
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const limits = {
  files: 1, // allow only 1 file per request
  // fileSize: '1024 * 1024' // 1 MB (max file size)
};

module.exports = multer({ storage: fileStorage, limits: limits, fileFilter: fileFilter }).single(
  'image'
);
