// server/controllers/vendorScoresController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

const getVendorRatingFromScore = (score) => {
  if (score >= 90) return 'A+ (Excellent)';
  if (score >= 75) return 'A (Very Good)';
  if (score >= 60) return 'B+ (Good)';
  if (score >= 45) return 'B (Average)';
  return 'C (Below Average)';
};

exports.getAll = asyncHandler(async (req, res) => {
  const { page=1, limit=500, search } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { vendorId: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.vendorScore.findMany({ where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit), orderBy: { reviewDate: 'desc' } }),
    prisma.vendorScore.count({ where }),
  ]);
  res.json({ data, total });
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await prisma.vendorScore.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ data: doc });
});

exports.create = asyncHandler(async (req, res) => {
  const review = await prisma.vendorScore.create({ data: req.body });
  if (review.vendorId && review.score) {
    const rating = getVendorRatingFromScore(review.score);
    await prisma.vendor.updateMany({ where: { id: review.vendorId }, data: { rating } });
  }
  res.status(201).json({ data: review, message: 'Review saved' });
});

exports.update = asyncHandler(async (req, res) => {
  const review = await prisma.vendorScore.update({ where: { id: req.params.id }, data: req.body });
  res.json({ data: review, message: 'Updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.vendorScore.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

exports.getVendorScorecard = asyncHandler(async (req, res) => {
  const vendors = await prisma.vendor.findMany({ where: { isDeleted: false } });
  const results = await Promise.all(vendors.map(async v => {
    const reviews = await prisma.vendorScore.findMany({ where: { vendorId: v.id }, orderBy: { reviewDate: 'desc' } });
    const avg = reviews.length ? reviews.reduce((s,r) => s + (r.score||0), 0) / reviews.length : null;
    return { ...v, reviews, avgScore: avg ? parseFloat(avg.toFixed(2)) : null, reviewCount: reviews.length };
  }));
  res.json({ data: results.sort((a,b) => (b.avgScore||0) - (a.avgScore||0)) });
});
