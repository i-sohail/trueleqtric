// server/controllers/paymentScheduleController.js
const PaymentSchedule = require('../models/PaymentSchedule');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

const buildFilter = (q) => {
  const { search, customer } = q;
  const f = { isDeleted: false };
  if (search) f.$or = ['spoId','customer','scheduleId'].map(k => ({ [k]: { $regex: search, $options: 'i' } }));
  if (customer) f.customer = { $regex: customer, $options: 'i' };
  return f;
};

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, sort='-createdAt', ...rest } = req.query;
  const filter = buildFilter(rest);
  const [data, total] = await Promise.all([PaymentSchedule.find(filter).sort(sort).skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit)), PaymentSchedule.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await PaymentSchedule.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await PaymentSchedule.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Payment schedule created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await PaymentSchedule.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(PaymentSchedule, req.params.id, 'paymentSchedules', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.updateMilestone = asyncHandler(async (req, res) => {
  const { milestoneId } = req.params;
  const doc = await PaymentSchedule.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const milestone = doc.milestones.id(milestoneId);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  Object.assign(milestone, req.body);
  await doc.save();
  res.json({ data: doc, message: 'Milestone updated' });
});
