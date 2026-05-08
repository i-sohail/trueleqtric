// server/controllers/arController.js
const AR = require('../models/AR');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');
const { getOverdueDays } = require('../utils/financials');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['customer','invoiceNo','arId'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([AR.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), AR.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await AR.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await AR.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'AR entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await AR.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(AR, req.params.id, 'ar', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.recordPayment = asyncHandler(async (req, res) => {
  const ar = await AR.findOne({ _id: req.params.id, isDeleted: false });
  if (!ar) return res.status(404).json({ error: 'Not found' });
  const { amount, date, mode, ref } = req.body;
  ar.amtReceived = (ar.amtReceived || 0) + parseFloat(amount);
  ar.receivedDate = date || new Date();
  ar.payMode = mode;
  ar.txnRef = ref;
  ar.status = ar.amtReceived >= ar.invoiceAmt ? 'Received - Full' : 'Received - Partial';
  ar.paymentHistory = ar.paymentHistory || [];
  ar.paymentHistory.push({ amount: parseFloat(amount), date: date||new Date(), mode, ref, recordedBy: req.user.name });
  await ar.save();
  res.json({ data: ar, message: 'Payment recorded' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const records = await AR.find({ isDeleted: false });
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
