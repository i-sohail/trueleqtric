const router = require('express').Router();
const c = require('../controllers/paymentScheduleController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.route('/').get(c.getAll).post(c.create);
router.route('/:id').get(c.getOne).put(c.update).delete(c.remove);
router.put('/:id/milestones/:milestoneId', c.updateMilestone);
module.exports = router;
