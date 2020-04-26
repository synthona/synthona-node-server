// custom code
const { validationResult } = require('express-validator/check');
// bring in data models.
const { node } = require('../db/models');

// create new url node
exports.createUrl = async (req, res, next) => {
  // this comes from the is-auth middleware
  const userId = req.user.uid;
  const errors = validationResult(req);
  try {
    // catch validation errors
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    // HAVE TO SCRAPE THE URL HERE>>>!!!!!

    // process request
    const content = req.body.content;
    const name = req.body.name || 'untitled';
    const summary = req.body.content;
    // create text node
    const urlNode = await node.create({
      local: true,
      type: 'url',
      name: name,
      summary: summary,
      content: content,
      creator: userId
    });
    // send response
    res.status(200).json({ id: urlNode.id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
