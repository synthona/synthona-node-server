// import packages
const { validationResult } = require('express-validator/check');
const context = require('../util/context');
// bring in data models.
const { user, node } = require('../db/models');

// load a single user by Username
exports.getUserByUsername = async (req, res, next) => {
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
    const username = req.query.username;
    // load user
    const userNode = await user.findOne({
      where: { username },
      attributes: ['username', 'displayName', 'bio', 'avatar', 'header'],
    });
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // add server info to image urls
    userNode.avatar = userNode.avatar
      ? req.protocol + '://' + req.get('host') + '/' + userNode.avatar
      : null;
    userNode.header = userNode.header
      ? req.protocol + '://' + req.get('host') + '/' + userNode.header
      : null;
    // send response
    res.status(200).json({ user: userNode });
    // res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// load a single user by email
exports.getUserByEmail = async (req, res, next) => {
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
    const email = req.query.email;
    // load user
    const userNode = await user.findOne({
      where: { email },
      attributes: ['username', 'email', 'displayName', 'bio', 'avatar', 'header'],
    });
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // add server info to image urls
    userNode.avatar = userNode.avatar
      ? req.protocol + '://' + req.get('host') + '/' + userNode.avatar
      : null;
    userNode.header = userNode.header
      ? req.protocol + '://' + req.get('host') + '/' + userNode.header
      : null;
    // send response
    res.status(200).json({ user: userNode });
    // res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// update basic user information
exports.setUserInfo = async (req, res, next) => {
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
    const username = req.body.username;
    // load user
    const userNode = await user.findOne({
      where: { username },
    });
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // update any values that have been changed
    userNode.displayName = req.body.displayName ? req.body.displayName : userNode.displayName;
    userNode.bio = req.body.bio ? req.body.bio : userNode.bio;
    const result = await userNode.save();
    // add server info to image urls
    userNode.avatar = userNode.avatar
      ? req.protocol + '://' + req.get('host') + '/' + userNode.avatar
      : null;
    userNode.header = userNode.header
      ? req.protocol + '://' + req.get('host') + '/' + userNode.header
      : null;
    // return result
    res.status(200).json({ user: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// update username
exports.setUsername = async (req, res, next) => {
  // NOTE: this info is generated server side in is-auth.js
  // so doesn't need to be validated here
  const uid = req.user.uid;
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // load user
    const userNode = await user.findByPk(uid);
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // process request
    const username = req.body.username;
    // update any values that have been changed
    userNode.username = username ? username : userNode.username;
    const result = await userNode.save();
    // add server info to image urls
    userNode.avatar = userNode.avatar
      ? req.protocol + '://' + req.get('host') + '/' + userNode.avatar
      : null;
    userNode.header = userNode.header
      ? req.protocol + '://' + req.get('host') + '/' + userNode.header
      : null;
    // return result
    res.status(200).json({ user: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// update email
exports.setEmail = async (req, res, next) => {
  // NOTE: this info is generated server side in is-auth.js
  // so doesn't need to be validated here
  const uid = req.user.uid;
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // load user
    const userNode = await user.findByPk(uid);
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // process request
    const email = req.body.email;
    // update any values that have been changed
    userNode.email = email ? email : userNode.email;
    const result = await userNode.save();
    // add server info to image urls
    userNode.avatar = userNode.avatar
      ? req.protocol + '://' + req.get('host') + '/' + userNode.avatar
      : null;
    userNode.header = userNode.header
      ? req.protocol + '://' + req.get('host') + '/' + userNode.header
      : null;
    // return result
    res.status(200).json({ user: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// update user avatar
exports.setAvatar = async (req, res, next) => {
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
    const originalName = req.file.originalname;
    // create node in the context system
    const imageNode = await node.create({
      isFile: true,
      type: 'image',
      name: originalName,
      summary: imageUrl,
      content: originalName,
      creator: userId,
    });
    // load user
    const userNode = await user.findByPk(userId);
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // i think it's bad practice to have to calculate the avatar URL on the fly like this?
    // im not sure how best to do this for the long term tbh.
    userNode.avatar = imageNode.content;
    const result = await userNode.save();
    // send response
    res.status(200).json({ url: req.protocol + '://' + req.get('host') + '/' + result.avatar });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// update user header
exports.setHeader = async (req, res, next) => {
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
    const originalName = req.file.originalname;
    // create node in the context system
    const imageNode = await node.create({
      isFile: true,
      type: 'image',
      name: originalName,
      summary: imageUrl,
      content: originalName,
      creator: userId,
    });
    // load user
    const userNode = await user.findByPk(userId);
    // check for errors
    if (!userNode) {
      const error = new Error('Could not find user');
      error.statusCode = 404;
      throw error;
    }
    // i think it's bad practice to have to calculate the avatar URL on the fly like this?
    // im not sure how best to do this for the long term tbh.
    userNode.header = imageNode.content;
    const result = await userNode.save();
    // send response
    res.status(200).json({ url: req.protocol + '://' + req.get('host') + '/' + result.header });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
