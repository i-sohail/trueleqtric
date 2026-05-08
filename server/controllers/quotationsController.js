// server/controllers/quotationsController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { calcQuote } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.OR = [
      { customer: { contains: search, mode: 'insensitive' } },
      { quoteId: { contains: search, mode: 'insensitive' } },
      { product: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.quotation.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.quotation.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.quotation.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count({ where: { quoteId: { startsWith: `QT-${year}-` } } });
  const quoteId = `QT-${year}-${String(count + 1).padStart(3, '0')}`;
  
  const calc = calcQuote(req.body);
  const doc = await prisma.quotation.create({ 
    data: { ...req.body, ...calc, quoteId, createdById: req.user.id } 
  });
  res.status(201).json({ data: doc, message: 'Quotation created' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.quotation.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  
  const updatedData = { ...existing, ...req.body };
  const calc = calcQuote(updatedData);
  
  const doc = await prisma.quotation.update({ 
    where: { id: req.params.id }, 
    data: { ...req.body, ...calc } 
  });
  res.json({ data: doc, message: 'Quotation updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.quotation.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Quotation moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const quotes = await prisma.quotation.findMany({ where: { isDeleted: false } });
  
  const byStatus = quotes.reduce((acc, q) => {
    const existing = acc.find(a => a._id === q.status);
    if (existing) { existing.count++; existing.value += (q.total || 0); }
    else acc.push({ _id: q.status, count: 1, value: q.total || 0 });
    return acc;
  }, []);
  
  const expiring = quotes.filter(q => ['Draft', 'Submitted', 'Under Review'].includes(q.status)).length;
  
  res.json({ byStatus, expiring });
});

exports.convertToPO = asyncHandler(async (req, res) => {
  const quote = await prisma.quotation.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!quote) return res.status(404).json({ error: 'Not found' });
  
  const year = new Date().getFullYear();
  const count = await prisma.salesPO.count({ where: { spoId: { startsWith: `SPO-${year}-` } } });
  const spoId = `SPO-${year}-${String(count + 1).padStart(3, '0')}`;
  
  const spo = await prisma.salesPO.create({
    data: {
      spoId,
      customer: quote.customer, customerId: quote.customerId,
      quoteId: quote.quoteId, quoteRefId: quote.id,
      items: quote.items, sku: quote.sku, product: quote.product,
      category: quote.category, qty: quote.qty, unit: quote.unit,
      make: quote.make, unitPrice: quote.unitPrice, unitCost: quote.unitCost,
      gstRate: quote.gstRate, salesRep: quote.salesRep,
      status: 'Order Confirmed', createdById: req.user.id,
    }
  });
  
  await prisma.quotation.update({
    where: { id: quote.id },
    data: { status: 'Converted to PO' }
  });
  
  res.status(201).json({ data: spo, message: 'Converted to Sales PO' });
});

exports.getDocument = asyncHandler(async (req, res) => {
  const quote = await prisma.quotation.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!quote) return res.status(404).json({ error: 'Not found' });
  const customer = await prisma.customer.findFirst({ where: { name: quote.customer } });
  const calc = calcQuote(quote);
  res.json({ data: { quote, customer, calc } });
});
