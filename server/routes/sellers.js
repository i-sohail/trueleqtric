const router = require('express').Router();
const c = require('../controllers/sellersController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.getAll);
router.post('/add-as-vendor', c.addAsVendor);
module.exports = router;
