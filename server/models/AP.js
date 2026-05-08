// server/models/AP.js
const mongoose = require('mongoose');

const apSchema = new mongoose.Schema({
  apId: { type: String, unique: true },
  vendor: { type: String, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  procId: String,
  procRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Procurement' },
  vendorInvNo: { type: String, required: true },
  invDate: Date,
  dueDate: Date,
  milestone: String,
  invoiceAmt: { type: Number, required: true, default: 0 },
  gst: { type: Number, default: 0 },
  amtPaid: { type: Number, default: 0 },
  payDate: Date,
  status: {
    type: String,
    enum: ['Pending','Received - Full','Received - Partial','Overdue',
      'Payment Done','Disputed','Cancelled'],
    default: 'Pending',
  },
  payMode: String,
  bankRef: String,
  itcClaimed: { type: Boolean, default: false },
  approvedBy: String,
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

apSchema.virtual('outstanding').get(function () {
  return (this.invoiceAmt || 0) + (this.gst || 0) - (this.amtPaid || 0);
});
apSchema.virtual('overdueDays').get(function () {
  if (!this.dueDate || this.status === 'Payment Done') return 0;
  return Math.max(0, Math.floor((new Date() - new Date(this.dueDate)) / 86400000));
});

apSchema.set('toJSON', { virtuals: true });

apSchema.pre('save', async function (next) {
  if (!this.apId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('AP').countDocuments({ apId: new RegExp(`^AP-${year}-`) });
    this.apId = `AP-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

apSchema.index({ vendor: 'text', vendorInvNo: 'text' });
apSchema.index({ status: 1, dueDate: 1, isDeleted: 1 });

module.exports = mongoose.model('AP', apSchema);
