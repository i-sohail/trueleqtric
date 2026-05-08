// server/utils/financials.js

/**
 * Calculate totals for a quotation or sales PO
 * Supports both single-item and multi-item (line items array)
 */
exports.calcQuote = (doc) => {
  if (doc.items && doc.items.length > 0) {
    let lineTotal = 0, gstAmt = 0, cost = 0;
    doc.items.forEach(it => {
      const net = (it.unitPrice || 0) * (1 - (it.discount || 0) / 100) * (it.qty || 0);
      const gstPct = parseFloat((it.gstRate || '0%').replace('%', '')) / 100;
      lineTotal += net;
      gstAmt += net * gstPct;
      cost += (it.unitCost || 0) * (it.qty || 0);
    });
    const total = lineTotal + gstAmt;
    const margin = lineTotal - cost;
    const marginPct = lineTotal > 0 ? margin / lineTotal : 0;
    return { netPrice: lineTotal / (doc.items[0]?.qty || 1), lineTotal, gstAmt, total, cost, margin, marginPct };
  }
  const netPrice = (doc.unitPrice || 0) * (1 - (doc.discount || 0) / 100);
  const lineTotal = netPrice * (doc.qty || 0);
  const gstPct = parseFloat((doc.gstRate || '0%').replace('%', '')) / 100;
  const gstAmt = lineTotal * gstPct;
  const total = lineTotal + gstAmt;
  const cost = (doc.unitCost || 0) * (doc.qty || 0);
  const margin = lineTotal - cost;
  const marginPct = lineTotal > 0 ? margin / lineTotal : 0;
  return { netPrice, lineTotal, gstAmt, total, cost, margin, marginPct };
};

exports.calcSPO = (po) => {
  if (po.items && po.items.length > 0) {
    let rev = 0, gst = 0, cost = 0;
    po.items.forEach(it => {
      const net = (it.unitPrice || 0) * (1 - (it.discount || 0) / 100) * (it.qty || 0);
      const gstPct = parseFloat((it.gstRate || '0%').replace('%', '')) / 100;
      rev += net; gst += net * gstPct; cost += (it.unitCost || 0) * (it.qty || 0);
    });
    const totalWithGst = rev + gst;
    const margin = rev - cost;
    const marginPct = rev > 0 ? margin / rev : 0;
    return { rev, gst, totalWithGst, cost, margin, marginPct };
  }
  const rev = (po.unitPrice || 0) * (po.qty || 0);
  const gstPct = parseFloat((po.gstRate || '0%').replace('%', '')) / 100;
  const gst = rev * gstPct;
  const totalWithGst = rev + gst;
  const cost = (po.unitCost || 0) * (po.qty || 0);
  const margin = rev - cost;
  const marginPct = rev > 0 ? margin / rev : 0;
  return { rev, gst, totalWithGst, cost, margin, marginPct };
};

exports.getOverdueDays = (dueDate, status) => {
  const closedStatuses = ['Received - Full', 'Written Off', 'Payment Done'];
  if (!dueDate || closedStatuses.includes(status)) return 0;
  return Math.max(0, Math.floor((new Date() - new Date(dueDate)) / 86400000));
};

exports.fmtCurrency = (v) => {
  if (v === undefined || v === null || isNaN(v)) return '—';
  const n = parseFloat(v);
  if (Math.abs(n) >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (Math.abs(n) >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

exports.getVendorRatingFromScore = (score) => {
  if (score >= 4.5) return 'A+ (Excellent)';
  if (score >= 3.5) return 'A (Very Good)';
  if (score >= 2.5) return 'B+ (Good)';
  if (score >= 1.5) return 'B (Average)';
  return 'C (Below Average)';
};
