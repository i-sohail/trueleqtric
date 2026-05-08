// server/controllers/prodTrackingController.js
const ProdTracking = require('../models/ProdTracking');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

const buildFilter = (q) => {
  const { search, status, qcStatus } = q;
  const f = { isDeleted: false };
  if (search) f.$or = ['spoId','vendor','product','trackId'].map(k => ({ [k]: { $regex: search, $options: 'i' } }));
  if (status) f.status = status;
  if (qcStatus) f.qcStatus = qcStatus;
  return f;
};

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, sort='-createdAt', ...rest } = req.query;
  const filter = buildFilter(rest);
  const [data, total] = await Promise.all([ProdTracking.find(filter).sort(sort).skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit)), ProdTracking.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await ProdTracking.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await ProdTracking.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Production track created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await ProdTracking.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(ProdTracking, req.params.id, 'prodtracking', req.user._id);
  res.json({ message: 'Moved to trash' });
});
