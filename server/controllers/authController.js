// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Helper to generate USR-000x
const generateUserId = async () => {
  const count = await prisma.user.count();
  return `USR-${String(count + 1).padStart(4, '0')}`;
};

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  
  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = await generateUserId();
  
  const user = await prisma.user.create({
    data: { 
      userId,
      name, 
      email, 
      password: hashedPassword, 
      role: role || 'sales',
      username: email.split('@')[0] + Math.floor(Math.random() * 1000) // Temporary username generation
    }
  });
  
  // Remove password from response
  delete user.password;
  
  const token = signToken(user.id);
  res.status(201).json({ token, user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });
  
  // Remove password from response
  delete user.password;
  
  const token = signToken(user.id);
  res.json({ token, user });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.id } 
  });
  if (user) delete user.password;
  res.json({ user });
});

// PUT /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, avatar, preferences } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, avatar, preferences }
  });
  delete user.password;
  res.json({ user });
});

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  
  const token = signToken(user.id);
  res.json({ token, message: 'Password updated successfully' });
});

// GET /api/auth/users  (admin only)
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  users.forEach(u => delete u.password);
  res.json({ users });
});
