// custom code
const { validationResult } = require('express-validator/check');
const context = require('../util/context');
// bring in data models.
const { node } = require('../db/models');

// create new text content node
exports.createText = async (req, res, next) => {
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
    // process request
    const content = req.body.content;
    const name = req.body.name || 'untitled';
    const summary = '';
    // create text node
    const textNode = await node.create({
      local: true,
      type: 'text',
      name: name,
      summary: summary,
      content: content,
      creator: userId
    });
    // send response
    res.status(200).json({ id: textNode.id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// load a single text node
exports.getText = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // process request
    const id = req.query.id;
    // load text node
    const textNode = await node.findOne({
      where: {
        id: id
      },
      attributes: ['id', 'name', 'type', 'summary', 'content', 'updatedAt']
    });
    if (!textNode) {
      const error = new Error('Could not find text node');
      error.statusCode = 404;
      throw error;
    }
    context.markNodeView(textNode.id);
    // send response
    res.status(200).json({ textNode: textNode });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// delete a single text node
exports.deleteText = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // process request
    const id = req.query.id;
    // load text node
    const textNode = await node.findOne({
      where: {
        id: id
      }
    });
    if (!textNode) {
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    // delete associations
    context.deleteAssociations(textNode.id);
    // delete node and send response
    textNode.destroy();
    res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// update a text node
exports.setText = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // process request
    const id = req.body.id;
    // load text node
    const textNode = await node.findOne({
      where: {
        id: id
      }
    });
    if (!textNode) {
      const error = new Error('Could not find text node');
      error.statusCode = 404;
      throw error;
    }
    // update any values that have been changed
    textNode.content = req.body.content ? req.body.content : textNode.content;
    const result = await textNode.save();
    // return result
    res.status(200).json({ node: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.processText = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // process request
    const id = req.body.id;
    const summary = req.body.summary;
    // load text node
    const textNode = await node.findOne({
      where: {
        id: id
      }
    });
    if (!textNode) {
      const error = new Error('Could not find text node');
      error.statusCode = 404;
      throw error;
    }
    textNode.summary = summary ? summary : textNode.summary;
    const result = await textNode.save();
    // send response
    res.status(200).json({ node: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
