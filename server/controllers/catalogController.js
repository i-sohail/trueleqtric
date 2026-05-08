// server/controllers/catalogController.js
const Catalog = require('../models/Catalog');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,category } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['name','sku','category','make'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (category) filter.category = category;
  const [data,total] = await Promise.all([Catalog.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Catalog.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Catalog.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Catalog.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Product created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Catalog.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Product updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Catalog, req.params.id, 'catalog', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.updatePrice = asyncHandler(async (req, res) => {
  const { costPrice, listPrice, minPrice, note, changedBy } = req.body;
  const item = await Catalog.findOne({ _id: req.params.id, isDeleted: false });
  if (!item) return res.status(404).json({ error: 'Not found' });
  item.priceHistory = item.priceHistory || [];
  item.priceHistory.push({ date: new Date(), costPrice: item.costPrice, listPrice: item.listPrice, minPrice: item.minPrice, note: note||'Price update', changedBy: changedBy||req.user.name });
  if (costPrice !== undefined) item.costPrice = costPrice;
  if (listPrice !== undefined) item.listPrice = listPrice;
  if (minPrice !== undefined) item.minPrice = minPrice;
  await item.save();
  res.json({ data: item, message: 'Price updated' });
});

exports.getPriceHistory = asyncHandler(async (req, res) => {
  const item = await Catalog.findOne({ _id: req.params.id, isDeleted: false }).select('sku name priceHistory costPrice listPrice minPrice');
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: item });
});
