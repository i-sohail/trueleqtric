// server/models/Catalog.js
const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
  sku: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  subCat: String,
  segment: String,
  make: String,
  unit: { type: String, default: 'Nos.' },
  hsn: String,
  gstRate: { type: String, default: '18%' },
  costPrice: { type: Number, required: true, default: 0 },
  listPrice: { type: Number, required: true, default: 0 },
  minPrice: { type: Number, default: 0 },
  warranty: String,
  specs: String,
  priceHistory: [{
    date: { type: Date, default: Date.now },
    costPrice: Number,
    listPrice: Number,
    minPrice: Number,
    note: String,
    changedBy: String,
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

catalogSchema.pre('save', async function (next) {
  if (!this.sku) {
    const count = await mongoose.model('Catalog').countDocuments();
    const catCode = (this.category || 'GEN').replace(/[^A-Z]/gi, '').slice(0,3).toUpperCase();
    this.sku = `SKU-${catCode}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

catalogSchema.index({ name: 'text', sku: 'text', category: 'text' });

module.exports = mongoose.model('Catalog', catalogSchema);
