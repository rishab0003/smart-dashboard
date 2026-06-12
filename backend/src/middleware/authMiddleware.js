const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  // Expected format: "Bearer eyJhbGciOiJIUzI1NiJ9..."
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    // Verify token signature and decode payload
    // jwt.verify throws error if token is invalid/expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user (exclude password field with -password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // User is authenticated — proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = { protect, adminOnly };