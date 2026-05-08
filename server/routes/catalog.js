const router = require('express').Router();
const c = require('../controllers/catalogController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getOne).put(c.update).delete(c.remove);
router.put('/:id/price', c.updatePrice);
router.get('/:id/price-history', c.getPriceHistory);
module.exports = router;
