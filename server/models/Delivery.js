// server/models/Delivery.js
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  delId: { type: String, unique: true },
  spoId: String,
  spoRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPO' },
  customer: String,
  sku: String,
  product: String,
  qtyDispatched: { type: Number, required: true },
  dispValue: { type: Number, default: 0 },
  contractedDate: Date,
  dispatchDate: Date,
  actualDelivery: Date,
  transMode: String,
  transporter: String,
  lrNo: String,
  vehicleNo: String,
  weight: Number,
  insRef: String,
  status: {
    type: String,
    enum: ['Pending','Packing','Ready to Dispatch','In Transit',
      'Delivered - Pending POD','Delivered - POD Received','Installation Pending',
      'Commissioned','Overdue','On Hold - Site Not Ready','Cancelled'],
    default: 'Pending',
  },
  podReceived: { type: Boolean, default: false },
  podDate: Date,
  ldRate: { type: Number, default: 0 },
  ldDays: { type: Number, default: 0 },
  ldAmount: { type: Number, default: 0 },
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

deliverySchema.virtual('isOverdue').get(function () {
  if (!this.contractedDate || this.actualDelivery) return false;
  const done = ['Delivered - POD Received','Delivered - Pending POD','Cancelled'];
  return !done.includes(this.status) && new Date(this.contractedDate) < new Date();
});

deliverySchema.set('toJSON', { virtuals: true });

deliverySchema.pre('save', async function (next) {
  if (!this.delId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Delivery').countDocuments({ delId: new RegExp(`^DEL-${year}-`) });
    this.delId = `DEL-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

deliverySchema.index({ status: 1, isDeleted: 1 });
deliverySchema.index({ spoRef: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
