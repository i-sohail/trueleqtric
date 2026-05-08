// server/controllers/dashboardController.js
const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../utils/prisma');
const { calcSPO, getOverdueDays } = require('../utils/financials');

exports.getKPIs = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);
  const hasDates = startDate || endDate;

  const [leads, spos, ar, ap, inv, del_, customersCount, vendorsCount, catalog] = await Promise.all([
    prisma.lead.findMany({ where: { isDeleted: false, ...(hasDates ? { date: dateFilter } : {}) } }),
    prisma.salesPO.findMany({ where: { isDeleted: false, ...(hasDates ? { poDate: dateFilter } : {}) } }),
    prisma.aR.findMany({ where: { isDeleted: false, ...(hasDates ? { invoiceDate: dateFilter } : {}) } }),
    prisma.aP.findMany({ where: { isDeleted: false, ...(hasDates ? { invDate: dateFilter } : {}) } }),
    prisma.inventory.findMany({ where: { isDeleted: false } }),
    prisma.delivery.findMany({ where: { isDeleted: false } }),
    prisma.customer.count({ where: { isDeleted: false } }),
    prisma.vendor.count({ where: { isDeleted: false } }),
    prisma.catalog.findMany({ where: { isDeleted: false } }),
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
    customersCount, vendorsCount,
  });
});

exports.getPipelineFunnel = asyncHandler(async (req, res) => {
  const stages = ['New Enquiry','Qualified','Proposal Submitted','Negotiation','PO Received','Closed Lost','On Hold','Repeat Order'];
  const agg = await prisma.lead.groupBy({
    by: ['stage'],
    where: { isDeleted: false },
    _sum: { estValue: true },
    _count: { _all: true }
  });
  
  const map = {};
  agg.forEach(a => { 
    map[a.stage] = { count: a._count._all, value: a._sum.estValue || 0 }; 
  });
  
  const funnel = stages.map(s => ({ stage: s, count: map[s]?.count || 0, value: map[s]?.value || 0 }));
  res.json({ data: funnel });
});

exports.getAlerts = asyncHandler(async (req, res) => {
  const now = new Date();
  const [overdueAR, invItems, critLeads, overdueDeliveries, expiringBGLC] = await Promise.all([
    prisma.aR.findMany({ 
      where: { isDeleted: false, status: { notIn: ['Received - Full','Written Off'] }, dueDate: { lt: now } },
      select: { customer: true, invoiceAmt: true, amtReceived: true, dueDate: true, arId: true },
      take: 10
    }),
    prisma.inventory.findMany({ where: { isDeleted: false }, take: 100 }),
    prisma.lead.findMany({ 
      where: { isDeleted: false, priority: 'Critical', stage: { notIn: ['PO Received','Closed Lost'] } },
      select: { customer: true, leadId: true, stage: true, priority: true, estValue: true },
      take: 10
    }),
    prisma.delivery.findMany({
      where: {
        isDeleted: false, contractedDate: { lt: now },
        actualDelivery: null,
        status: { notIn: ['Delivered - POD Received','Delivered - Pending POD','Cancelled'] }
      },
      select: { spoId: true, delId: true, contractedDate: true, status: true },
      take: 10
    }),
    prisma.bGLC.findMany({ where: { isDeleted: false, status: 'Active', expiryDate: { not: null } }, take: 50 }),
  ]);

  const lowStockItems = invItems
    .map(item => {
      const cur = (item.openingQty || 0) + (item.receivedQty || 0) - (item.issuedQty || 0);
      return { ...item, currentStock: cur };
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
  const spos = await prisma.salesPO.findMany({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 10 });
  const enriched = spos.map(p => ({ ...p, calc: calcSPO(p) }));
  res.json({ data: enriched });
});

exports.getTicker = asyncHandler(async (req, res) => {
  const [leads, spos, ar] = await Promise.all([
    prisma.lead.findMany({ where: { isDeleted: false } }),
    prisma.salesPO.findMany({ where: { isDeleted: false } }),
    prisma.aR.findMany({ where: { isDeleted: false } }),
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
