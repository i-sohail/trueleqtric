// server/routes/access.js
const router = require('express').Router();
const c = require('../controllers/accessController');
const { protect, adminOnly } = require('../middleware/auth');

// ── Public auth ───────────────────────────────────────
router.post('/login',  c.login);
router.post('/register', c.register);

// ── Authenticated user (self) ─────────────────────────
router.get('/me',              protect, c.getMe);
router.put('/me',              protect, c.updateMe);
router.put('/change-password', protect, c.changePassword);

// ── User management (admin only) ─────────────────────
router.get('/users',                    protect, adminOnly, c.getUsers);
router.post('/users',                   protect, adminOnly, c.createUser);
router.get('/users/:id',                protect, adminOnly, c.getUser);
router.put('/users/:id',                protect, adminOnly, c.updateUser);
router.delete('/users/:id',             protect, adminOnly, c.deleteUser);
router.post('/users/:id/reset-password',protect, adminOnly, c.resetUserPassword);
router.patch('/users/:id/toggle-status',protect, adminOnly, c.toggleUserStatus);

// ── Role management (admin only) ─────────────────────
router.get('/roles',          protect, adminOnly, c.getRoles);
router.post('/roles',         protect, adminOnly, c.createRole);
router.get('/roles/:id',      protect, adminOnly, c.getRole);
router.put('/roles/:id',      protect, adminOnly, c.updateRole);
router.delete('/roles/:id',   protect, adminOnly, c.deleteRole);

module.exports = router;
