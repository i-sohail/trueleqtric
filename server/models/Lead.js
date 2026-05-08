// server/models/Lead.js
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadId: { type: String, unique: true },
  customer: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  contact: String,
  segment: String,
  region: String,
  category: String,
  sku: String,
  skuRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalog' },
  qty: Number,
  unit: String,
  source: String,
  tenderRef: String,
  bidDate: Date,
  estValue: { type: Number, default: 0 },
  stage: {
    type: String,
    enum: ['New Enquiry','Qualified','Proposal Submitted','Negotiation',
      'PO Received','Closed Lost','On Hold','Repeat Order'],
    default: 'New Enquiry',
  },
  priority: {
    type: String,
    enum: ['Critical','High','Medium','Low'],
    default: 'Medium',
  },
  salesRep: String,
  salesRepId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  followUp: Date,
  notes: String,
  stageHistory: [{
    stage: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

leadSchema.pre('save', async function (next) {
  if (!this.leadId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Lead').countDocuments({ leadId: new RegExp(`^LD-${year}-`) });
    this.leadId = `LD-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

leadSchema.index({ customer: 'text', notes: 'text', tenderRef: 'text' });
leadSchema.index({ stage: 1, isDeleted: 1 });
leadSchema.index({ salesRep: 1 });

module.exports = mongoose.model('Lead', leadSchema);
