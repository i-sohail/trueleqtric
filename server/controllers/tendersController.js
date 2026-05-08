// server/controllers/tendersController.js
const Tender = require('../models/Tender');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['title','tenderNo','customer'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([Tender.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Tender.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Tender.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Tender.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Tender created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Tender.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Tender, req.params.id, 'tenders', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.updateChecklist = asyncHandler(async (req, res) => {
  const doc = await Tender.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { $set: { checklist: req.body } }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Checklist updated' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const agg = await Tender.aggregate([{$match:{isDeleted:false}},{$group:{_id:'$status',count:{$sum:1},value:{$sum:'$ourBidValue'}}}]);
  const active = await Tender.countDocuments({ isDeleted:false, status:{$nin:['Awarded','Lost','Cancelled','Dropped']} });
  res.json({ byStatus: agg, active });
});
