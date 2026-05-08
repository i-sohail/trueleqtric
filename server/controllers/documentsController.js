// server/controllers/documentsController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');
const path = require('path');
const fs = require('fs');

exports.getAll = asyncHandler(async (req, res) => {
  const { search, category, linkedType, linkedTo } = req.query;
  const filter = { isDeleted: false };
  if (category) filter.category = category;
  if (linkedType) filter.linkedType = linkedType;
  if (linkedTo) filter.linkedTo = linkedTo;
  if (search) {
    filter.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }
  const docs = await prisma.document.findMany({ where: filter, orderBy: { createdAt: 'desc' } });
  res.json({ data: docs, total: docs.length });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.document.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ data: doc });
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { title, category, linkedType, linkedTo, notes, tags } = req.body;
  
  const count = await prisma.document.count();
  const docId = `DOC-${String(count + 1).padStart(4, '0')}`;
  
  const doc = await prisma.document.create({
    data: {
      docId,
      title: title || req.file.originalname,
      category: category || 'Other',
      linkedType, linkedTo, notes,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      createdById: req.user.id,
    }
  });
  res.status(201).json({ data: doc, message: 'Document uploaded' });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await prisma.document.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const doc = await prisma.document.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: doc, message: 'Updated' });
});

exports.download = asyncHandler(async (req, res) => {
  const doc = await prisma.document.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc || !doc.filePath) return res.status(404).json({ error: 'File not found' });
  if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'File missing on server' });
  res.download(doc.filePath, doc.originalName);
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await prisma.document.findFirst({ where: { id: req.params.id, isDeleted: false } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  await prisma.document.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date() } });
  res.json({ message: 'Document deleted' });
});
