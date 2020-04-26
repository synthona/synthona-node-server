// import environment variables
require('dotenv').config();
// import packages
const { validationResult } = require('express-validator/check');
const context = require('../util/context');
// var cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
// custom code
const tokens = require('../util/tokens');
// bring in data models.
const { user } = require('../db/models');

exports.signup = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // store incoming info in variables.
    const email = req.body.email.trim();
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    // set header, bio, and avatar defaults
    const avatar = 'public/resources/default-avatar.png';
    const header = 'public/resources/default-header.jpg';
    const bio = 'new user';

    // process request.
    const hash = await bcrypt.hash(password, 12);
    // create account
    const account = await user.create({
      email: email,
      password: hash,
      avatar: avatar,
      bio: bio,
      header: header,
      displayName: username,
      username: username,
    });
    // generate token
    const token = tokens.generateToken(account);
    // set the jwt cookie
    if (!process.env.PRODUCTION) {
      res.cookie('jwt', token, { httpOnly: true, secure: true, sameSite: true });
    } else {
      res.cookie('jwt', token);
    }
    // create node in the context system
    await context.createNode(account, 'user');
    // send the response
    res.status(201).json({
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      avatar: req.protocol + '://' + req.get('host') + '/' + account.avatar,
      bio: account.bio,
      header: req.protocol + '://' + req.get('host') + '/' + account.header,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
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
    const email = req.body.email;
    const password = req.body.password;
    // retrieve account
    const account = await user.findOne({
      where: { email: email },
    });
    // catch error if no account is found
    if (!account) {
      const error = new Error('A user with this email could not be found');
      error.statusCode = 401;
      throw error;
    }
    // verify password
    const isEqual = await bcrypt.compare(password, account.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect');
      error.statusCode = 401;
      throw error;
    }
    // generate token
    const token = tokens.generateToken(account);
    // set the jwt cookie
    if (!process.env.PRODUCTION) {
      res.cookie('jwt', token, { httpOnly: true, secure: true, sameSite: true });
    } else {
      res.cookie('jwt', token);
    }
    // send response
    res.status(201).json({
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      avatar: req.protocol + '://' + req.get('host') + '/' + account.avatar,
      bio: account.bio,
      header: req.protocol + '://' + req.get('host') + '/' + account.header,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // NOTE: this info is generated server side in is-auth.js
    // so doesn't need to be validated here
    const uid = req.user.uid;
    const account = await user.findOne({
      where: { id: uid },
    });
    // catch error if no account is found
    if (!account) {
      const error = new Error('A user with this uid could not be found');
      error.statusCode = 401;
      throw error;
    }
    // store incoming info in variables.
    const oldPassword = req.body.oldPassword.trim();
    const newPassword = req.body.newPassword.trim();
    // verify old password
    const isEqual = await bcrypt.compare(oldPassword, account.password);
    if (!isEqual) {
      const error = new Error('Password is incorrect');
      error.statusCode = 401;
      throw error;
    }
    // update password
    const hash = await bcrypt.hash(newPassword, 12);
    account.password = hash;
    const result = await account.save();
    // generate new token
    const newToken = tokens.generateToken(result);
    // set the jwt cookie
    if (!process.env.PRODUCTION) {
      res.cookie('jwt', newToken, { httpOnly: true, secure: true, sameSite: true });
    } else {
      res.cookie('jwt', newToken);
    }
    // send the response
    res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.refreshAuth = async (req, res, next) => {
  // NOTE: this info is generated server side in is-auth.js
  // so doesn't need to be validated here
  const uid = req.user.uid;
  const token = req.user.token;
  try {
    const account = await user.findOne({
      where: { id: uid },
    });

    if (!account) {
      const error = new Error('A user with this uid could not be found');
      error.statusCode = 401;
      throw error;
    }

    // note: right here is where i would probably send a refresh token??? or
    // i could just send it in isAuth??

    // NOTE!!!! i probably should not actually call the token "jwt" i should name it
    // something else
    // set the jwt cookie
    if (!process.env.PRODUCTION) {
      res.cookie('jwt', token, { httpOnly: true, secure: true, sameSite: true });
    } else {
      res.cookie('jwt', token);
    }
    // send reponse
    res.status(201).json({
      // uid: account.id,
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      avatar: req.protocol + '://' + req.get('host') + '/' + account.avatar,
      bio: account.bio,
      header: req.protocol + '://' + req.get('host') + '/' + account.header,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.signOut = (req, res, next) => {
  res.clearCookie('jwt');
  res.sendStatus(200);
};
