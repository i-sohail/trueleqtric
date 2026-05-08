// server/utils/softDelete.js
const prisma = require('./prisma');
const { v4: uuidv4 } = require('uuid');

const collectionToModel = {
  leads: 'lead',
  quotations: 'quotation',
  salespo: 'salesPO',
  procurement: 'procurement',
  inventory: 'inventory',
  delivery: 'delivery',
  ar: 'aR',
  ap: 'aP',
  customers: 'customer',
  vendors: 'vendor',
  catalog: 'catalog',
  bglc: 'bGLC',
  tenders: 'tender',
  documents: 'document',
  commissions: 'commission',
};

/**
 * Move a record to trash and soft-delete it
 * @param {string} id - UUID id
 * @param {string} collection - collection name (e.g. 'leads')
 * @param {string} deletedById - user id
 */
exports.softDelete = async (id, collection, deletedById) => {
  const modelName = collectionToModel[collection];
  if (!modelName) throw new Error(`Unknown collection: ${collection}`);

  const record = await prisma[modelName].findUnique({ where: { id } });
  if (!record) throw new Error('Record not found');

  const displayId = record[Object.keys(record).find(k => k.endsWith('Id') && k !== 'id')] || id;
  const displayName = record.name || record.customer || record.vendor || record.title || record.product || displayId;

  // Save to trash
  await prisma.trash.create({
    data: {
      trashId: `TRSH-${uuidv4().slice(0, 8).toUpperCase()}`,
      collection,
      originalId: id,
      displayId: String(displayId),
      deletedById,
    }
  });

  // Soft-delete
  const updated = await prisma[modelName].update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    }
  });

  return updated;
};

/**
 * Restore a record from trash
 */
exports.restoreFromTrash = async (id) => {
  const trashItem = await prisma.trash.findUnique({ where: { id } });
  if (!trashItem) throw new Error('Trash item not found');

  const modelName = collectionToModel[trashItem.collection];
  if (!modelName) throw new Error(`Unknown collection: ${trashItem.collection}`);

  await prisma[modelName].update({
    where: { id: trashItem.originalId },
    data: {
      isDeleted: false,
      deletedAt: null,
    }
  });

  await prisma.trash.delete({ where: { id } });
  return trashItem;
};
