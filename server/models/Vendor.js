// server/models/Vendor.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['OEM / Manufacturer','Authorized Distributor','Trading Company',
      'Service Provider','Logistics Partner','Testing Lab','Inspection Agency'],
  },
  category: String,
  brands: String,
  gst: String,
  pan: String,
  contact: String,
  email: String,
  phone: String,
  city: String,
  region: String,
  leadTime: { type: Number, default: 30 },
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

vendorSchema.pre('save', async function (next) {
  if (!this.vendorId) {
    const count = await mongoose.model('Vendor').countDocuments();
    this.vendorId = `VEND-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

vendorSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('Vendor', vendorSchema);
