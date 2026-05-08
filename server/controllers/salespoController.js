// server/controllers/salespoController.js
const SalesPO = require('../models/SalesPO');
const AR = require('../models/AR');
const Procurement = require('../models/Procurement');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');
const { calcSPO } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, sort='-createdAt', search, status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['customer','spoId','product'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([SalesPO.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), SalesPO.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await SalesPO.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const spo = new SalesPO({ ...req.body, createdBy: req.user._id });
  const calc = calcSPO(spo.toObject());
  Object.assign(spo, calc);
  await spo.save();
  res.status(201).json({ data: spo, message: 'Sales PO created' });
});

exports.update = asyncHandler(async (req, res) => {
  const spo = await SalesPO.findOne({ _id: req.params.id, isDeleted: false });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  if (req.body.status && req.body.status !== spo.status) {
    spo.statusHistory = spo.statusHistory || [];
    spo.statusHistory.push({ status: req.body.status, changedBy: req.user.name });
  }
  Object.assign(spo, req.body);
  const calc = calcSPO(spo.toObject());
  Object.assign(spo, calc);
  await spo.save();
  res.json({ data: spo, message: 'Sales PO updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(SalesPO, req.params.id, 'salespo', req.user._id);
  res.json({ message: 'Sales PO moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const spos = await SalesPO.find({ isDeleted: false });
  const totalRevenue = spos.reduce((s,p)=>s+calcSPO(p).rev,0);
  const totalMargin = spos.reduce((s,p)=>s+calcSPO(p).margin,0);
  const avgMargin = totalRevenue>0 ? totalMargin/totalRevenue : 0;
  const active = spos.filter(p=>!['Closed','Cancelled'].includes(p.status)).length;
  const agg = await SalesPO.aggregate([{$match:{isDeleted:false}},{$group:{_id:'$status',count:{$sum:1}}}]);
  res.json({ totalRevenue, totalMargin, avgMargin, active, total: spos.length, byStatus: agg });
});

exports.createAR = asyncHandler(async (req, res) => {
  const spo = await SalesPO.findOne({ _id: req.params.id, isDeleted: false });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  const ar = await AR.create({ customer: spo.customer, customerId: spo.customerId, spoId: spo.spoId, spoRef: spo._id, salesRep: spo.salesRep, status: 'Pending', createdBy: req.user._id, ...req.body });
  res.status(201).json({ data: ar, message: 'AR entry created' });
});

exports.createProcurement = asyncHandler(async (req, res) => {
  const spo = await SalesPO.findOne({ _id: req.params.id, isDeleted: false });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  const proc = await Procurement.create({ salesPORef: spo.spoId, salesPOId: spo._id, items: spo.items, sku: spo.sku, product: spo.product, category: spo.category, qty: spo.qty, unit: spo.unit, status: 'Enquiry Sent', createdBy: req.user._id, ...req.body });
  spo.status = 'Procurement Initiated';
  if (!spo.statusHistory) spo.statusHistory = [];
  spo.statusHistory.push({ status: 'Procurement Initiated', changedBy: req.user.name });
  await spo.save();
  res.status(201).json({ data: proc, message: 'Procurement PO created' });
});

exports.getDocument = asyncHandler(async (req, res) => {
  const spo = await SalesPO.findOne({ _id: req.params.id, isDeleted: false });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  const customer = await Customer.findOne({ name: spo.customer });
  const calc = calcSPO(spo.toObject());
  res.json({ data: { spo, customer, calc } });
});
