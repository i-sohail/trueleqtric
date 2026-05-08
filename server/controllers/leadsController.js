// server/controllers/leadsController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

const buildFilter = (q) => {
  const { search, stage, region, category, salesRep, priority } = q;
  const filter = { isDeleted: false };
  if (stage) filter.stage = stage;
  if (region) filter.region = region;
  if (category) filter.category = category;
  if (salesRep) filter.salesRep = salesRep;
  if (priority) filter.priority = priority;
  if (search) {
    filter.OR = [
      { customer: { contains: search, mode: 'insensitive' } },
      { contact: { contains: search, mode: 'insensitive' } },
      { tenderRef: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }
  return filter;
};

exports.getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 500, sort = 'createdAt', ...rest } = req.query;
  const filter = buildFilter(rest);
  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.lead.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.lead.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Lead not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const count = await prisma.lead.count({ where: { leadId: { startsWith: `LD-${year}-` } } });
  const leadId = `LD-${year}-${String(count + 1).padStart(3, '0')}`;

  const lead = await prisma.lead.create({
    data: { ...req.body, leadId, createdById: req.user.id, stageHistory: [] }
  });
  res.status(201).json({ data: lead, message: 'Lead created' });
});

exports.update = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  let stageHistory = Array.isArray(lead.stageHistory) ? lead.stageHistory : [];
  if (req.body.stage && req.body.stage !== lead.stage) {
    stageHistory.push({ stage: req.body.stage, changedAt: new Date().toISOString(), changedBy: req.user.name });
  }

  const updated = await prisma.lead.update({
    where: { id: req.params.id },
    data: { ...req.body, stageHistory }
  });
  res.json({ data: updated, message: 'Lead updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.lead.update({
    where: { id: req.params.id },
    data: { isDeleted: true, deletedAt: new Date() }
  });
  res.json({ message: 'Lead moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const leads = await prisma.lead.findMany({ where: { isDeleted: false } });
  const total = leads.length;
  const active = leads.filter(l => !['Closed Lost', 'PO Received'].includes(l.stage)).length;
  const pipeline = leads.filter(l => l.stage !== 'Closed Lost').reduce((sum, l) => sum + (l.estValue || 0), 0);
  const byStage = leads.reduce((acc, l) => {
    const existing = acc.find(a => a._id === l.stage);
    if (existing) { existing.count++; existing.value += (l.estValue || 0); }
    else acc.push({ _id: l.stage, count: 1, value: l.estValue || 0 });
    return acc;
  }, []);
  res.json({ total, active, pipeline, byStage });
});

exports.convertToQuote = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const year = new Date().getFullYear();
  const count = await prisma.quotation.count({ where: { quoteId: { startsWith: `QT-${year}-` } } });
  const quoteId = `QT-${year}-${String(count + 1).padStart(3, '0')}`;

  const quote = await prisma.quotation.create({
    data: {
      quoteId,
      customer: lead.customer, customerId: lead.customerId,
      leadId: lead.leadId, leadRefId: lead.id,
      sku: lead.sku, category: lead.category, qty: lead.qty, unit: lead.unit,
      salesRep: lead.salesRep, status: 'Draft', createdById: req.user.id,
      items: [],
    }
  });

  const stageHistory = Array.isArray(lead.stageHistory) ? [...lead.stageHistory] : [];
  stageHistory.push({ stage: 'Proposal Submitted', changedAt: new Date().toISOString(), changedBy: req.user.name });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: 'Proposal Submitted', stageHistory }
  });

  res.status(201).json({ data: quote, message: 'Lead converted to Quotation' });
});
