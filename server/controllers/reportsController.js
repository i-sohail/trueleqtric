// server/controllers/reportsController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const ExcelJS = require('exceljs');

const getOverdueDays = (dueDate, status) => {
  if (!dueDate || ['Received - Full','Written Off'].includes(status)) return 0;
  const diff = new Date() - new Date(dueDate);
  return diff > 0 ? Math.floor(diff / 86400000) : 0;
};

exports.getMISData = asyncHandler(async (req, res) => {
  const [leads, spos, ar, ap, customers, vendors] = await Promise.all([
    prisma.lead.findMany({ where: { isDeleted: false } }),
    prisma.salesPO.findMany({ where: { isDeleted: false } }),
    prisma.aR.findMany({ where: { isDeleted: false } }),
    prisma.aP.findMany({ where: { isDeleted: false } }),
    prisma.customer.findMany({ where: { isDeleted: false } }),
    prisma.vendor.findMany({ where: { isDeleted: false } }),
  ]);
  const totalRevenue = spos.reduce((s, p) => s + (p.rev||0), 0);
  const totalGM = spos.reduce((s, p) => s + (p.margin||0), 0);
  const pipeline = leads.filter(l => l.stage !== 'Closed Lost').reduce((s, l) => s + (l.estValue||0), 0);
  const overdueAR = ar.filter(a => getOverdueDays(a.dueDate, a.status) > 0).reduce((s, a) => s + ((a.invoiceAmt||0) - (a.amtReceived||0)), 0);
  res.json({
    generatedAt: new Date().toISOString(),
    summary: { totalRevenue, totalGM, avgMargin: totalRevenue > 0 ? totalGM/totalRevenue : 0, pipeline, overdueAR },
    counts: { leads: leads.length, spos: spos.length, customers: customers.length, vendors: vendors.length }
  });
});

exports.exportExcel = asyncHandler(async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Trueleqtric CRM';
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  const addSheet = (name, columns, rows) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    sheet.getRow(1).eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = headerFill; });
    rows.forEach(r => sheet.addRow(r));
    sheet.columns.forEach(col => { col.width = Math.max((col.header||'').length + 4, 14); });
  };
  const [leads, spos, ar, customers, vendors] = await Promise.all([
    prisma.lead.findMany({ where: { isDeleted: false } }),
    prisma.salesPO.findMany({ where: { isDeleted: false } }),
    prisma.aR.findMany({ where: { isDeleted: false } }),
    prisma.customer.findMany({ where: { isDeleted: false } }),
    prisma.vendor.findMany({ where: { isDeleted: false } }),
  ]);
  addSheet('Leads', [{header:'Lead ID',key:'leadId'},{header:'Customer',key:'customer'},{header:'Stage',key:'stage'},{header:'Est. Value',key:'estValue'},{header:'Sales Rep',key:'salesRep'},{header:'Priority',key:'priority'}], leads.map(l => ({ leadId:l.leadId, customer:l.customer, stage:l.stage, estValue:l.estValue, salesRep:l.salesRep, priority:l.priority })));
  addSheet('Sales Orders', [{header:'SPO ID',key:'spoId'},{header:'Customer',key:'customer'},{header:'Revenue',key:'rev'},{header:'Margin',key:'margin'},{header:'Status',key:'status'}], spos.map(p => ({ spoId:p.spoId, customer:p.customer, rev:p.rev, margin:p.margin, status:p.status })));
  addSheet('AR Receivables', [{header:'AR ID',key:'arId'},{header:'Customer',key:'customer'},{header:'Invoice Amt',key:'invoiceAmt'},{header:'Received',key:'amtReceived'},{header:'Status',key:'status'}], ar.map(a => ({ arId:a.arId, customer:a.customer, invoiceAmt:a.invoiceAmt, amtReceived:a.amtReceived, status:a.status })));
  addSheet('Customers', [{header:'ID',key:'customerId'},{header:'Name',key:'name'},{header:'Type',key:'type'},{header:'City',key:'city'},{header:'Rating',key:'rating'},{header:'Credit Limit',key:'creditLimit'}], customers.map(c => ({ customerId:c.customerId, name:c.name, type:c.type, city:c.city, rating:c.rating, creditLimit:c.creditLimit })));
  addSheet('Vendors', [{header:'ID',key:'vendorId'},{header:'Name',key:'name'},{header:'Category',key:'category'},{header:'City',key:'city'},{header:'Rating',key:'rating'}], vendors.map(v => ({ vendorId:v.vendorId, name:v.name, category:v.category, city:v.city, rating:v.rating })));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Trueleqtric_${new Date().toISOString().slice(0,10)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

exports.getDocumentHTML = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  let rec;
  if (type === 'quotation') {
    rec = await prisma.quotation.findUnique({ where: { id } });
  } else {
    rec = await prisma.salesPO.findUnique({ where: { id } });
  }
  if (!rec) return res.status(404).json({ error: 'Not found' });
  const customer = await prisma.customer.findFirst({ where: { name: rec.customer } });
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const docType = type === 'quotation' ? 'QUOTATION' : 'SALES ORDER';
  const docId = rec.quoteId || rec.spoId || '';
  const items = rec.items && rec.items.length > 0 ? rec.items : [{ product: rec.product||rec.sku, qty: rec.qty, unit: rec.unit, make: rec.make, unitPrice: rec.unitPrice, discount: rec.discount, gstRate: rec.gstRate }];
  const lineTotal = rec.lineTotal || 0;
  const gstAmt = rec.gstAmt || rec.gst || 0;
  const grandTotal = lineTotal + gstAmt;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docType} ${docId}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b;padding:20px}</style></head><body><h1>⚡ TRUELEQTRIC — ${docType}</h1><p>Doc ID: ${docId} | Customer: ${rec.customer} | Date: ${today}</p><p>Total: ₹${grandTotal.toLocaleString('en-IN')}</p></body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
