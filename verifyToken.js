const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token;

  // Check the Authorization header
  if (req && req.headers && req.headers.authorization) {
    token = req.headers.authorization;
  } else {
    console.error('Failed token:', token);
    return res.status(401).json({ message: 'Invalid token' });
  }

  jwt.verify(token.split(' ')[1], 'lecturevecture', (err, decoded) => {
    if (err) {
      console.error('Failed token:', token.split(' ')[1]);
      return res.status(403).json({ message: `Invalid token ${token.split(' ')[1]}` });
    }
    req.user = decoded;
    req.email = decoded.user.email;
    next();
  });
};

module.exports = verifyToken;
