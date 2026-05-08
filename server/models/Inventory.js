// server/models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  invId: { type: String, unique: true },
  sku: { type: String, required: true },
  skuRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Catalog' },
  product: String,
  category: String,
  make: String,
  unit: { type: String, default: 'Nos.' },
  warehouse: String,
  location: String,
  openingQty: { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 },
  issuedQty: { type: Number, default: 0 },
  reservedQty: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  reorderQty: { type: Number, default: 0 },
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

inventorySchema.virtual('currentStock').get(function () {
  return (this.openingQty || 0) + (this.receivedQty || 0) - (this.issuedQty || 0);
});
inventorySchema.virtual('availableStock').get(function () {
  return this.currentStock - (this.reservedQty || 0);
});
inventorySchema.virtual('stockStatus').get(function () {
  const cur = this.currentStock;
  if (cur <= 0) return 'Out of Stock';
  if (cur <= (this.reorderLevel || 0)) return 'Low Stock';
  return 'In Stock';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

inventorySchema.pre('save', async function (next) {
  if (!this.invId) {
    const count = await mongoose.model('Inventory').countDocuments();
    this.invId = `INV-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

inventorySchema.index({ sku: 1, isDeleted: 1 });
inventorySchema.index({ warehouse: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
