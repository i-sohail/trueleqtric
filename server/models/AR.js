// server/models/AR.js
const mongoose = require('mongoose');

const arSchema = new mongoose.Schema({
  arId: { type: String, unique: true },
  customer: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  spoId: String,
  spoRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPO' },
  invoiceNo: { type: String, required: true },
  invoiceDate: Date,
  dueDate: Date,
  milestone: String,
  invoiceAmt: { type: Number, required: true, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  amtReceived: { type: Number, default: 0 },
  receivedDate: Date,
  status: {
    type: String,
    enum: ['Pending','Received - Full','Received - Partial','Overdue',
      'Disputed','Written Off','Advance Adjusted'],
    default: 'Pending',
  },
  payMode: String,
  txnRef: String,
  salesRep: String,
  salesRepId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  paymentHistory: [{
    amount: Number,
    date: Date,
    mode: String,
    ref: String,
    recordedBy: String,
    recordedAt: { type: Date, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

arSchema.virtual('outstanding').get(function () {
  return (this.invoiceAmt || 0) - (this.amtReceived || 0);
});
arSchema.virtual('overdueDays').get(function () {
  if (!this.dueDate || ['Received - Full','Written Off'].includes(this.status)) return 0;
  return Math.max(0, Math.floor((new Date() - new Date(this.dueDate)) / 86400000));
});

arSchema.set('toJSON', { virtuals: true });

arSchema.pre('save', async function (next) {
  if (!this.arId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('AR').countDocuments({ arId: new RegExp(`^AR-${year}-`) });
    this.arId = `AR-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

arSchema.index({ customer: 'text', invoiceNo: 'text' });
arSchema.index({ status: 1, dueDate: 1, isDeleted: 1 });
arSchema.index({ customerId: 1 });

module.exports = mongoose.model('AR', arSchema);
