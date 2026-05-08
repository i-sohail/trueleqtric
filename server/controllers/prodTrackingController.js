// server/controllers/prodTrackingController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { spoId: { contains: search, mode: 'insensitive' } },
      { stage: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.prodTracking.findMany({ where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.prodTracking.count({ where }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.prodTracking.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.prodTracking.create({ data: req.body });
  res.status(201).json({ data: doc, message: 'Production track created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.prodTracking.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.prodTracking.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});
