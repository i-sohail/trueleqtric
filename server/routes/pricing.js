const router = require('express').Router();
const c = require('../controllers/catalogController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.getAll);
router.put('/:id/price', c.updatePrice);
router.get('/:id/price-history', c.getPriceHistory);
module.exports = router;
