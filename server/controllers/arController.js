// server/controllers/arController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');
const { getOverdueDays } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (search) {
    filter.OR = [
      { customer: { contains: search, mode: 'insensitive' } },
      { arId: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) filter.status = status;
  
  const [data, total] = await Promise.all([
    prisma.aR.findMany({ 
      where: filter, 
      orderBy: { createdAt: 'desc' }, 
      skip: (parseInt(page)-1) * parseInt(limit), 
      take: parseInt(limit) 
    }), 
    prisma.aR.count({ where: filter })
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.aR.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.aR.create({ data: { ...req.body, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'AR entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.aR.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(req.params.id, 'ar', req.user.id);
  res.json({ message: 'Moved to trash' });
});

exports.recordPayment = asyncHandler(async (req, res) => {
  const ar = await prisma.aR.findUnique({ where: { id: req.params.id } });
  if (!ar) return res.status(404).json({ error: 'Not found' });
  const { amount } = req.body;
  const newAmtReceived = (ar.amtReceived || 0) + parseFloat(amount);
  const status = newAmtReceived >= ar.invoiceAmt ? 'Received - Full' : 'Received - Partial';
  
  const doc = await prisma.aR.update({
    where: { id: req.params.id },
    data: {
      amtReceived: newAmtReceived,
      status,
    }
  });
  res.json({ data: doc, message: 'Payment recorded' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const records = await prisma.aR.findMany({ where: { isDeleted: false } });
  let totalInvoiced=0, totalCollected=0, totalOverdue=0, overdueCount=0;
  const aging = { Current:0, '1-30d':0, '31-60d':0, '61-90d':0, '90+d':0 };
  records.forEach(a => {
    totalInvoiced += a.invoiceAmt||0;
    totalCollected += a.amtReceived||0;
    const od = getOverdueDays(a.dueDate, a.status);
    const bal = (a.invoiceAmt||0)-(a.amtReceived||0);
    if (od>0) { totalOverdue+=bal; overdueCount++; }
    if (od===0) aging.Current+=bal;
    else if (od<=30) aging['1-30d']+=bal;
    else if (od<=60) aging['31-60d']+=bal;
    else if (od<=90) aging['61-90d']+=bal;
    else aging['90+d']+=bal;
  });
  res.json({ totalInvoiced, totalCollected, totalOutstanding: totalInvoiced-totalCollected, totalOverdue, overdueCount, aging });
});
