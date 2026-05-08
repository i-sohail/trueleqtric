// server/controllers/inventoryController.js
const Inventory = require('../models/Inventory');
const Catalog = require('../models/Catalog');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['sku','product','warehouse'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  const [items,total] = await Promise.all([Inventory.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), Inventory.countDocuments(filter)]);
  res.json({ data: items, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Inventory.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await Inventory.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'Inventory item created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Inventory.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(Inventory, req.params.id, 'inventory', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const [items, catalog] = await Promise.all([Inventory.find({ isDeleted: false }), Catalog.find({ isDeleted: false })]);
  const catMap = {};
  catalog.forEach(c => { catMap[c.sku] = c; });
  let totalValue=0, lowStock=0, outOfStock=0;
  const enriched = items.map(item => {
    const cur = (item.openingQty||0)+(item.receivedQty||0)-(item.issuedQty||0);
    const available = cur-(item.reservedQty||0);
    const cat = catMap[item.sku]||{};
    const stockValue = cur*(cat.costPrice||0);
    totalValue += stockValue;
    const stockStatus = cur<=0?'Out of Stock':cur<=(item.reorderLevel||0)?'Low Stock':'In Stock';
    if (stockStatus==='Low Stock') lowStock++;
    if (stockStatus==='Out of Stock') outOfStock++;
    return { ...item.toJSON(), currentStock:cur, availableStock:available, stockValue, stockStatus };
  });
  res.json({ data: enriched, stats: { total: items.length, lowStock, outOfStock, totalValue } });
});
