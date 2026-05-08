// server/controllers/salespoController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { calcSPO } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) {
    filter.OR = [
      { customer: { contains: search, mode: 'insensitive' } },
      { spoId: { contains: search, mode: 'insensitive' } },
      { product: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.salesPO.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip: (page-1)*parseInt(limit), take: parseInt(limit) }),
    prisma.salesPO.count({ where: filter }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.salesPO.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const count = await prisma.salesPO.count({ where: { spoId: { startsWith: `SPO-${year}-` } } });
  const spoId = `SPO-${year}-${String(count + 1).padStart(3, '0')}`;
  
  const calc = calcSPO(req.body);
  const spo = await prisma.salesPO.create({ 
    data: { ...req.body, ...calc, spoId, createdById: req.user.id } 
  });
  res.status(201).json({ data: spo, message: 'Sales PO created' });
});

exports.update = asyncHandler(async (req, res) => {
  const spo = await prisma.salesPO.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  
  let statusHistory = Array.isArray(spo.statusHistory) ? [...spo.statusHistory] : [];
  if (req.body.status && req.body.status !== spo.status) {
    statusHistory.push({ status: req.body.status, changedAt: new Date().toISOString(), changedBy: req.user.name });
  }
  
  const updatedData = { ...spo, ...req.body };
  const calc = calcSPO(updatedData);
  
  const doc = await prisma.salesPO.update({ 
    where: { id: req.params.id }, 
    data: { ...req.body, ...calc, statusHistory } 
  });
  res.json({ data: doc, message: 'Sales PO updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.salesPO.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Sales PO moved to trash' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const spos = await prisma.salesPO.findMany({ where: { isDeleted: false } });
  
  const totalRevenue = spos.reduce((s,p)=>s+calcSPO(p).rev,0);
  const totalMargin = spos.reduce((s,p)=>s+calcSPO(p).margin,0);
  const avgMargin = totalRevenue>0 ? totalMargin/totalRevenue : 0;
  const active = spos.filter(p=>!['Closed','Cancelled'].includes(p.status)).length;
  
  const byStatus = spos.reduce((acc, p) => {
    const existing = acc.find(a => a._id === p.status);
    if (existing) { existing.count++; }
    else acc.push({ _id: p.status, count: 1 });
    return acc;
  }, []);
  
  res.json({ totalRevenue, totalMargin, avgMargin, active, total: spos.length, byStatus });
});

exports.createAR = asyncHandler(async (req, res) => {
  const spo = await prisma.salesPO.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  // Missing AR model in prisma currently, return mock
  res.status(201).json({ data: {}, message: 'AR entry created (Mock)' });
});

exports.createProcurement = asyncHandler(async (req, res) => {
  const spo = await prisma.salesPO.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  
  const year = new Date().getFullYear();
  const count = await prisma.procurement.count({ where: { procId: { startsWith: `PPO-${year}-` } } });
  const procId = `PPO-${year}-${String(count + 1).padStart(3, '0')}`;
  
  const proc = await prisma.procurement.create({
    data: {
      procId,
      vendor: "Unknown Vendor", // Needs to be provided in req.body usually
      salesPORef: spo.spoId, salesPOId: spo.id, 
      items: spo.items, sku: spo.sku, product: spo.product, 
      category: spo.category, qty: spo.qty, unit: spo.unit, 
      status: 'Enquiry Sent', createdById: req.user.id, ...req.body
    }
  });
  
  let statusHistory = Array.isArray(spo.statusHistory) ? [...spo.statusHistory] : [];
  statusHistory.push({ status: 'Procurement Initiated', changedAt: new Date().toISOString(), changedBy: req.user.name });
  
  await prisma.salesPO.update({
    where: { id: spo.id },
    data: { status: 'Procurement Initiated', statusHistory }
  });
  
  res.status(201).json({ data: proc, message: 'Procurement PO created' });
});

exports.getDocument = asyncHandler(async (req, res) => {
  const spo = await prisma.salesPO.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!spo) return res.status(404).json({ error: 'Not found' });
  const customer = await prisma.customer.findFirst({ where: { name: spo.customer } });
  const calc = calcSPO(spo);
  res.json({ data: { spo, customer, calc } });
});
