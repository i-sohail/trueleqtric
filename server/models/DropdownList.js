// server/models/DropdownList.js
const mongoose = require('mongoose');

const dropdownListSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: String,
  values: [String],
  isSystem: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('DropdownList', dropdownListSchema);
