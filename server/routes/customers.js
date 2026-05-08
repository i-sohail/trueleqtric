const router = require('express').Router();
const c = require('../controllers/customersController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getOne).put(c.update).delete(c.remove);
router.get('/:id/summary', c.getSummary);
module.exports = router;
