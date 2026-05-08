const router = require('express').Router();
const c = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/mis', c.getMISData);
router.get('/excel', c.exportExcel);
router.get('/document/:type/:id', c.getDocumentHTML);
module.exports = router;
