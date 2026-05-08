// server/controllers/accessController.js
const User = require('../models/User');
const Role = require('../models/Role');
const asyncHandler = require('../middleware/asyncHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ─── AUTH ────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }] })
    .select('+password').populate('roleRef');
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact administrator.' });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  const token = signToken(user._id);
  const userObj = user.toJSON();
  res.json({ token, user: userObj });
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const user = await User.create({ name, email, password, username, role: role || 'viewer' });
  const token = signToken(user._id);
  res.status(201).json({ token, user });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('roleRef');
  res.json({ user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'surname', 'mobile', 'country', 'city', 'region', 'avatar', 'preferences'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).populate('roleRef');
  res.json({ user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword)))
    return res.status(401).json({ error: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ token: signToken(user._id), message: 'Password updated' });
});

// ─── USER MANAGEMENT (admin) ─────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, country, city, region, isActive, role, page = 1, limit = 100 } = req.query;
  const filter = {};
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { surname: { $regex: search, $options: 'i' } },
    { username: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { mobile: { $regex: search, $options: 'i' } },
  ];
  if (country) filter.country = { $regex: country, $options: 'i' };
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (region) filter.region = { $regex: region, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter).populate('roleRef', 'name description').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ data: users, total });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('roleRef');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ data: user });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, surname, username, email, password, mobile, country, city, region, role, roleRef } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
  if (await User.findOne({ username })) return res.status(409).json({ error: 'Username already taken' });
  const user = await User.create({ name, surname, username, email, password, mobile, country, city, region, role: role || 'viewer', roleRef: roleRef || null });
  await user.populate('roleRef');
  res.status(201).json({ data: user, message: `User ${user.username} created successfully` });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, surname, username, email, mobile, country, city, region, role, roleRef, isActive } = req.body;
  // Prevent duplicate username/email on other users
  if (email) {
    const ex = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (ex) return res.status(409).json({ error: 'Email already in use' });
  }
  if (username) {
    const ex = await User.findOne({ username, _id: { $ne: req.params.id } });
    if (ex) return res.status(409).json({ error: 'Username already taken' });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, surname, username, email, mobile, country, city, region, role, roleRef: roleRef || null, isActive },
    { new: true, runValidators: true }
  ).populate('roleRef');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ data: user, message: 'User updated' });
});

exports.resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.password = newPassword;
  await user.save();
  res.json({ message: `Password reset for ${user.username}` });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
    return res.status(403).json({ error: 'Cannot deactivate another admin' });
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete an admin user' });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

// ─── ROLE MANAGEMENT (admin) ─────────────────────────
exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ name: 1 });
  // Attach user count to each role
  const withCounts = await Promise.all(roles.map(async r => {
    const count = await User.countDocuments({ roleRef: r._id });
    return { ...r.toJSON(), userCount: count };
  }));
  res.json({ data: withCounts });
});

exports.getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  const users = await User.find({ roleRef: role._id }).select('name surname username email isActive');
  res.json({ data: role, users });
});

exports.createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  if (await Role.findOne({ name })) return res.status(409).json({ error: 'Role name already exists' });
  // Build full permissions array — fill in any missing modules with defaults
  const MODULES = Role.schema.statics.MODULES || require('../models/Role').MODULES;
  const allModules = [
    'dashboard','analytics','leads','quotations','salespo','procurement',
    'inventory','delivery','ar','ap','customers','vendors','catalog','pricing',
    'bglc','tenders','documents','paymentschedule','prodtracking','commissions',
    'vendorscores','creditmonitor','cashflow','lists','sellers','trash','access',
  ];
  const permMap = {};
  (permissions || []).forEach(p => { permMap[p.module] = p; });
  const fullPerms = allModules.map(m => ({
    module: m,
    read:   permMap[m]?.read   || false,
    write:  permMap[m]?.write  || false,
    delete: permMap[m]?.delete || false,
  }));
  const role = await Role.create({ name, description, permissions: fullPerms, createdBy: req.user._id });
  res.status(201).json({ data: role, message: `Role '${role.name}' created` });
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.isSystem) return res.status(403).json({ error: 'System roles cannot be modified' });
  if (name) role.name = name;
  if (description !== undefined) role.description = description;
  if (permissions) {
    const allModules = [
      'dashboard','analytics','leads','quotations','salespo','procurement',
      'inventory','delivery','ar','ap','customers','vendors','catalog','pricing',
      'bglc','tenders','documents','paymentschedule','prodtracking','commissions',
      'vendorscores','creditmonitor','cashflow','lists','sellers','trash','access',
    ];
    const permMap = {};
    permissions.forEach(p => { permMap[p.module] = p; });
    role.permissions = allModules.map(m => ({
      module: m,
      read:   permMap[m]?.read   ?? (role.permissions.find(p=>p.module===m)?.read || false),
      write:  permMap[m]?.write  ?? (role.permissions.find(p=>p.module===m)?.write || false),
      delete: permMap[m]?.delete ?? (role.permissions.find(p=>p.module===m)?.delete || false),
    }));
  }
  await role.save();
  res.json({ data: role, message: `Role '${role.name}' updated` });
});

exports.deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.isSystem) return res.status(403).json({ error: 'System roles cannot be deleted' });
  const count = await User.countDocuments({ roleRef: role._id });
  if (count > 0) return res.status(409).json({ error: `Cannot delete: ${count} user(s) have this role. Reassign them first.` });
  await role.deleteOne();
  res.json({ message: `Role '${role.name}' deleted` });
});
