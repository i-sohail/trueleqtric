// server/controllers/trashController.js
const Trash = require('../models/Trash');
const { restoreFromTrash } = require('../utils/softDelete');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const items = await Trash.find({}).sort({ deletedAt: -1 }).populate('deletedBy', 'name');
  res.json({ data: items, total: items.length });
});

exports.restore = asyncHandler(async (req, res) => {
  const item = await restoreFromTrash(req.params.trashId);
  res.json({ message: `${item.displayId} restored successfully` });
});

exports.permanentDelete = asyncHandler(async (req, res) => {
  const item = await Trash.findOne({ trashId: req.params.trashId });
  if (!item) return res.status(404).json({ error: 'Item not found in trash' });
  await item.deleteOne();
  res.json({ message: 'Permanently deleted' });
});

exports.emptyTrash = asyncHandler(async (req, res) => {
  const result = await Trash.deleteMany({});
  res.json({ message: `${result.deletedCount} items permanently deleted` });
});
