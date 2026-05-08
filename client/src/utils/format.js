// client/src/utils/format.js

export const fmtCurrency = (v) => {
  if (v === undefined || v === null || isNaN(v)) return '—'
  const n = parseFloat(v)
  if (Math.abs(n) >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr'
  if (Math.abs(n) >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L'
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export const fmtPct = (v) => {
  if (v === undefined || v === null) return '—'
  return (parseFloat(v) * 100).toFixed(1) + '%'
}

export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateInput = (d) => {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export const daysAgo = (d) => {
  if (!d) return 0
  return Math.floor((new Date() - new Date(d)) / 86400000)
}

export const getOverdueDays = (dueDate, status) => {
  const closed = ['Received - Full', 'Written Off', 'Payment Done']
  if (!dueDate || closed.includes(status)) return 0
  return Math.max(0, Math.floor((new Date() - new Date(dueDate)) / 86400000))
}

export const calcQuote = (doc) => {
  if (doc.items && doc.items.length > 0) {
    let lineTotal = 0, gstAmt = 0, cost = 0
    doc.items.forEach(it => {
      const net = (it.unitPrice || 0) * (1 - (it.discount || 0) / 100) * (it.qty || 0)
      const gstPct = parseFloat((it.gstRate || '0%').replace('%', '')) / 100
      lineTotal += net; gstAmt += net * gstPct; cost += (it.unitCost || 0) * (it.qty || 0)
    })
    const total = lineTotal + gstAmt, margin = lineTotal - cost, marginPct = lineTotal > 0 ? margin / lineTotal : 0
    return { lineTotal, gstAmt, total, cost, margin, marginPct }
  }
  const netPrice = (doc.unitPrice || 0) * (1 - (doc.discount || 0) / 100)
  const lineTotal = netPrice * (doc.qty || 0)
  const gstPct = parseFloat((doc.gstRate || '0%').replace('%', '')) / 100
  const gstAmt = lineTotal * gstPct, total = lineTotal + gstAmt
  const cost = (doc.unitCost || 0) * (doc.qty || 0)
  const margin = lineTotal - cost, marginPct = lineTotal > 0 ? margin / lineTotal : 0
  return { netPrice, lineTotal, gstAmt, total, cost, margin, marginPct }
}

export const calcSPO = (po) => {
  if (po.items && po.items.length > 0) {
    let rev = 0, gst = 0, cost = 0
    po.items.forEach(it => {
      const net = (it.unitPrice || 0) * (1 - (it.discount || 0) / 100) * (it.qty || 0)
      const gstPct = parseFloat((it.gstRate || '0%').replace('%', '')) / 100
      rev += net; gst += net * gstPct; cost += (it.unitCost || 0) * (it.qty || 0)
    })
    return { rev, gst, totalWithGst: rev + gst, cost, margin: rev - cost, marginPct: rev > 0 ? (rev - cost) / rev : 0 }
  }
  const rev = (po.unitPrice || 0) * (po.qty || 0)
  const gstPct = parseFloat((po.gstRate || '0%').replace('%', '')) / 100
  const gst = rev * gstPct, totalWithGst = rev + gst
  const cost = (po.unitCost || 0) * (po.qty || 0)
  return { rev, gst, totalWithGst, cost, margin: rev - cost, marginPct: rev > 0 ? (rev - cost) / rev : 0 }
}

export const getMarginClass = (pct) => {
  if (pct >= 0.2) return 'margin-high'
  if (pct >= 0.1) return 'margin-mid'
  if (pct >= 0) return 'margin-low'
  return 'margin-neg'
}

export const getStatusBadge = (status) => {
  const map = {
    'Active': 'badge-green', 'In Stock': 'badge-green', 'Delivered': 'badge-green',
    'Commissioned': 'badge-green', 'Awarded': 'badge-green', 'Payment Done': 'badge-green',
    'Received - Full': 'badge-green', 'Closed': 'badge-green',
    'Pending': 'badge-amber', 'In Transit': 'badge-blue', 'Draft': 'badge-gray',
    'Submitted': 'badge-blue', 'PO Raised': 'badge-blue', 'Order Confirmed': 'badge-blue',
    'Overdue': 'badge-red', 'Expired': 'badge-red', 'Lost': 'badge-red',
    'Closed Lost': 'badge-red', 'Out of Stock': 'badge-red', 'Cancelled': 'badge-red',
    'Low Stock': 'badge-amber', 'Negotiation': 'badge-purple',
    'Proposal Submitted': 'badge-blue', 'New Enquiry': 'badge-gray',
    'Qualified': 'badge-blue', 'PO Received': 'badge-green',
  }
  return map[status] || 'badge-gray'
}

export const truncate = (str, n = 30) => str && str.length > n ? str.slice(0, n) + '…' : (str || '—')

export const generateId = (prefix) => `${prefix}-${Date.now()}`
