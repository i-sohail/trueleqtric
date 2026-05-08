// server/controllers/paymentScheduleController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { spoId: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.paymentSchedule.findMany({ where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.paymentSchedule.count({ where }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.paymentSchedule.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const { milestones, ...rest } = req.body;
  const doc = await prisma.paymentSchedule.create({ data: { ...rest } });
  res.status(201).json({ data: doc, message: 'Payment schedule created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.paymentSchedule.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.paymentSchedule.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

exports.updateMilestone = asyncHandler(async (req, res) => {
  // milestones stored in JSON field
  const doc = await prisma.paymentSchedule.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Milestone updated' });
});
