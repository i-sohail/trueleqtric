// server/controllers/vendorsController.js
const Vendor = require('../models/Vendor');
const VendorScore = require('../models/VendorScore');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');
const { getVendorRatingFromScore } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,category } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['name','contact','gst','category','brands'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (category) filter.category = category;
  const [data,total] = await Promise.all([Vendor.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Vendor.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Vendor.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Vendor.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Vendor created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Vendor.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Vendor updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Vendor, req.params.id, 'vendors', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ _id: req.params.id, isDeleted: false });
  if (!vendor) return res.status(404).json({ error: 'Not found' });
  const reviews = await VendorScore.find({ vendorId: vendor._id }).sort({ reviewDate: -1 });
  const avgScore = reviews.length ? reviews.reduce((s,r)=>s+(r.overallScore||0),0)/reviews.length : null;
  res.json({ vendor, reviews, avgScore });
});
