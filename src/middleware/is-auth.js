const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');

// note: still not sure if i want to get the auth information from the headers or from an httpOnly cookie

// IMPORTANT: this is not secure enough yet for production but is fine for testing

module.exports = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    const error = new Error('Not Authenticated');
    error.statusCode = 401;
    res.clearCookie('jwt');
    throw error;
  }
  let decodedToken;
  // try to store decoded token
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    err.statusCode = 500;
    res.clearCookie('jwt');
    throw err;
  }
  // if token is undefined
  if (!decodedToken) {
    const error = new Error('Not Authenticated');
    error.statusCode = 401;
    res.clearCookie('jwt');
    throw error;
  }
  // if we have a valid token store it and some basic info from it on req.user.
  req.user = { uid: decodedToken.uid, token: token };
  next();
};
