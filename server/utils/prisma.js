let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient().$extends({
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
} catch (e) {
  console.error('CRITICAL: Prisma Client failed to load. Ensure "prisma generate" has run.', e);
  // Export a proxy that throws on use to prevent early crashes
  prisma = new Proxy({}, {
    get: () => { throw new Error('Prisma Client not initialized. Check server logs.'); }
  });
}

module.exports = prisma;
