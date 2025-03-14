
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check token
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    const users = await query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Not authorized, user is not found' });
    }

    // Add user to request
    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'your accound is not authorized, token failed' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role (${req.user.role}) is not authorized to access this resource` });
    }
    next();
  };
};
