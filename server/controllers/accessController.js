// server/controllers/accessController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ─── AUTH ────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ]
    },
    include: { roleRef: true }
  });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
    
  if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact administrator.' });
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
    include: { roleRef: true }
  });

  const token = signToken(user.id);
  const userObj = { ...updatedUser };
  delete userObj.password;
  res.json({ token, user: userObj });
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const count = await prisma.user.count();
  const userId = `USR-${String(count + 1).padStart(4, '0')}`;

  const user = await prisma.user.create({
    data: { 
      userId,
      name, 
      email, 
      password: hashedPassword, 
      username, 
      role: role || 'viewer' 
    }
  });
  
  const token = signToken(user.id);
  const userObj = { ...user };
  delete userObj.password;
  res.status(201).json({ token, user: userObj });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { roleRef: true }
  });
  if (user) delete user.password;
  res.json({ user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'surname', 'mobile', 'country', 'city', 'region', 'avatar', 'preferences'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
    include: { roleRef: true }
  });
  delete user.password;
  res.json({ user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (!(await bcrypt.compare(currentPassword, user.password)))
    return res.status(401).json({ error: 'Current password is incorrect' });
    
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });
  
  res.json({ token: signToken(user.id), message: 'Password updated' });
});

// ─── USER MANAGEMENT (admin) ─────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, country, city, region, isActive, role, page = 1, limit = 100 } = req.query;
  const filter = {};
  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { surname: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (country) filter.country = { contains: country, mode: 'insensitive' };
  if (city) filter.city = { contains: city, mode: 'insensitive' };
  if (region) filter.region = { contains: region, mode: 'insensitive' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      include: { roleRef: { select: { name: true, description: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.user.count({ where: filter }),
  ]);
  
  users.forEach(u => delete u.password);
  res.json({ data: users, total });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { roleRef: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  delete user.password;
  res.json({ data: user });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, surname, username, email, password, mobile, country, city, region, role, roleRef } = req.body;
  
  const exEmail = await prisma.user.findUnique({ where: { email } });
  if (exEmail) return res.status(409).json({ error: 'Email already registered' });
  
  const exUser = await prisma.user.findUnique({ where: { username } });
  if (exUser) return res.status(409).json({ error: 'Username already taken' });
  
  const hashedPassword = await bcrypt.hash(password, 12);
  const count = await prisma.user.count();
  const userId = `USR-${String(count + 1).padStart(4, '0')}`;

  const user = await prisma.user.create({
    data: { 
      userId,
      name, surname, username, email, 
      password: hashedPassword, 
      mobile, country, city, region, 
      role: role || 'viewer', 
      roleId: roleRef || null 
    },
    include: { roleRef: true }
  });
  
  const userObj = { ...user };
  delete userObj.password;
  res.status(201).json({ data: userObj, message: `User ${user.username} created successfully` });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, surname, username, email, mobile, country, city, region, role, roleRef, isActive } = req.body;
  
  if (email) {
    const ex = await prisma.user.findFirst({ where: { email, id: { not: req.params.id } } });
    if (ex) return res.status(409).json({ error: 'Email already in use' });
  }
  if (username) {
    const ex = await prisma.user.findFirst({ where: { username, id: { not: req.params.id } } });
    if (ex) return res.status(409).json({ error: 'Username already taken' });
  }
  
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, surname, username, email, mobile, country, city, region, role, roleId: roleRef || null, isActive },
    include: { roleRef: true }
  });
  
  delete user.password;
  res.json({ data: user, message: 'User updated' });
});

exports.resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { password: hashedPassword }
  });
  
  res.json({ message: `Password reset for ${user.username}` });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (user.role === 'admin' && req.user.id !== user.id) {
    return res.status(403).json({ error: 'Cannot deactivate another admin' });
  }
  
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive }
  });
  
  delete updated.password;
  res.json({ data: updated, message: `User ${updated.isActive ? 'activated' : 'deactivated'}` });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete an admin user' });
  
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'User deleted' });
});

// ─── ROLE MANAGEMENT (admin) ─────────────────────────
exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  
  const withCounts = await Promise.all(roles.map(async r => {
    const count = await prisma.user.count({ where: { roleId: r.id } });
    return { ...r, userCount: count };
  }));
  res.json({ data: withCounts });
});

exports.getRole = asyncHandler(async (req, res) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return res.status(404).json({ error: 'Role not found' });
  
  const users = await prisma.user.findMany({ 
    where: { roleId: role.id },
    select: { name: true, surname: true, username: true, email: true, isActive: true }
  });
  res.json({ data: role, users });
});

exports.createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) return res.status(409).json({ error: 'Role name already exists' });
  
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
  
  const role = await prisma.role.create({
    data: { name, description, permissions: fullPerms, createdById: req.user.id }
  });
  res.status(201).json({ data: role, message: `Role '${role.name}' created` });
});

exports.updateRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.isSystem) return res.status(403).json({ error: 'System roles cannot be modified' });
  
  let updatedPerms = role.permissions;
  if (permissions) {
    const allModules = [
      'dashboard','analytics','leads','quotations','salespo','procurement',
      'inventory','delivery','ar','ap','customers','vendors','catalog','pricing',
      'bglc','tenders','documents','paymentschedule','prodtracking','commissions',
      'vendorscores','creditmonitor','cashflow','lists','sellers','trash','access',
    ];
    const permMap = {};
    permissions.forEach(p => { permMap[p.module] = p; });
    updatedPerms = allModules.map(m => ({
      module: m,
      read:   permMap[m]?.read   ?? (role.permissions.find(p=>p.module===m)?.read || false),
      write:  permMap[m]?.write  ?? (role.permissions.find(p=>p.module===m)?.write || false),
      delete: permMap[m]?.delete ?? (role.permissions.find(p=>p.module===m)?.delete || false),
    }));
  }
  
  const updatedRole = await prisma.role.update({
    where: { id: req.params.id },
    data: { name, description, permissions: updatedPerms }
  });
  
  res.json({ data: updatedRole, message: `Role '${updatedRole.name}' updated` });
});

exports.deleteRole = asyncHandler(async (req, res) => {
  const role = await prisma.role.findUnique({ where: { id: req.params.id } });
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.isSystem) return res.status(403).json({ error: 'System roles cannot be deleted' });
  
  const count = await prisma.user.count({ where: { roleId: role.id } });
  if (count > 0) return res.status(409).json({ error: `Cannot delete: ${count} user(s) have this role. Reassign them first.` });
  
  await prisma.role.delete({ where: { id: req.params.id } });
  res.json({ message: `Role '${role.name}' deleted` });
});
