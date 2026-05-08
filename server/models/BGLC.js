// server/models/BGLC.js
const mongoose = require('mongoose');

const bglcSchema = new mongoose.Schema({
  bglcId: { type: String, unique: true },
  type: { type: String, enum: ['Bank Guarantee','Letter of Credit'], required: true },
  direction: { type: String, enum: ['Outgoing','Incoming'], required: true },
  instrument: {
    type: String,
    enum: ['Performance BG','Advance Payment BG','Security Deposit BG','Bid Bond BG',
      'Usance LC','Sight LC','Standby LC'],
  },
  status: {
    type: String,
    enum: ['Active','Expired','Invoked','Released','Cancelled'],
    default: 'Active',
  },
  bgNo: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  marginMoney: { type: Number, default: 0 },
  bank: { type: String, required: true },
  branchCity: String,
  issueDate: Date,
  expiryDate: Date,
  renewalAlert: { type: Number, default: 30 },
  linkedType: { type: String, enum: ['salespo','procurement','tenders','leads',''] },
  linkedTo: String,
  linkedRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'linkedType' },
  beneficiary: String,
  purpose: String,
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

bglcSchema.virtual('daysToExpiry').get(function () {
  if (!this.expiryDate) return null;
  return Math.ceil((new Date(this.expiryDate) - new Date()) / 86400000);
});
bglcSchema.virtual('isExpiringSoon').get(function () {
  const days = this.daysToExpiry;
  return days !== null && days >= 0 && days <= (this.renewalAlert || 30);
});

bglcSchema.set('toJSON', { virtuals: true });

bglcSchema.pre('save', async function (next) {
  if (!this.bglcId) {
    const prefix = this.type === 'Bank Guarantee' ? 'BG' : 'LC';
    const year = new Date().getFullYear();
    const count = await mongoose.model('BGLC').countDocuments({ bglcId: new RegExp(`^${prefix}-${year}-`) });
    this.bglcId = `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

bglcSchema.index({ status: 1, expiryDate: 1 });

module.exports = mongoose.model('BGLC', bglcSchema);
