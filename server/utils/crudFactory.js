// server/utils/crudFactory.js
const asyncHandler = require('../middleware/asyncHandler');
const { softDelete } = require('./softDelete');

const buildCRUD = (Model, collectionName, searchFields = []) => {
  const buildFilter = (q) => {
    const { search, status, stage, region, category, salesRep, priority, startDate, endDate, dateField = 'createdAt' } = q;
    const filter = { isDeleted: false };
    if (search && searchFields.length) filter.$or = searchFields.map(f => ({ [f]: { $regex: search, $options: 'i' } }));
    if (status) filter.status = status;
    if (stage) filter.stage = stage;
    if (region) filter.region = region;
    if (category) filter.category = category;
    if (salesRep) filter.salesRep = salesRep;
    if (priority) filter.priority = priority;
    if (startDate || endDate) {
      filter[dateField] = {};
      if (startDate) filter[dateField].$gte = new Date(startDate);
      if (endDate) filter[dateField].$lte = new Date(endDate);
    }
    return filter;
  };

  return {
    getAll: asyncHandler(async (req, res) => {
      const { page = 1, limit = 200, sort = '-createdAt', ...rest } = req.query;
      const filter = buildFilter(rest);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [data, total] = await Promise.all([
        Model.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
        Model.countDocuments(filter),
      ]);
      res.json({ data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }),

    getOne: asyncHandler(async (req, res) => {
      const doc = await Model.findOne({ _id: req.params.id, isDeleted: false });
      if (!doc) return res.status(404).json({ error: 'Record not found' });
      res.json({ data: doc });
    }),

    create: asyncHandler(async (req, res) => {
      const doc = await Model.create({ ...req.body, createdBy: req.user._id });
      res.status(201).json({ data: doc, message: `${collectionName} created successfully` });
    }),

    update: asyncHandler(async (req, res) => {
      const doc = await Model.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { ...req.body },
        { new: true, runValidators: true }
      );
      if (!doc) return res.status(404).json({ error: 'Record not found' });
      res.json({ data: doc, message: `${collectionName} updated successfully` });
    }),

    remove: asyncHandler(async (req, res) => {
      await softDelete(Model, req.params.id, collectionName, req.user._id);
      res.json({ message: `${collectionName} moved to trash` });
    }),
  };
};

// Named export used by newer controllers
exports.createCRUD = buildCRUD;

// Named export used by pricingController and documentsController stubs
exports.crudFactory = (Model, collection, idField, searchFields = []) => buildCRUD(Model, collection, searchFields);
