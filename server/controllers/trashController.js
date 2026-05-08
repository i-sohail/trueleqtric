// server/controllers/trashController.js
const prisma = require('../utils/prisma');
const { restoreFromTrash } = require('../utils/softDelete');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const items = await prisma.trash.findMany({
    orderBy: { deletedAt: 'desc' },
    include: { deletedByUser: { select: { name: true } } }
  });
  res.json({ data: items, total: items.length });
});

exports.restore = asyncHandler(async (req, res) => {
  const item = await restoreFromTrash(req.params.trashId);
  res.json({ message: `${item.displayId} restored successfully` });
});

exports.permanentDelete = asyncHandler(async (req, res) => {
  const item = await prisma.trash.findFirst({ where: { trashId: req.params.trashId } });
  if (!item) return res.status(404).json({ error: 'Item not found in trash' });
  await prisma.trash.delete({ where: { id: item.id } });
  res.json({ message: 'Permanently deleted' });
});

exports.emptyTrash = asyncHandler(async (req, res) => {
  const result = await prisma.trash.deleteMany({});
  res.json({ message: `${result.count} items permanently deleted` });
});
