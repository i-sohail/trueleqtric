// server/controllers/tendersController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { tenderNo: { contains: search, mode: 'insensitive' } },
      { customer: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.tender.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.tender.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.tender.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const count = await prisma.tender.count({ where: { tenderId: { startsWith: `TND-${year}-` } } });
  const tenderId = `TND-${year}-${String(count + 1).padStart(3, '0')}`;
  
  const doc = await prisma.tender.create({ data: { ...req.body, tenderId, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'Tender created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.tender.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.tender.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.tender.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});

exports.updateChecklist = asyncHandler(async (req, res) => {
  const existing = await prisma.tender.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.tender.update({ where: { id: req.params.id }, data: { checklist: req.body } });
  res.json({ data: doc, message: 'Checklist updated' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const tenders = await prisma.tender.findMany({ where: { isDeleted: false } });
  const byStatus = tenders.reduce((acc, t) => {
    const existing = acc.find(a => a._id === t.status);
    if (existing) { existing.count++; existing.value += (t.ourBidValue || 0); }
    else acc.push({ _id: t.status, count: 1, value: t.ourBidValue || 0 });
    return acc;
  }, []);
  const active = tenders.filter(t => !['Awarded','Lost','Cancelled','Dropped'].includes(t.status)).length;
  res.json({ byStatus, active });
});
