const User = require('../models/User');

// Helper function to create JWT token
const createToken = (id) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Helper function to format user response
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Name, email, and password are required'
    });
  }

  // Check if email is already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      error: 'Email already registered'
    });
  }

  // Create new user (password is automatically hashed by model pre-save hook)
  const user = await User.create({ name, email, password });

  // Generate token for immediate login after registration
  const token = createToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: formatUser(user),
  });
};

// @route   POST /api/auth/login
// @desc    Login and receive JWT token
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  // Find user — include password field (it's excluded by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    // Don't tell them if email OR password is wrong (security)
    return res.status(401).json({
      error: 'Invalid credentials'
    });
  }

  // Compare entered password with hashed password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      error: 'Invalid credentials'
    });
  }

  const token = createToken(user._id);

  res.json({
    success: true,
    token,
    user: formatUser(user)
  });
};

// @route   GET /api/auth/me
// @desc    Get current logged-in user profile
// @access  Protected (requires valid JWT)
exports.getMe = async (req, res) => {
  // req.user is set by the protect middleware
  res.json({
    success: true,
    user: formatUser(req.user)
  });
};