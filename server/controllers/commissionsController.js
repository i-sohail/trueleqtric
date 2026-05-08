// server/controllers/commissionsController.js
const Commission = require('../models/Commission');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['spoId','vendor','customer','product'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([Commission.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Commission.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Commission.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Commission.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Commission entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Commission.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Commission, req.params.id, 'commissions', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const all = await Commission.find({ isDeleted: false });
  const total = all.reduce((s,c)=>s+(c.commissionAmt||0),0);
  const received = all.filter(c=>c.status==='Received').reduce((s,c)=>s+(c.commissionAmt||0),0);
  const pending = all.filter(c=>c.status==='Pending').reduce((s,c)=>s+(c.commissionAmt||0),0);
  res.json({ total, received, pending, count: all.length });
});
