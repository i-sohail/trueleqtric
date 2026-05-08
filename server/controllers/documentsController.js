// server/controllers/documentsController.js
const Document = require('../models/Document');
const asyncHandler = require('../middleware/asyncHandler');
const path = require('path');
const fs = require('fs');

exports.getAll = asyncHandler(async (req, res) => {
  const { search, category, linkedType, linkedTo } = req.query;
  const filter = { isDeleted: false };
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { category: { $regex: search, $options: 'i' } }];
  if (category) filter.category = category;
  if (linkedType) filter.linkedType = linkedType;
  if (linkedTo) filter.linkedTo = linkedTo;
  const docs = await Document.find(filter).sort({ createdAt: -1 });
  res.json({ data: docs, total: docs.length });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ data: doc });
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { title, category, linkedType, linkedTo, notes, tags } = req.body;
  const doc = await Document.create({
    title: title || req.file.originalname,
    category: category || 'Other',
    linkedType, linkedTo, notes,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    filePath: req.file.path,
    createdBy: req.user._id,
  });
  res.status(201).json({ data: doc, message: 'Document uploaded' });
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Document.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false }, req.body, { new: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc, message: 'Updated' });
});

exports.download = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc || !doc.filePath) return res.status(404).json({ error: 'File not found' });
  if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'File missing on server' });
  res.download(doc.filePath, doc.originalName);
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, isDeleted: false });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();
  res.json({ message: 'Document deleted' });
});
