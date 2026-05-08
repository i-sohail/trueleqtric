// server/utils/softDelete.js
const Trash = require('../models/Trash');

/**
 * Move a record to trash and soft-delete it
 * @param {Model} Model - Mongoose model
 * @param {string} id - MongoDB _id
 * @param {string} collection - collection name (e.g. 'leads')
 * @param {ObjectId} deletedBy - user id
 */
exports.softDelete = async (Model, id, collection, deletedBy) => {
  const record = await Model.findById(id);
  if (!record) throw new Error('Record not found');

  const displayId = record[Object.keys(record.toObject()).find(k => k.endsWith('Id') && k !== '_id')] || id;
  const displayName = record.name || record.customer || record.vendor || record.title || record.product || displayId;

  // Save to trash
  await Trash.create({
    collection,
    recordId: id.toString(),
    displayId,
    displayName,
    data: record.toObject(),
    deletedBy,
  });

  // Soft-delete
  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();

  return record;
};

/**
 * Restore a record from trash
 */
exports.restoreFromTrash = async (trashId) => {
  const trashItem = await Trash.findOne({ trashId });
  if (!trashItem) throw new Error('Trash item not found');

  const modelMap = {
    leads: require('../models/Lead'),
    quotations: require('../models/Quotation'),
    salespo: require('../models/SalesPO'),
    procurement: require('../models/Procurement'),
    inventory: require('../models/Inventory'),
    delivery: require('../models/Delivery'),
    ar: require('../models/AR'),
    ap: require('../models/AP'),
    customers: require('../models/Customer'),
    vendors: require('../models/Vendor'),
    catalog: require('../models/Catalog'),
    bglc: require('../models/BGLC'),
    tenders: require('../models/Tender'),
    documents: require('../models/Document'),
    commissions: require('../models/Commission'),
  };

  const Model = modelMap[trashItem.collection];
  if (!Model) throw new Error(`Unknown collection: ${trashItem.collection}`);

  await Model.findByIdAndUpdate(trashItem.recordId, {
    isDeleted: false,
    deletedAt: null,
  });

  await trashItem.deleteOne();
  return trashItem;
};
