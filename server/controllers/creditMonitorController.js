// server/controllers/creditMonitorController.js
const asyncHandler = require('../middleware/asyncHandler');
const Customer = require('../models/Customer');
const AR = require('../models/AR');
const SalesPO = require('../models/SalesPO');
const { calcSPO, getOverdueDays } = require('../utils/financials');

exports.getCreditExposure = asyncHandler(async (req, res) => {
  const [customers, arRecords, spos] = await Promise.all([
    Customer.find({ isDeleted: false }),
    AR.find({ isDeleted: false }),
    SalesPO.find({ isDeleted: false }),
  ]);
  const data = customers.map(c => {
    const custAR = arRecords.filter(a=>a.customer===c.name && !['Received - Full','Written Off'].includes(a.status));
    const outstanding = custAR.reduce((s,a)=>s+((a.invoiceAmt||0)-(a.amtReceived||0)),0);
    const openOrders = spos.filter(p=>p.customer===c.name && !['Closed','Cancelled'].includes(p.status))
      .reduce((s,p)=>s+(calcSPO(p).totalWithGst||0),0);
    const totalExposure = outstanding + openOrders;
    const limit = c.creditLimit || 0;
    const utilisation = limit > 0 ? totalExposure/limit : 0;
    const overdue = custAR.filter(a=>getOverdueDays(a.dueDate,a.status)>0)
      .reduce((s,a)=>s+((a.invoiceAmt||0)-(a.amtReceived||0)),0);
    return { ...c.toJSON(), outstanding, openOrders, totalExposure, utilisation, overdue, limit };
  }).sort((a,b)=>b.utilisation-a.utilisation);
  const breaching = data.filter(c=>c.utilisation>=1&&c.limit>0).length;
  const warning = data.filter(c=>c.utilisation>=0.75&&c.utilisation<1&&c.limit>0).length;
  const totalOverdue = data.reduce((s,c)=>s+c.overdue,0);
  res.json({ data, summary: { monitored: customers.length, breaching, warning, totalOverdue } });
});
