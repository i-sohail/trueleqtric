// server/controllers/cashFlowController.js
const asyncHandler = require('../middleware/asyncHandler');
const AR = require('../models/AR');
const AP = require('../models/AP');
const PaymentSchedule = require('../models/PaymentSchedule');

exports.getProjection = asyncHandler(async (req, res) => {
  const [arRecords, apRecords, schedules] = await Promise.all([
    AR.find({ isDeleted: false, status: { $nin: ['Received - Full','Written Off'] } }),
    AP.find({ isDeleted: false, status: 'Pending' }),
    PaymentSchedule.find({ isDeleted: false }),
  ]);
  const today = new Date();
  const weeks = Array.from({ length: 13 }, (_, w) => {
    const wStart = new Date(today); wStart.setDate(today.getDate() + w * 7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
    return { week: w+1, start: wStart, end: wEnd, inflow: 0, outflow: 0, label: `W${w+1} ${wStart.toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}` };
  });
  arRecords.forEach(a => {
    if (!a.dueDate) return;
    const due = new Date(a.dueDate);
    const outstanding = (a.invoiceAmt||0) - (a.amtReceived||0);
    weeks.forEach(w => { if (due >= w.start && due <= w.end) w.inflow += outstanding; });
  });
  schedules.forEach(s => {
    (s.milestones||[]).filter(m => m.status === 'Pending' && m.dueDate).forEach(m => {
      const due = new Date(m.dueDate);
      weeks.forEach(w => { if (due >= w.start && due <= w.end) w.inflow += m.amount||0; });
    });
  });
  apRecords.forEach(a => {
    if (!a.dueDate) return;
    const due = new Date(a.dueDate);
    const pending = (a.invoiceAmt||0) + (a.gst||0) - (a.amtPaid||0);
    weeks.forEach(w => { if (due >= w.start && due <= w.end) w.outflow += pending; });
  });
  let cumulative = 0;
  const data = weeks.map(w => {
    const net = w.inflow - w.outflow;
    cumulative += net;
    return { ...w, net, cumulative, start: w.start.toISOString(), end: w.end.toISOString() };
  });
  const totalInflows = data.reduce((s, w) => s + w.inflow, 0);
  const totalOutflows = data.reduce((s, w) => s + w.outflow, 0);
  const negativeWeeks = data.filter(w => w.net < 0).length;
  res.json({ data, summary: { totalInflows, totalOutflows, netPosition: totalInflows - totalOutflows, negativeWeeks } });
});
