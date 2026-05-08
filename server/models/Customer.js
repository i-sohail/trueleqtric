// server/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['State Utility (DISCOM)','State Utility (TRANSCO)','Central PSU (CPSU)',
      'Private IPP','EPC Contractor','Industrial Consumer','Renewable Developer',
      'Government Department','Municipal Body','Railway / Metro','Defense',
      'Export Customer','Dealer / Distributor','System Integrator'],
  },
  segment: String,
  gst: { type: String, trim: true },
  pan: { type: String, trim: true },
  contact: String,
  email: String,
  phone: String,
  city: String,
  region: String,
  creditLimit: { type: Number, default: 0 },
  payTerms: { type: Number, default: 30 },
  currency: { type: String, default: 'INR' },
  rating: {
    type: String,
    enum: ['A+ (Excellent)','A (Very Good)','B+ (Good)','B (Average)','C (Below Average)','Blacklisted'],
    default: 'B+ (Good)',
  },
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `CUST-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

customerSchema.index({ name: 'text', gst: 'text', contact: 'text' });
customerSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Customer', customerSchema);
