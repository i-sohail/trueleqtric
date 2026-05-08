// server/controllers/vendorsController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { getVendorRatingFromScore } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, category } = req.query;
  const filter = { isDeleted: false };
  if (category) filter.category = category;
  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { contact: { contains: search, mode: 'insensitive' } },
      { gst: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { brands: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.vendor.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.vendor.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.vendor.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const count = await prisma.vendor.count();
  const vendorId = `VEND-${String(count + 1).padStart(3, '0')}`;
  const doc = await prisma.vendor.create({ data: { ...req.body, vendorId, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'Vendor created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.vendor.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.vendor.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Vendor updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.vendor.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!vendor) return res.status(404).json({ error: 'Not found' });
  
  // Minimal placeholder since VendorScore isn't in prisma yet
  const reviews = [];
  const avgScore = null;
  res.json({ vendor, reviews, avgScore });
});
