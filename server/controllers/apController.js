// server/controllers/apController.js
const AP = require('../models/AP');
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('../utils/softDelete');

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1,limit=500,sort='-createdAt',search,status } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = ['vendor','vendorInvNo','apId'].map(f=>({[f]:{$regex:search,$options:'i'}}));
  if (status) filter.status = status;
  const [data,total] = await Promise.all([AP.find(filter).sort(sort).skip((page-1)*limit).limit(parseInt(limit)), AP.countDocuments(filter)]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await AP.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const doc = await AP.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ data: doc, message: 'AP entry created' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await AP.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await softDelete(AP, req.params.id, 'ap', req.user._id);
  res.json({ message: 'Moved to trash' });
});

exports.recordPayment = asyncHandler(async (req, res) => {
  const ap = await AP.findOne({ _id: req.params.id, isDeleted: false });
  if (!ap) return res.status(404).json({ error: 'Not found' });
  const { amount, date, mode, ref } = req.body;
  ap.amtPaid = (ap.amtPaid||0) + parseFloat(amount);
  ap.payDate = date||new Date();
  ap.payMode = mode;
  ap.bankRef = ref;
  const total = (ap.invoiceAmt||0)+(ap.gst||0);
  ap.status = ap.amtPaid >= total ? 'Payment Done' : 'Received - Partial';
  ap.paymentHistory = ap.paymentHistory||[];
  ap.paymentHistory.push({ amount: parseFloat(amount), date: date||new Date(), mode, ref, recordedBy: req.user.name });
  await ap.save();
  res.json({ data: ap, message: 'Payment recorded' });
});

exports.getStats = asyncHandler(async (req, res) => {
  const records = await AP.find({ isDeleted: false });
  let totalPayable=0, totalPaid=0, pendingCount=0;
  records.forEach(a => {
    const total = (a.invoiceAmt||0)+(a.gst||0);
    totalPayable += total; totalPaid += a.amtPaid||0;
    if (a.status==='Pending') pendingCount++;
  });
  res.json({ totalPayable, totalPaid, totalPending: totalPayable-totalPaid, pendingCount });
});
