// server/controllers/deliveryController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (search) {
    filter.OR = [
      { spoId: { contains: search, mode: 'insensitive' } },
      { delId: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) filter.status = status;
  
  const [data, total] = await Promise.all([
    prisma.delivery.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    }),
    prisma.delivery.count({ where: filter })
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.delivery.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.delivery.create({ data: { ...req.body } });
  res.status(201).json({ data: doc, message: 'Delivery entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.delivery.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(req.params.id, 'delivery', req.user.id);
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const deliveries = await prisma.delivery.findMany({ where: { isDeleted: false } });
  const overdue = deliveries.filter(d => {
    const done = ['Delivered - POD Received','Delivered - Pending POD','Cancelled'];
    return !done.includes(d.status) && d.contractedDate && !d.actualDelivery && new Date(d.contractedDate) < now;
  }).length;
  
  const agg = await prisma.delivery.groupBy({
    by: ['status'],
    where: { isDeleted: false },
    _count: { _all: true }
  });
  
  res.json({ total: deliveries.length, overdue, byStatus: agg.map(a => ({ _id: a.status, count: a._count._all })) });
});
