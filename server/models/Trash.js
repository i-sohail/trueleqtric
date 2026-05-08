// server/models/Trash.js
const mongoose = require('mongoose');

const trashSchema = new mongoose.Schema({
  trashId: { type: String, unique: true },
  collection: { type: String, required: true },
  recordId: String,
  displayId: String,
  displayName: String,
  data: mongoose.Schema.Types.Mixed,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
}, { timestamps: true });

// TTL index — auto-purge after 30 days
trashSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

trashSchema.pre('save', async function (next) {
  if (!this.trashId) {
    const count = await mongoose.model('Trash').countDocuments();
    this.trashId = `TRH-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Trash', trashSchema);
