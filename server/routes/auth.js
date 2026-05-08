// server/routes/auth.js — delegates to accessController
const router = require('express').Router();
const c = require('../controllers/accessController');
const { protect, adminOnly } = require('../middleware/auth');
router.post('/register', c.register);
router.post('/login',    c.login);
router.get('/me',        protect, c.getMe);
router.put('/me',        protect, c.updateMe);
router.put('/change-password', protect, c.changePassword);
router.get('/users',     protect, adminOnly, c.getUsers);
module.exports = router;
