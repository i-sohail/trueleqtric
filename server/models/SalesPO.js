// server/models/SalesPO.js
const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  sku: String,
  skuRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalog' },
  product: String,
  category: String,
  qty: { type: Number, default: 1 },
  unit: String,
  make: String,
  unitCost: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  gstRate: { type: String, default: '18%' },
}, { _id: false });

const salesPOSchema = new mongoose.Schema({
  spoId: { type: String, unique: true },
  customer: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  quoteId: String,
  quoteRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  items: [lineItemSchema],
  // Legacy single-item
  sku: String,
  product: String,
  category: String,
  qty: Number,
  unit: String,
  make: String,
  unitPrice: Number,
  unitCost: Number,
  gstRate: { type: String, default: '18%' },
  // Computed
  rev: Number,
  gst: Number,
  totalWithGst: Number,
  cost: Number,
  margin: Number,
  marginPct: Number,
  freightCost: { type: Number, default: 0 },
  ldDeduction: { type: Number, default: 0 },
  incoterm: String,
  poDate: Date,
  delivDate: Date,
  status: {
    type: String,
    enum: ['Order Confirmed','Procurement Initiated','Procurement Done','In Stock',
      'Packing & Dispatch','In Transit','Delivered','Installation Done',
      'Commissioned','Invoiced','Payment Pending','Closed','Cancelled'],
    default: 'Order Confirmed',
  },
  salesRep: String,
  salesRepId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentTerms: String,
  ldTerms: String,
  warrantyTerms: String,
  inspectionTerms: String,
  qualityStds: String,
  notes: String,
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

salesPOSchema.pre('save', async function (next) {
  if (!this.spoId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('SalesPO').countDocuments({ spoId: new RegExp(`^SPO-${year}-`) });
    this.spoId = `SPO-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

salesPOSchema.index({ customer: 'text', spoId: 'text' });
salesPOSchema.index({ status: 1, isDeleted: 1 });
salesPOSchema.index({ customerId: 1 });

module.exports = mongoose.model('SalesPO', salesPOSchema);
