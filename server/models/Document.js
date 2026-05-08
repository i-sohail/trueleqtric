// server/models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  docId: { type: String, unique: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['Customer PO Scan','Bank Guarantee','Letter of Credit','Inspection Certificate',
      'Test Certificate','Insurance Policy','Warranty Card','Compliance Document',
      'Tender Document','GST Invoice','Delivery Challan','Other'],
    default: 'Other',
  },
  linkedType: {
    type: String,
    enum: ['salespo','procurement','leads','quotations','tenders','customers','vendors','ar','ap',''],
  },
  linkedTo: String,
  fileName: String,
  originalName: String,
  mimeType: String,
  fileSize: Number,
  filePath: String,
  uploadedDate: { type: Date, default: Date.now },
  notes: String,
  tags: [String],
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

documentSchema.pre('save', async function (next) {
  if (!this.docId) {
    const count = await mongoose.model('Document').countDocuments();
    this.docId = `DOC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

documentSchema.index({ title: 'text', category: 1 });
documentSchema.index({ linkedType: 1, linkedTo: 1 });

module.exports = mongoose.model('Document', documentSchema);
