// server/models/Procurement.js
const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  sku: String,
  product: String,
  category: String,
  qty: Number,
  unit: String,
  make: String,
  unitCost: Number,
  gstRate: String,
}, { _id: false });

const procurementSchema = new mongoose.Schema({
  procId: { type: String, unique: true },
  vendor: { type: String, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  salesPORef: String,
  salesPOId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPO' },
  items: [lineItemSchema],
  sku: String,
  product: String,
  category: String,
  qty: Number,
  unit: String,
  make: String,
  unitCost: Number,
  gstRate: { type: String, default: '18%' },
  purDate: Date,
  expDelivery: Date,
  actualDelivery: Date,
  status: {
    type: String,
    enum: ['Enquiry Sent','Quotes Received','PO Raised','Partial Delivery',
      'Fully Delivered','Invoice Pending','Payment Done','Cancelled'],
    default: 'Enquiry Sent',
  },
  buyer: String,
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

procurementSchema.pre('save', async function (next) {
  if (!this.procId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Procurement').countDocuments({ procId: new RegExp(`^PPO-${year}-`) });
    this.procId = `PPO-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

procurementSchema.index({ vendor: 'text', procId: 'text' });
procurementSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('Procurement', procurementSchema);
