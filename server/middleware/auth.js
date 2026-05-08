// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Not authorized. No token.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('roleRef');
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired. Please log in again.' });
    return res.status(401).json({ error: 'Not authorized. Invalid token.' });
  }
};

// Check legacy string role
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Role '${req.user.role}' is not authorized.` });
  }
  next();
};

// Check module-level permission via custom Role
exports.requirePermission = (module, action = 'read') => (req, res, next) => {
  // Admins always pass
  if (req.user.role === 'admin') return next();

  // Check custom role permissions
  if (req.user.roleRef && req.user.roleRef.permissions) {
    const perm = req.user.roleRef.permissions.find(p => p.module === module);
    if (perm && perm[action]) return next();
    return res.status(403).json({ error: `You don't have ${action} permission on '${module}'.` });
  }

  // Fall back to legacy role string logic
  const legacyMap = {
    admin:      { read: true,  write: true,  delete: true  },
    sales:      { read: true,  write: true,  delete: false },
    finance:    { read: true,  write: true,  delete: false },
    operations: { read: true,  write: true,  delete: false },
    viewer:     { read: true,  write: false, delete: false },
  };
  const perms = legacyMap[req.user.role] || { read: false, write: false, delete: false };
  if (perms[action]) return next();
  return res.status(403).json({ error: `Role '${req.user.role}' cannot '${action}' on '${module}'.` });
};

exports.adminOnly   = exports.authorize('admin');
exports.financeOnly = exports.authorize('admin', 'finance');
exports.salesOrAbove = exports.authorize('admin', 'sales', 'finance', 'operations');
