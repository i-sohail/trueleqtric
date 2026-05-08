// server/models/Commission.js
const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  commissionId: { type: String, unique: true },
  spoId: String,
  spoRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPO' },
  vendor: String,
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  customer: String,
  product: String,
  orderValue: Number,
  commissionType: {
    type: String,
    enum: ['Trading Margin','Fixed Commission','% Commission','Brokerage','Success Fee'],
    default: 'Trading Margin',
  },
  commissionPct: { type: Number, default: 0 },
  commissionAmt: { type: Number, required: true },
  commissionBasis: String,
  status: {
    type: String,
    enum: ['Pending','Invoiced - Awaiting Payment','Received','Partially Received'],
    default: 'Pending',
  },
  invoiceRaised: { type: Boolean, default: false },
  invoiceNo: String,
  invoiceDate: Date,
  amtReceived: { type: Number, default: 0 },
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

commissionSchema.pre('save', async function (next) {
  if (!this.commissionId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Commission').countDocuments({ commissionId: new RegExp(`^COM-${year}-`) });
    this.commissionId = `COM-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Commission', commissionSchema);
