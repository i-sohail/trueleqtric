const router = require('express').Router();
const c = require('../controllers/creditMonitorController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.getCreditExposure);
module.exports = router;
