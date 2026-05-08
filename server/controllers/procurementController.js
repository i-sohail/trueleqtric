// server/controllers/procurementController.js
const Procurement = require('../models/Procurement');
const AP = require('../models/AP');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['vendor','procId','product'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([Procurement.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Procurement.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Procurement.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Procurement.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Procurement PO created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Procurement.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Procurement, req.params.id, 'procurement', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.createAP = asyncHandler(async (req, res) => {
  const proc = await Procurement.findOne({ _id: req.params.id, isDeleted: false });
  if (!proc) return res.status(404).json({ error: 'Not found' });
  const ap = await AP.create({ vendor: proc.vendor, vendorId: proc.vendorId, procId: proc.procId, procRef: proc._id, status: 'Pending', createdBy: req.user._id, ...req.body });
  res.status(201).json({ data: ap, message: 'AP entry created' });
});
