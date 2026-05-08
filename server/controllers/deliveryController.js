// server/controllers/deliveryController.js
const Delivery = require('../models/Delivery');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['spoId','transporter','lrNo','customer'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([Delivery.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Delivery.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Delivery.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Delivery.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Delivery entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Delivery.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Delivery, req.params.id, 'delivery', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const deliveries = await Delivery.find({ isDeleted: false });
  const overdue = deliveries.filter(d => {
    const done = ['Delivered - POD Received','Delivered - Pending POD','Cancelled'];
    return !done.includes(d.status) && d.contractedDate && !d.actualDelivery && new Date(d.contractedDate) < now;
  }).length;
  const agg = await Delivery.aggregate([{$match:{isDeleted:false}},{$group:{_id:'$status',count:{$sum:1}}}]);
  res.json({ total: deliveries.length, overdue, byStatus: agg });
});
