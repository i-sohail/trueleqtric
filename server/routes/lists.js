const router = require('express').Router();
const c = require('../controllers/listsController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.getAll);
router.put('/:key', c.updateList);
router.post('/:key/add', c.addValue);
router.post('/:key/remove', c.removeValue);
module.exports = router;
