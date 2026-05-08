// server/models/VendorScore.js
const mongoose = require('mongoose');

const vendorScoreSchema = new mongoose.Schema({
  reviewId: { type: String, unique: true },
  vendor: { type: String, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  procId: String,
  procRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Procurement' },
  reviewDate: { type: Date, default: Date.now },
  reviewedBy: String,
  reviewedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qualityScore: { type: Number, min: 1, max: 5, default: 3 },
  onTimeScore: { type: Number, min: 1, max: 5, default: 3 },
  documentationScore: { type: Number, min: 1, max: 5, default: 3 },
  responsivenessScore: { type: Number, min: 1, max: 5, default: 3 },
  overallScore: { type: Number, min: 1, max: 5 },
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vendorScoreSchema.pre('save', async function (next) {
  // Auto-compute overall score
  const scores = [this.qualityScore, this.onTimeScore, this.documentationScore, this.responsivenessScore].filter(Boolean);
  if (scores.length) {
    this.overallScore = parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2));
  }
  if (!this.reviewId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('VendorScore').countDocuments({ reviewId: new RegExp(`^VR-${year}-`) });
    this.reviewId = `VR-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

vendorScoreSchema.index({ vendorId: 1 });

module.exports = mongoose.model('VendorScore', vendorScoreSchema);
