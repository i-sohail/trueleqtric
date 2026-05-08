// server/controllers/customersController.js
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,segment,region } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['name','contact','gst','email','city'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (segment) filter.segment = segment;
  if (region) filter.region = region;
  const [data,total] = await Promise.all([Customer.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Customer.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Customer.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Customer.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Customer created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Customer.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Customer updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Customer, req.params.id, 'customers', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getSummary = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  const Lead = require('../models/Lead');
  const Quotation = require('../models/Quotation');
  const SalesPO = require('../models/SalesPO');
  const AR = require('../models/AR');
  const [leads, quotations, salespos, ar] = await Promise.all([
    Lead.countDocuments({ customer: customer.name, isDeleted: false }),
    Quotation.countDocuments({ customer: customer.name, isDeleted: false }),
    SalesPO.countDocuments({ customer: customer.name, isDeleted: false }),
    AR.find({ customer: customer.name, isDeleted: false }),
  ]);
  const outstanding = ar.reduce((s,a)=>s+((a.invoiceAmt||0)-(a.amtReceived||0)),0);
  res.json({ customer, leads, quotations, salespos, arCount: ar.length, outstanding });
});
