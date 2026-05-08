// server/controllers/quotationsController.js
const Quotation = require('../models/Quotation');
const SalesPO = require('../models/SalesPO');
const Customer = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');
const { calcQuote } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, sort='-createdAt', search, status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['customer','quoteId','product'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([Quotation.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Quotation.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Quotation.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const quote = new Quotation({ ...req.body, createdBy: req.user._id });
  const calc = calcQuote(quote.toObject());
  Object.assign(quote, calc);
  await quote.save();
  res.status(201).json({ data: quote, message: 'Quotation created' });
});

exports.update = asyncHandler(async (req, res) => {
  const quote = await Quotation.findOne({ _id: req.params.id, isDeleted: false });
  if (!quote) return res.status(404).json({ error: 'Not found' });
  Object.assign(quote, req.body);
  const calc = calcQuote(quote.toObject());
  Object.assign(quote, calc);
  await quote.save();
  res.json({ data: quote, message: 'Quotation updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Quotation, req.params.id, 'quotations', req.user._id);
  res.json({ message: 'Quotation moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const agg = await Quotation.aggregate([{ $match:{isDeleted:false} }, { $group:{_id:'$status',count:{$sum:1},value:{$sum:'$total'}} }]);
  const expiring = await Quotation.countDocuments({ isDeleted:false, status:{$in:['Draft','Submitted','Under Review']} });
  res.json({ byStatus: agg, expiring });
});

exports.convertToPO = asyncHandler(async (req, res) => {
  const quote = await Quotation.findOne({ _id: req.params.id, isDeleted: false });
  if (!quote) return res.status(404).json({ error: 'Not found' });
  const spo = await SalesPO.create({
    customer: quote.customer, customerId: quote.customerId,
    quoteId: quote.quoteId, quoteRef: quote._id,
    items: quote.items, sku: quote.sku, product: quote.product,
    category: quote.category, qty: quote.qty, unit: quote.unit,
    make: quote.make, unitPrice: quote.unitPrice, unitCost: quote.unitCost,
    gstRate: quote.gstRate, salesRep: quote.salesRep,
    status: 'Order Confirmed', createdBy: req.user._id,
  });
  quote.status = 'Converted to PO';
  await quote.save();
  res.status(201).json({ data: spo, message: 'Converted to Sales PO' });
});

exports.getDocument = asyncHandler(async (req, res) => {
  const quote = await Quotation.findOne({ _id: req.params.id, isDeleted: false });
  if (!quote) return res.status(404).json({ error: 'Not found' });
  const customer = await Customer.findOne({ name: quote.customer });
  const calc = calcQuote(quote.toObject());
  res.json({ data: { quote, customer, calc } });
});
