// server/controllers/inventoryController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search } = req.query;
  const filter = { isDeleted: false };
  if (search) {
    filter.OR = [
      { sku: { contains: search, mode: 'insensitive' } },
      { product: { contains: search, mode: 'insensitive' } },
      { warehouse: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.inventory.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.inventory.count({ where: filter }),
  ]);
  res.json({ data: items, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.inventory.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const count = await prisma.inventory.count();
  const invId = `INV-${String(count + 1).padStart(3, '0')}`;
  const doc = await prisma.inventory.create({ data: { ...req.body, invId, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'Inventory item created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.inventory.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.inventory.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.inventory.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const [items, catalog] = await Promise.all([
    prisma.inventory.findMany({ where: { isDeleted: false } }),
    prisma.catalog.findMany({ where: { isDeleted: false } })
  ]);
  
  const catMap = {};
  catalog.forEach(c => { catMap[c.sku] = c; });
  
  let totalValue=0, lowStock=0, outOfStock=0;
  const enriched = items.map(item => {
    const cur = (item.openingQty||0)+(item.receivedQty||0)-(item.issuedQty||0);
    const available = cur-(item.reservedQty||0);
    const cat = catMap[item.sku]||{};
    const stockValue = cur*(cat.costPrice||0);
    totalValue += stockValue;
    const stockStatus = cur<=0?'Out of Stock':cur<=(item.reorderLevel||0)?'Low Stock':'In Stock';
    if (stockStatus==='Low Stock') lowStock++;
    if (stockStatus==='Out of Stock') outOfStock++;
    return { ...item, currentStock:cur, availableStock:available, stockValue, stockStatus };
  });
  
  res.json({ data: enriched, stats: { total: items.length, lowStock, outOfStock, totalValue } });
});
