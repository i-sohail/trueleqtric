// server/controllers/leadsController.js
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

const buildFilter = (q) => {
  const { search, status, stage, region, category, salesRep, priority } = q;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['customer','contact','tenderRef','notes'].map(f => ({ [f]: { $regex: search, $options: 'i' } }));
  if (stage) filter.stage = stage;
  if (region) filter.region = region;
  if (category) filter.category = category;
  if (salesRep) filter.salesRep = salesRep;
  if (priority) filter.priority = priority;
  return filter;
};

exports.getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 500, sort = '-createdAt', ...rest } = req.query;
  const filter = buildFilter(rest);
  const [data, total] = await Promise.all([
    Lead.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)),
    Lead.countDocuments(filter),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Lead.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Lead not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const lead = await Lead.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: lead, message: 'Lead created' });
});

exports.update = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.body.stage && req.body.stage !== lead.stage) {
    lead.stageHistory = lead.stageHistory || [];
    lead.stageHistory.push({ stage: req.body.stage, changedBy: req.user.name });
  }
  Object.assign(lead, req.body);
  await lead.save();
  res.json({ data: lead, message: 'Lead updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Lead, req.params.id, 'leads', req.user._id);
  res.json({ message: 'Lead moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const [agg, total, activeCount, pipelineAgg] = await Promise.all([
    Lead.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$estValue' } } }]),
    Lead.countDocuments({ isDeleted: false }),
    Lead.countDocuments({ isDeleted: false, stage: { $nin: ['Closed Lost','PO Received'] } }),
    Lead.aggregate([{ $match: { isDeleted: false, stage: { $ne: 'Closed Lost' } } }, { $group: { _id: null, total: { $sum: '$estValue' } } }]),
  ]);
  res.json({ total, active: activeCount, pipeline: pipelineAgg[0]?.total || 0, byStage: agg });
});

exports.convertToQuote = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const quote = await Quotation.create({
    customer: lead.customer, customerId: lead.customerId,
    leadId: lead.leadId, leadRef: lead._id,
    sku: lead.sku, category: lead.category, qty: lead.qty, unit: lead.unit,
    salesRep: lead.salesRep, status: 'Draft', createdBy: req.user._id,
  });
  lead.stage = 'Proposal Submitted';
  lead.stageHistory.push({ stage: 'Proposal Submitted', changedBy: req.user.name });
  await lead.save();
  res.status(201).json({ data: quote, message: 'Lead converted to Quotation' });
});
