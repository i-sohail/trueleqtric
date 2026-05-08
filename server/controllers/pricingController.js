// server/controllers/pricingController.js
const Catalog = require('../models/Catalog');
const { crudFactory } = require('../utils/crudFactory');

const searchFields = ['name', 'sku', 'category'];
const crud = crudFactory(Catalog, 'pricing', 'sku', searchFields);

exports.getAll = crud.getAll;
exports.getOne = crud.getOne;
exports.create = crud.create;
exports.update = crud.update;
exports.remove = crud.remove;
