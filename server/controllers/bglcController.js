// server/controllers/bglcController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status, type } = req.query;
  const filter = { isDeleted: false };
  if (search) {
    filter.OR = [
      { bgId: { contains: search, mode: 'insensitive' } },
      // other fields not in schema yet like bank, beneficiary
    ];
  }
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [data, total] = await Promise.all([
    prisma.bGLC.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.bGLC.count({ where: filter })
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.bGLC.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.bGLC.create({ data: { ...req.body } });
  res.status(201).json({ data: doc, message: 'BG/LC created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.bGLC.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(req.params.id, 'bglc', req.user.id);
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const all = await prisma.bGLC.findMany({ where: { isDeleted: false } });
  const active = all.filter(b => b.status === 'Active').length;
  const expiring = all.filter(b => {
    if (b.status !== 'Active' || !b.expiryDate) return false;
    const days = Math.ceil((new Date(b.expiryDate) - today) / 86400000);
    return days >= 0 && days <= (b.renewalAlert || 30);
  }).length;
  const totalValue = all.filter(b => b.status === 'Active').reduce((s, b) => s + (b.amount || 0), 0);
  res.json({ total: all.length, active, expiring, totalValue });
});
