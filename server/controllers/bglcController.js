// server/controllers/bglcController.js
const BGLC = require('../models/BGLC');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status,type } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['bgNo','bank','beneficiary','purpose'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  if (type) filter.type = type;
  const [data,total] = await Promise.all([BGLC.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), BGLC.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await BGLC.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await BGLC.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'BG/LC created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await BGLC.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(BGLC, req.params.id, 'bglc', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const all = await BGLC.find({ isDeleted: false });
  const active = all.filter(b=>b.status==='Active').length;
  const expiring = all.filter(b => {
    if (b.status!=='Active'||!b.expiryDate) return false;
    const days = Math.ceil((new Date(b.expiryDate)-today)/86400000);
    return days>=0 && days<=(b.renewalAlert||30);
  }).length;
  const totalValue = all.filter(b=>b.status==='Active').reduce((s,b)=>s+(b.amount||0),0);
  res.json({ total: all.length, active, expiring, totalValue });
});
