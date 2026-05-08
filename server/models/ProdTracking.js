// server/models/ProdTracking.js
const mongoose = require('mongoose');

const prodTrackingSchema = new mongoose.Schema({
  trackId: { type: String, unique: true },
  spoId: String,
  spoRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPO' },
  vendor: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  product: String,
  category: String,
  qtyOrdered: Number,
  unit: String,
  productionStart: Date,
  expectedCompletion: Date,
  actualCompletion: Date,
  status: {
    type: String,
    enum: ['Pending','In Production','QC Inspection','Ready to Dispatch','Dispatched','Completed','On Hold','Cancelled'],
    default: 'Pending',
  },
  qcStatus: {
    type: String,
    enum: ['Pending','Under Inspection','Approved','Rejected'],
    default: 'Pending',
  },
  inspector: String,
  inspectionDate: Date,
  progressPct: { type: Number, default: 0, min: 0, max: 100 },
  milestones: [{
    name: String,
    targetDate: Date,
    completedDate: Date,
    status: { type: String, enum: ['Pending','Done','Delayed'], default: 'Pending' },
  }],
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

prodTrackingSchema.pre('save', async function (next) {
  if (!this.trackId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('ProdTracking').countDocuments({ trackId: new RegExp(`^PT-${year}-`) });
    this.trackId = `PT-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

prodTrackingSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('ProdTracking', prodTrackingSchema);
