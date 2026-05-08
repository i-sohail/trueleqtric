// server/models/Tender.js
const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  tenderId: { type: String, unique: true },
  title: { type: String, required: true },
  tenderNo: String,
  customer: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  type: {
    type: String,
    enum: ['Open Tender','Limited Tender','Single Tender','GeM Tender','Global Tender','Private RFQ'],
    default: 'Open Tender',
  },
  segment: String,
  region: String,
  status: {
    type: String,
    enum: ['Pre-Bid Prep','Bid Submitted','Under Evaluation','L1 / Lowest',
      'Technical Qualified','Negotiation','Awarded','Lost','Cancelled','Dropped'],
    default: 'Pre-Bid Prep',
  },
  salesRep: String,
  salesRepId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  linkedLead: String,
  linkedLeadRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  estimatedValue: Number,
  ourBidValue: Number,
  emdAmount: Number,
  emdMode: { type: String, enum: ['Demand Draft','Bank Guarantee','Online Payment','Exempted'] },
  emdRef: String,
  bidDate: Date,
  openDate: Date,
  resultDate: Date,
  linkedBG: String,
  linkedBGRef: { type: mongoose.Schema.Types.ObjectId, ref: 'BGLC' },
  checklist: {
    preBidMeeting: { type: Boolean, default: false },
    documentsDownloaded: { type: Boolean, default: false },
    emdArranged: { type: Boolean, default: false },
    technicalCompliance: { type: Boolean, default: false },
    commercialApproval: { type: Boolean, default: false },
    bidSubmitted: { type: Boolean, default: false },
    resultAwaited: { type: Boolean, default: false },
  },
  notes: String,
  tags: [String],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

tenderSchema.pre('save', async function (next) {
  if (!this.tenderId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Tender').countDocuments({ tenderId: new RegExp(`^TND-${year}-`) });
    this.tenderId = `TND-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

tenderSchema.index({ title: 'text', tenderNo: 'text', customer: 'text' });
tenderSchema.index({ status: 1, isDeleted: 1 });

module.exports = mongoose.model('Tender', tenderSchema);
