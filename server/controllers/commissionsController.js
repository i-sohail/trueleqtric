// server/controllers/commissionsController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { salesRep: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.commission.findMany({ where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.commission.count({ where }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.commission.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.commission.create({ data: req.body });
  res.status(201).json({ data: doc, message: 'Commission entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.commission.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.commission.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const all = await prisma.commission.findMany();
  const total = all.reduce((s,c)=>s+(c.amount||0),0);
  const received = all.filter(c=>c.status==='Received').reduce((s,c)=>s+(c.amount||0),0);
  const pending = all.filter(c=>c.status==='Pending').reduce((s,c)=>s+(c.amount||0),0);
  res.json({ total, received, pending, count: all.length });
});
