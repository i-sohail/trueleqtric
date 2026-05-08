// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const user = await User.create({ name, email, password, role });
  const token = signToken(user._id);
  res.status(201).json({ token, user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  res.json({ token, user });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ user });
});

// PUT /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, avatar, preferences } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, avatar, preferences },
    { new: true, runValidators: true }
  );
  res.json({ user });
});

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  user.password = newPassword;
  await user.save();
  const token = signToken(user._id);
  res.json({ token, message: 'Password updated successfully' });
});

// GET /api/auth/users  (admin only)
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
});
