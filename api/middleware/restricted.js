const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'shh';

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json('token required');
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json('token invalid');
    }
    req.decodedJwt = decoded;
    next();
  });
};
