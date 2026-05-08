// server/scripts/seed-prisma.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const ALL_MODULES = [
  'dashboard', 'analytics', 'leads', 'quotations', 'salespo', 'procurement',
  'inventory', 'delivery', 'ar', 'ap', 'customers', 'vendors', 'catalog', 'pricing',
  'bglc', 'tenders', 'documents', 'paymentschedule', 'prodtracking', 'commissions',
  'vendorscores', 'creditmonitor', 'cashflow', 'lists', 'sellers', 'trash', 'access',
];

const fullPerms = ALL_MODULES.map(m => ({ module: m, read: true, write: true, delete: true }));
const salesPerms = ALL_MODULES.map(m => ({ module: m, read: ['dashboard', 'analytics', 'leads', 'quotations', 'salespo', 'customers', 'catalog'].includes(m), write: ['leads', 'quotations', 'salespo'].includes(m), delete: false }));
const viewPerms = ALL_MODULES.map(m => ({ module: m, read: true, write: false, delete: false }));
const financePerms = ALL_MODULES.map(m => ({ module: m, read: true, write: ['ar', 'ap', 'commissions', 'creditmonitor', 'cashflow'].includes(m), delete: false }));

async function seed() {
  console.log('🚀 Starting Prisma Seed...');

  // 1. Clear existing data
  // Order matters due to foreign key constraints
  await prisma.trash.deleteMany();
  await prisma.task.deleteMany();
  await prisma.prodTracking.deleteMany();
  await prisma.paymentSchedule.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.bGLC.deleteMany();
  await prisma.aR.deleteMany();
  await prisma.aP.deleteMany();
  await prisma.procurement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.salesPO.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.catalog.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  console.log('🗑️  Database cleared');

  // 2. Create system roles
  const adminRole = await prisma.role.create({
    data: { name: 'Administrator', description: 'Full system access', permissions: fullPerms, isSystem: true }
  });
  const salesRole = await prisma.role.create({
    data: { name: 'Sales Executive', description: 'Access to commercial modules', permissions: salesPerms, isSystem: true }
  });
  const financeRole = await prisma.role.create({
    data: { name: 'Finance Manager', description: 'Finance and AR/AP access', permissions: financePerms, isSystem: true }
  });
  const viewerRole = await prisma.role.create({
    data: { name: 'Viewer', description: 'Read-only access to all modules', permissions: viewPerms, isSystem: true }
  });
  console.log('🔐 Roles created');

  // 3. Create users
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const hashedUserPassword = await bcrypt.hash('pass123', 12);

  const admin = await prisma.user.create({
    data: {
      userId: 'USR-0001',
      name: 'Admin',
      surname: 'User',
      username: 'admin',
      email: 'admin@trueleqtric.com',
      password: hashedAdminPassword,
      role: 'admin',
      roleId: adminRole.id,
      isActive: true,
      mobile: '+91-9999999999',
      country: 'India',
      city: 'New Delhi',
      region: 'Delhi NCR'
    }
  });

  const vikram = await prisma.user.create({
    data: {
      userId: 'USR-0002',
      name: 'Vikram',
      surname: 'Nair',
      username: 'vikram.nair',
      email: 'vikram@trueleqtric.com',
      password: hashedUserPassword,
      role: 'sales',
      roleId: salesRole.id,
      isActive: true,
      mobile: '+91-9876543210'
    }
  });

  const priya = await prisma.user.create({
    data: {
      userId: 'USR-0003',
      name: 'Priya',
      surname: 'Sinha',
      username: 'priya.sinha',
      email: 'priya@trueleqtric.com',
      password: hashedUserPassword,
      role: 'finance',
      roleId: financeRole.id,
      isActive: true
    }
  });
  console.log('👤 Users created');

  // 4. Customers
  const powergrid = await prisma.customer.create({
    data: { customerId: 'CUST-001', name: 'Powergrid Corp Ltd', type: 'Central PSU (CPSU)', segment: 'Power Transmission', gst: '07AAACN0025M1ZJ', contact: 'Rajesh Kumar', email: 'rajesh.k@powergrid.in', phone: '+91-11-26582222', city: 'New Delhi', region: 'Delhi NCR', creditLimit: 50000000, payTerms: 90, rating: 'A+ (Excellent)', createdById: admin.id }
  });

  const adani = await prisma.customer.create({
    data: { customerId: 'CUST-003', name: 'Adani Green Energy', type: 'Private IPP', segment: 'Renewable - Solar', contact: 'Sanjay Mehta', email: 'sanjay.m@adanigreen.com', city: 'Ahmedabad', region: 'Ahmedabad', creditLimit: 80000000, payTerms: 45, rating: 'A+ (Excellent)', createdById: admin.id }
  });
  console.log('🏢 Customers created');

  // 5. Vendors
  const bhel = await prisma.vendor.create({
    data: { vendorId: 'VEND-001', name: 'BHEL', type: 'OEM / Manufacturer', category: 'Transformers', contact: 'S.K. Sharma', email: 'sk.sharma@bhel.in', city: 'New Delhi', region: 'Delhi NCR', leadTime: 90, payTerms: 60, rating: 'A+ (Excellent)', createdById: admin.id }
  });
  console.log('🏭 Vendors created');

  // 6. Catalog
  const transformerSKU = await prisma.catalog.create({
    data: { sku: 'SKU-TRF-001', name: 'Distribution Transformer 100 kVA', category: 'Transformers', make: 'BHEL', unit: 'Nos.', hsn: '8504', gstRate: '18%', costPrice: 185000, listPrice: 260000, minPrice: 220000, warranty: '2 Years', specs: '100 kVA, 11kV/415V, ONAN', createdById: admin.id }
  });
  console.log('📦 Catalog created');

  // 7. Leads
  const lead1 = await prisma.lead.create({
    data: { leadId: 'LD-2025-001', customer: 'Adani Green Energy', customerId: adani.id, segment: 'Renewable - Solar', region: 'Ahmedabad', category: 'Solar PV Panels', sku: 'SKU-SOL-001', qty: 5000, unit: 'Nos.', source: 'Direct Enquiry', estValue: 82500000, stage: 'Negotiation', priority: 'Critical', salesRep: 'Vikram Nair', salesRepId: vikram.id, createdById: admin.id }
  });
  console.log('◇ Leads created');

  console.log('\n✅ Seed complete!');
  console.log('📧 admin@trueleqtric.com / admin123');
  console.log('📧 vikram@trueleqtric.com / pass123 (Sales)');
  console.log('📧 priya@trueleqtric.com  / pass123 (Finance)');
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
