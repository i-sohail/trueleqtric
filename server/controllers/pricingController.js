// server/controllers/pricingController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { search, category, page=1, limit=500 } = req.query;
  const where = { isDeleted: false };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.catalog.findMany({ where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.catalog.count({ where }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.catalog.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.catalog.create({ data: req.body });
  res.status(201).json({ data: doc, message: 'Catalog item created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.catalog.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.catalog.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});
