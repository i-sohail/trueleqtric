// server/models/Quotation.js
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
  lineTotal: Number,
  gstAmount: Number,
  margin: Number,
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  quoteId: { type: String, unique: true },
  customer: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  leadId: String,
  leadRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  items: [lineItemSchema],
  // Legacy single-item fields (backward compat)
  sku: String,
  product: String,
  category: String,
  qty: Number,
  unit: String,
  make: String,
  unitCost: Number,
  unitPrice: Number,
  discount: { type: Number, default: 0 },
  gstRate: { type: String, default: '18%' },
  // Computed totals
  netPrice: Number,
  lineTotal: Number,
  gstAmt: Number,
  total: Number,
  margin: Number,
  marginPct: Number,
  validity: { type: Number, default: 30 },
  status: {
    type: String,
    enum: ['Draft','Submitted','Under Review','Revised','Accepted',
      'Rejected','Expired','Converted to PO'],
    default: 'Draft',
  },
  salesRep: String,
  salesRepId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  delivTerms: String,
  payTerms: String,
  incoterm: String,
  warranty: String,
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

quotationSchema.pre('save', async function (next) {
  if (!this.quoteId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Quotation').countDocuments({ quoteId: new RegExp(`^QT-${year}-`) });
    this.quoteId = `QT-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

quotationSchema.index({ customer: 'text', quoteId: 'text' });
quotationSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
