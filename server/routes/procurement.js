const router = require('express').Router();
const c = require('../controllers/procurementController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getOne).put(c.update).delete(c.remove);
router.post('/:id/create-ap', c.createAP);
module.exports = router;
