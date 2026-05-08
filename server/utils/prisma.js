// server/utils/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient().$extends({
  result: {
    $allModels: {
      _id: {
        needs: { id: true },
        compute(model) {
          return model.id;
        },
      },
    },
  },
});

module.exports = prisma;
