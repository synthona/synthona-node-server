const jwt = require('jsonwebtoken');

// TODO: might add refresh tokens later.
exports.generateToken = user => {
  const u = {
    email: user.email,
    uid: user.id.toString()
  };
  // look at jwt.io for additional information.
  return (token = jwt.sign(u, process.env.JWT_SECRET, {
    expiresIn: '7h' // expires in 7 hours
  }));
};
