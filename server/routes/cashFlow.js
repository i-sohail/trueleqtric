const router = require('express').Router();
const c = require('../controllers/cashFlowController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.getProjection);
module.exports = router;
