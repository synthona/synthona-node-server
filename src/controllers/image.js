// custom code
const { validationResult } = require('express-validator/check');
const context = require('../util/context');
// bring in data models.
const { node } = require('../db/models');

exports.createImage = async (req, res, next) => {
  try {
    // catch null errors
    if (!req.file) {
      const error = new Error('There was a problem uploading the file');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // this comes from the is-auth middleware
    const userId = req.user.uid;
    // process request
    const imageUrl = req.file.path;
    const originalName = req.body.name || req.file.originalname;
    // create node in the context system
    const result = await node.create({
      local: true,
      hidden: false,
      searchable: true,
      type: 'image',
      name: originalName,
      summary: imageUrl,
      content: originalName,
      creator: userId,
    });
    // add the baseURL of the server instance back in
    if (result.local) {
      result.summary = result.summary
        ? req.protocol + '://' + req.get('host') + '/' + result.summary
        : null;
    }
    // send response
    res.status(200).json({ node: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getImageById = async (req, res, next) => {
//   try {
//     // catch validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       const error = new Error('Validation Failed');
//       error.statusCode = 422;
//       error.data = errors.array();
//       throw error;
//     }
//     // process request
//     const uuid = req.query.uuid;
//     // load text node
//     const result = await node.findOne({
//       where: {
//         uuid: uuid,
//         type: 'image',
//       },
//       attributes: ['uuid', 'local', 'name', 'type', 'summary', 'content', 'updatedAt'],
//     });
//     if (!result) {
//       const error = new Error('Could not find image node');
//       error.statusCode = 404;
//       throw error;
//     }
//     context.markNodeView(result.uuid);
//     // add base url if image is stored on server
//     if (result.local) {
//       result.summary = result.summary
//         ? req.protocol + '://' + req.get('host') + '/' + result.summary
//         : null;
//     }
//     // send response
//     res.status(200).json({ node: result });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };
