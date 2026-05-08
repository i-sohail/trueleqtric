// server/controllers/apController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search, status } = req.query;
  const filter = { isDeleted: false };
  if (search) {
    filter.OR = [
      { vendor: { contains: search, mode: 'insensitive' } },
      { apId: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (status) filter.status = status;
  
  const [data, total] = await Promise.all([
    prisma.aP.findMany({ 
      where: filter, 
      orderBy: { createdAt: 'desc' }, 
      skip: (parseInt(page)-1) * parseInt(limit), 
      take: parseInt(limit) 
    }), 
    prisma.aP.count({ where: filter })
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.aP.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await prisma.aP.create({ data: { ...req.body, createdById: req.user.id } });
  res.status(201).json({ data: doc, message: 'AP entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await prisma.aP.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(req.params.id, 'ap', req.user.id);
  res.json({ message: 'Moved to trash' });
});

exports.recordPayment = asyncHandler(async (req, res) => {
  const ap = await prisma.aP.findUnique({ where: { id: req.params.id } });
  if (!ap) return res.status(404).json({ error: 'Not found' });
  const { amount, date } = req.body;
  const newAmtPaid = (ap.amtPaid || 0) + parseFloat(amount);
  const total = (ap.invoiceAmt || 0) + (ap.gst || 0);
  const status = newAmtPaid >= total ? 'Payment Done' : 'Received - Partial';
  
  const doc = await prisma.aP.update({
    where: { id: req.params.id },
    data: {
      amtPaid: newAmtPaid,
      status,
      // paymentHistory not in schema yet, skipping for now or would need JSON field update
    }
  });
  res.json({ data: doc, message: 'Payment recorded' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const records = await prisma.aP.findMany({ where: { isDeleted: false } });
  let totalPayable=0, totalPaid=0, pendingCount=0;
  records.forEach(a => {
    const total = (a.invoiceAmt||0)+(a.gst||0);
    totalPayable += total; totalPaid += a.amtPaid||0;
    if (a.status==='Pending') pendingCount++;
  });
  res.json({ totalPayable, totalPaid, totalPending: totalPayable-totalPaid, pendingCount });
});
