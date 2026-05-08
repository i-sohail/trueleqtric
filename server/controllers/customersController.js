// server/controllers/customersController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, segment, region } = req.query;
  const filter = { isDeleted: false };
  if (segment) filter.segment = segment;
  if (region) filter.region = region;
  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { contact: { contains: search, mode: 'insensitive' } },
      { gst: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.customer.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.customer.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.customer.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const count = await prisma.customer.count();
  const customerId = `CUST-${String(count + 1).padStart(3, '0')}`;
  const doc = await prisma.customer.create({ data: { ...req.body, customerId, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'Customer created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.customer.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.customer.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Customer updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.customer.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Moved to trash' });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const customer = await prisma.customer.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  const [leads, quotations, salespos] = await Promise.all([
    prisma.lead.count({ where: { customer: customer.name, isDeleted: false } }),
    prisma.quotation.count({ where: { customer: customer.name, isDeleted: false } }),
    prisma.salesPO.count({ where: { customer: customer.name, isDeleted: false } }),
  ]);
  res.json({ customer, leads, quotations, salespos, arCount: 0, outstanding: 0 });
});
