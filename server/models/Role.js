// server/models/Role.js
const mongoose = require('mongoose');

// All CRM modules/pages that permissions apply to
const MODULES = [
  'dashboard','analytics','leads','quotations','salespo','procurement',
  'inventory','delivery','ar','ap','customers','vendors','catalog','pricing',
  'bglc','tenders','documents','paymentschedule','prodtracking','commissions',
  'vendorscores','creditmonitor','cashflow','lists','sellers','trash','access',
];

const permissionSchema = new mongoose.Schema({
  module: { type: String, enum: MODULES, required: true },
  read:   { type: Boolean, default: false },
  write:  { type: Boolean, default: false },  // create + update
  delete: { type: Boolean, default: false },
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  permissions: [permissionSchema],
  isSystem:    { type: Boolean, default: false }, // system roles can't be deleted
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-generate permissions array if not provided
roleSchema.pre('save', function (next) {
  if (!this.permissions || this.permissions.length === 0) {
    this.permissions = MODULES.map(m => ({ module: m, read: false, write: false, delete: false }));
  }
  next();
});

roleSchema.statics.MODULES = MODULES;

module.exports = mongoose.model('Role', roleSchema);
