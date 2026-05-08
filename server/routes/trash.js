const router = require('express').Router();
const c = require('../controllers/trashController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', c.getAll);
router.post('/:trashId/restore', c.restore);
router.delete('/:trashId', c.permanentDelete);
router.delete('/', c.emptyTrash);
module.exports = router;
