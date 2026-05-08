// server/controllers/dashboardController.js
const asyncHandler = require('../middleware/asyncHandler');
const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const SalesPO = require('../models/SalesPO');
const AR = require('../models/AR');
const AP = require('../models/AP');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const Catalog = require('../models/Catalog');
const BGLC = require('../models/BGLC');
const Tender = require('../models/Tender');
const { calcSPO, getOverdueDays } = require('../utils/financials');

exports.getKPIs = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  const hasDates = startDate || endDate;

  const [leads, spos, ar, ap, inv, del_, customers, vendors, catalog] = await Promise.all([
    Lead.find({ isDeleted: false, ...(hasDates ? { date: dateFilter } : {}) }),
    SalesPO.find({ isDeleted: false, ...(hasDates ? { poDate: dateFilter } : {}) }),
    AR.find({ isDeleted: false, ...(hasDates ? { invoiceDate: dateFilter } : {}) }),
    AP.find({ isDeleted: false, ...(hasDates ? { invDate: dateFilter } : {}) }),
    Inventory.find({ isDeleted: false }),
    Delivery.find({ isDeleted: false }),
    Customer.countDocuments({ isDeleted: false }),
    Vendor.countDocuments({ isDeleted: false }),
    Catalog.find({ isDeleted: false }),
  ]);

  const catalogMap = {};
  catalog.forEach(c => { catalogMap[c.sku] = c; });

  const pipeline = leads.filter(l => l.stage !== 'Closed Lost').reduce((s, l) => s + (l.estValue || 0), 0);
  const totalRevenue = spos.reduce((s, p) => s + calcSPO(p).rev, 0);
  const totalGM = spos.reduce((s, p) => s + calcSPO(p).margin, 0);
  const avgMargin = totalRevenue > 0 ? totalGM / totalRevenue : 0;
  const poReceived = leads.filter(l => l.stage === 'PO Received').length;
  const winRate = leads.length ? poReceived / leads.length : 0;
  const overdueAR = ar.filter(a => getOverdueDays(a.dueDate, a.status) > 0)
    .reduce((s, a) => s + ((a.invoiceAmt || 0) - (a.amtReceived || 0)), 0);
  const pendingAP = ap.reduce((s, a) => s + ((a.invoiceAmt || 0) + (a.gst || 0) - (a.amtPaid || 0)), 0);

  let stockValue = 0, lowStock = 0;
  inv.forEach(item => {
    const cur = (item.openingQty || 0) + (item.receivedQty || 0) - (item.issuedQty || 0);
    const cat = catalogMap[item.sku] || {};
    stockValue += cur * (cat.costPrice || 0);
    if (cur <= 0 || cur <= (item.reorderLevel || 0)) lowStock++;
  });

  const now = new Date();
  const overdueDeliveries = del_.filter(d => {
    const done = ['Delivered - POD Received', 'Delivered - Pending POD', 'Cancelled'];
    return !done.includes(d.status) && d.contractedDate && !d.actualDelivery && new Date(d.contractedDate) < now;
  }).length;

  const activePOs = spos.filter(p => !['Closed', 'Cancelled'].includes(p.status)).length;

  res.json({
    pipeline, totalRevenue, totalGM, avgMargin, winRate,
    overdueAR, pendingAP, stockValue, lowStock, overdueDeliveries, activePOs,
    leadsCount: leads.length,
    activeLeads: leads.filter(l => !['Closed Lost', 'PO Received'].includes(l.stage)).length,
    customersCount: customers, vendorsCount: vendors,
  });
});

exports.getPipelineFunnel = asyncHandler(async (req, res) => {
  const stages = ['New Enquiry','Qualified','Proposal Submitted','Negotiation','PO Received','Closed Lost','On Hold','Repeat Order'];
  const agg = await Lead.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$estValue' } } },
  ]);
  const map = {};
  agg.forEach(a => { map[a._id] = a; });
  const funnel = stages.map(s => ({ stage: s, count: map[s]?.count || 0, value: map[s]?.value || 0 }));
  res.json({ data: funnel });
});

exports.getAlerts = asyncHandler(async (req, res) => {
  const now = new Date();
  const [overdueAR, invItems, critLeads, overdueDeliveries, expiringBGLC] = await Promise.all([
    AR.find({ isDeleted: false, status: { $nin: ['Received - Full','Written Off'] }, dueDate: { $lt: now } })
      .select('customer invoiceAmt amtReceived dueDate arId').limit(10),
    Inventory.find({ isDeleted: false }).limit(100),
    Lead.find({ isDeleted: false, priority: 'Critical', stage: { $nin: ['PO Received','Closed Lost'] } })
      .select('customer leadId stage priority estValue').limit(10),
    Delivery.find({
      isDeleted: false, contractedDate: { $lt: now },
      actualDelivery: { $exists: false },
      status: { $nin: ['Delivered - POD Received','Delivered - Pending POD','Cancelled'] }
    }).select('spoId delId contractedDate status').limit(10),
    BGLC.find({ isDeleted: false, status: 'Active', expiryDate: { $exists: true } }).limit(50),
  ]);

  const lowStockItems = invItems
    .map(item => {
      const cur = (item.openingQty || 0) + (item.receivedQty || 0) - (item.issuedQty || 0);
      return { ...item.toJSON(), currentStock: cur };
    })
    .filter(item => item.currentStock <= (item.reorderLevel || 0))
    .slice(0, 10);

  const bglcExpiring = expiringBGLC.filter(b => {
    const days = Math.ceil((new Date(b.expiryDate) - now) / 86400000);
    return days >= 0 && days <= (b.renewalAlert || 30);
  }).slice(0, 10);

  res.json({ overdueAR, lowStockItems, critLeads, overdueDeliveries, bglcExpiring });
});

exports.getRecentOrders = asyncHandler(async (req, res) => {
  const spos = await SalesPO.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(10);
  const enriched = spos.map(p => ({ ...p.toJSON(), calc: calcSPO(p) }));
  res.json({ data: enriched });
});

exports.getTicker = asyncHandler(async (req, res) => {
  const [leads, spos, ar] = await Promise.all([
    Lead.find({ isDeleted: false }),
    SalesPO.find({ isDeleted: false }),
    AR.find({ isDeleted: false }),
  ]);
  const pipeline = leads.filter(l => l.stage !== 'Closed Lost').reduce((s, l) => s + (l.estValue || 0), 0);
  const revenue = spos.reduce((s, p) => s + calcSPO(p).rev, 0);
  const overdue = ar.filter(a => getOverdueDays(a.dueDate, a.status) > 0)
    .reduce((s, a) => s + ((a.invoiceAmt || 0) - (a.amtReceived || 0)), 0);
  const avgMargin = spos.length ? spos.reduce((s, p) => s + calcSPO(p).marginPct, 0) / spos.length : 0;
  const activeLeads = leads.filter(l => !['Closed Lost','PO Received'].includes(l.stage)).length;
  const activePOs = spos.filter(s => !['Closed','Cancelled'].includes(s.status)).length;
  res.json({ pipeline, revenue, overdue, avgMargin, activeLeads, activePOs });
});
