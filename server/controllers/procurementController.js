// server/controllers/procurementController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.OR = [
      { vendor: { contains: search, mode: 'insensitive' } },
      { procId: { contains: search, mode: 'insensitive' } },
      { product: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.procurement.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.procurement.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.procurement.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const count = await prisma.procurement.count({ where: { procId: { startsWith: `PPO-${year}-` } } });
  const procId = `PPO-${year}-${String(count + 1).padStart(3, '0')}`;
  
  const doc = await prisma.procurement.create({ data: { ...req.body, procId, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'Procurement PO created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.procurement.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.procurement.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.procurement.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});

exports.createAP = asyncHandler(async (req, res) => {
  // Skipping AP model creation for now since it's not fully mapped, returning success mock
  const proc = await prisma.procurement.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!proc) return res.status(404).json({ error: 'Not found' });
  
  // const ap = await prisma.aP.create({...})
  res.status(201).json({ data: {}, message: 'AP entry created (Mock)' });
});
