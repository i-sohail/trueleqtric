// server/controllers/vendorScoresController.js
const VendorScore = require('../models/VendorScore');
const Vendor = require('../models/Vendor');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');
const { getVendorRatingFromScore } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-reviewDate',search } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['vendor','reviewedBy'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  const [data,total] = await Promise.all([VendorScore.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), VendorScore.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await VendorScore.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const review = await VendorScore.create({ ...req.body, createdBy: req.user._id });
  const vendor = await Vendor.findOne({ name: review.vendor, isDeleted: false });
  if (vendor && review.overallScore) { vendor.rating = getVendorRatingFromScore(review.overallScore); await vendor.save(); }
  res.status(201).json({ data: review, message: 'Review saved' });
});

exports.update = asyncHandler(async (req, res) => {
  const review = await VendorScore.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
  if (!review) return res.status(404).json({ error: 'Not found' });
  const vendor = await Vendor.findOne({ name: review.vendor, isDeleted: false });
  if (vendor && review.overallScore) { vendor.rating = getVendorRatingFromScore(review.overallScore); await vendor.save(); }
  res.json({ data: review, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(VendorScore, req.params.id, 'vendorReviews', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getVendorScorecard = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ isDeleted: false });
  const results = await Promise.all(vendors.map(async v => {
    const reviews = await VendorScore.find({ vendor: v.name, isDeleted: false }).sort({ reviewDate: -1 });
    const avg = reviews.length ? reviews.reduce((s,r)=>s+(r.overallScore||0),0)/reviews.length : null;
    return { ...v.toJSON(), reviews, avgScore: avg ? parseFloat(avg.toFixed(2)) : null, reviewCount: reviews.length };
  }));
  res.json({ data: results.sort((a,b)=>(b.avgScore||0)-(a.avgScore||0)) });
});
