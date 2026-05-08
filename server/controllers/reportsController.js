// server/controllers/reportsController.js
const asyncHandler = require('../middleware/asyncHandler');
const Lead = require('../models/Lead');
const SalesPO = require('../models/SalesPO');
const AR = require('../models/AR');
const AP = require('../models/AP');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const { calcSPO, calcQuote, getOverdueDays } = require('../utils/financials');
const ExcelJS = require('exceljs');

exports.getMISData = asyncHandler(async (req, res) => {
  const [leads, spos, ar, ap, customers, vendors] = await Promise.all([
    Lead.find({ isDeleted: false }),
    SalesPO.find({ isDeleted: false }),
    AR.find({ isDeleted: false }),
    AP.find({ isDeleted: false }),
    Customer.find({ isDeleted: false }),
    Vendor.find({ isDeleted: false }),
  ]);
  const totalRevenue = spos.reduce((s, p) => s + calcSPO(p).rev, 0);
  const totalGM = spos.reduce((s, p) => s + calcSPO(p).margin, 0);
  const pipeline = leads.filter(l => l.stage !== 'Closed Lost').reduce((s, l) => s + (l.estValue||0), 0);
  const overdueAR = ar.filter(a => getOverdueDays(a.dueDate, a.status) > 0).reduce((s, a) => s + ((a.invoiceAmt||0) - (a.amtReceived||0)), 0);
  res.json({ generatedAt: new Date().toISOString(), summary: { totalRevenue, totalGM, avgMargin: totalRevenue > 0 ? totalGM/totalRevenue : 0, pipeline, overdueAR }, counts: { leads: leads.length, spos: spos.length, customers: customers.length, vendors: vendors.length } });
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
    Lead.find({ isDeleted: false }),
    SalesPO.find({ isDeleted: false }),
    AR.find({ isDeleted: false }),
    Customer.find({ isDeleted: false }),
    Vendor.find({ isDeleted: false }),
  ]);
  addSheet('Leads', [{header:'Lead ID',key:'leadId'},{header:'Customer',key:'customer'},{header:'Stage',key:'stage'},{header:'Est. Value',key:'estValue'},{header:'Sales Rep',key:'salesRep'},{header:'Priority',key:'priority'}], leads.map(l => ({ leadId:l.leadId, customer:l.customer, stage:l.stage, estValue:l.estValue, salesRep:l.salesRep, priority:l.priority })));
  addSheet('Sales Orders', [{header:'SPO ID',key:'spoId'},{header:'Customer',key:'customer'},{header:'Revenue',key:'rev'},{header:'Margin',key:'margin'},{header:'Status',key:'status'}], spos.map(p => { const c = calcSPO(p); return { spoId:p.spoId, customer:p.customer, rev:c.rev, margin:c.margin, status:p.status }; }));
  addSheet('AR Receivables', [{header:'AR ID',key:'arId'},{header:'Customer',key:'customer'},{header:'Invoice No',key:'invoiceNo'},{header:'Invoice Amt',key:'invoiceAmt'},{header:'Received',key:'amtReceived'},{header:'Status',key:'status'}], ar.map(a => ({ arId:a.arId, customer:a.customer, invoiceNo:a.invoiceNo, invoiceAmt:a.invoiceAmt, amtReceived:a.amtReceived, status:a.status })));
  addSheet('Customers', [{header:'ID',key:'customerId'},{header:'Name',key:'name'},{header:'Type',key:'type'},{header:'City',key:'city'},{header:'Rating',key:'rating'},{header:'Credit Limit',key:'creditLimit'}], customers.map(c => ({ customerId:c.customerId, name:c.name, type:c.type, city:c.city, rating:c.rating, creditLimit:c.creditLimit })));
  addSheet('Vendors', [{header:'ID',key:'vendorId'},{header:'Name',key:'name'},{header:'Category',key:'category'},{header:'City',key:'city'},{header:'Rating',key:'rating'}], vendors.map(v => ({ vendorId:v.vendorId, name:v.name, category:v.category, city:v.city, rating:v.rating })));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Trueleqtric_${new Date().toISOString().slice(0,10)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

exports.getDocumentHTML = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  let rec, calc;
  if (type === 'quotation') {
    const Quotation = require('../models/Quotation');
    rec = await Quotation.findOne({ _id: id, isDeleted: false });
    if (!rec) return res.status(404).json({ error: 'Not found' });
    calc = calcQuote(rec.toObject());
  } else {
    rec = await SalesPO.findOne({ _id: id, isDeleted: false });
    if (!rec) return res.status(404).json({ error: 'Not found' });
    calc = calcSPO(rec.toObject());
  }
  const customer = await Customer.findOne({ name: rec.customer });
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const docType = type === 'quotation' ? 'QUOTATION' : 'SALES ORDER';
  const docId = rec.quoteId || rec.spoId || '';
  const items = rec.items && rec.items.length > 0 ? rec.items : [{ product: rec.product||rec.sku, qty: rec.qty, unit: rec.unit, make: rec.make, unitPrice: rec.unitPrice, discount: rec.discount, gstRate: rec.gstRate }];
  const lineTotal = calc.lineTotal || 0;
  const gstAmt = calc.gstAmt || calc.gst || 0;
  const grandTotal = lineTotal + gstAmt;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docType} ${docId}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1e293b}.page{max-width:820px;margin:0 auto;padding:32px 36px}.header{background:#1e3a5f;color:#fff;padding:18px 24px;display:flex;justify-content:space-between;border-radius:6px 6px 0 0}.meta-row{display:flex;gap:16px;margin:16px 0}.meta-box{flex:1;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:5px;padding:12px}.box-label{font-size:8pt;font-weight:700;color:#1e3a5f;text-transform:uppercase;margin-bottom:4px}.box-val{font-weight:600}h2{font-size:10pt;font-weight:700;color:#1e3a5f;text-transform:uppercase;margin:16px 0 8px;padding-bottom:4px;border-bottom:2px solid #e2e8f0}table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:#fff;padding:8px;font-size:9pt;text-align:left}td{padding:8px;border-bottom:1px solid #e2e8f0;font-size:10pt}.tr{text-align:right}.tot td{background:#1e3a5f!important;color:#fff;font-weight:700}.footer{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:8pt;color:#94a3b8}@media print{.page{padding:18px}}</style></head><body><div class="page"><div class="header"><div><div style="font-size:16pt;font-weight:700">⚡ TRUELEQTRIC</div><div style="font-size:9pt;color:#93c5fd">Power &amp; Renewable Energy Trading</div></div><div style="text-align:right"><div style="font-size:14pt;font-weight:700">${docType}</div><div style="color:#7dd3fc">${docId}</div></div></div><div class="meta-row"><div class="meta-box" style="flex:2"><div class="box-label">Bill To</div><div class="box-val">${rec.customer||'—'}</div>${customer?`<div style="font-size:9pt;color:#64748b;margin-top:3px">${customer.contact||''} | ${customer.email||''}</div>`:''}</div><div class="meta-box"><div class="box-label">Date</div><div class="box-val">${today}</div><div style="font-size:9pt;color:#64748b;margin-top:3px">${rec.validity?`Valid: ${rec.validity} days`:(rec.delivDate?`Delivery: ${new Date(rec.delivDate).toLocaleDateString('en-IN')}`:'' )}</div></div></div><h2>Line Items</h2><table><thead><tr><th>#</th><th>Product</th><th>Make</th><th class="tr">Qty</th><th>Unit</th><th class="tr">Unit Price (₹)</th><th class="tr">Disc%</th><th class="tr">Total (₹)</th></tr></thead><tbody>${items.map((it,i)=>{const net=(it.unitPrice||0)*(1-(it.discount||0)/100);const lt=net*(it.qty||0);return `<tr><td>${i+1}</td><td>${it.product||it.sku||'—'}</td><td>${it.make||'—'}</td><td class="tr">${it.qty||0}</td><td>${it.unit||''}</td><td class="tr">${(it.unitPrice||0).toLocaleString('en-IN')}</td><td class="tr">${it.discount||0}%</td><td class="tr">${lt.toLocaleString('en-IN')}</td></tr>`;}).join('')}<tr><td colspan="7" class="tr" style="font-weight:600;padding:8px">Subtotal</td><td class="tr">₹${lineTotal.toLocaleString('en-IN')}</td></tr><tr><td colspan="7" class="tr" style="padding:8px">GST</td><td class="tr">₹${gstAmt.toLocaleString('en-IN')}</td></tr><tr class="tot"><td colspan="7" class="tr">GRAND TOTAL</td><td class="tr">₹${grandTotal.toLocaleString('en-IN')}</td></tr></tbody></table>${rec.payTerms?`<h2>Payment Terms</h2><p style="font-size:10pt;color:#475569">${rec.payTerms}</p>`:''}<div class="footer">⚡ TRUELEQTRIC | Power &amp; Renewable Energy Trading | Computer Generated Document</div></div></body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
