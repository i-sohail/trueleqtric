// server/controllers/catalogController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, category } = req.query;
  const filter = { isDeleted: false };
  if (category) filter.category = category;
  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { make: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.catalog.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.catalog.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.catalog.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const count = await prisma.catalog.count();
  const catCode = (req.body.category || 'GEN').replace(/[^A-Z]/gi, '').slice(0,3).toUpperCase();
  const sku = `SKU-${catCode}-${String(count + 1).padStart(3, '0')}`;
  
  const doc = await prisma.catalog.create({ data: { ...req.body, sku, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'Product created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.catalog.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.catalog.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Product updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.catalog.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});

exports.updatePrice = asyncHandler(async (req, res) => {
  const { costPrice, listPrice, minPrice, note, changedBy } = req.body;
  const item = await prisma.catalog.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!item) return res.status(404).json({ error: 'Not found' });
  
  let priceHistory = Array.isArray(item.priceHistory) ? [...item.priceHistory] : [];
  priceHistory.push({ 
    date: new Date().toISOString(), 
    costPrice: item.costPrice, 
    listPrice: item.listPrice, 
    minPrice: item.minPrice, 
    note: note || 'Price update', 
    changedBy: changedBy || req.user.name 
  });
  
  const updateData = { priceHistory };
  if (costPrice !== undefined) updateData.costPrice = costPrice;
  if (listPrice !== undefined) updateData.listPrice = listPrice;
  if (minPrice !== undefined) updateData.minPrice = minPrice;
  
  const updatedItem = await prisma.catalog.update({
    where: { id: item.id },
    data: updateData
  });
  
  res.json({ data: updatedItem, message: 'Price updated' });
});

exports.getPriceHistory = asyncHandler(async (req, res) => {
  const item = await prisma.catalog.findFirst({ 
    where: { id: req.params.id, isDeleted: false },
    select: { sku: true, name: true, priceHistory: true, costPrice: true, listPrice: true, minPrice: true }
  });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: item });
});
