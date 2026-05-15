const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Roles
  console.log('Seeding Roles...');
  const roles = ['admin', 'sales', 'buyer', 'manager'];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r, isSystem: true, description: `${r.toUpperCase()} Role` }
    });
  }
  const salesRole = await prisma.role.findUnique({ where: { name: 'sales' } });

  // 2. Users (Admin + Sales Reps)
  console.log('Seeding Users...');
  const hashedPass = await bcrypt.hash('admin123', 12);
  
  // Admin user (we preserve this or recreate it if missing)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trueleqtric.com' },
    update: {},
    create: {
      userId: 'USR-0001',
      name: 'System',
      surname: 'Admin',
      username: 'admin',
      email: 'admin@trueleqtric.com',
      password: hashedPass,
      role: 'admin'
    }
  });

  // Sales Reps
  const reps = [];
  for (let i = 1; i <= 5; i++) {
    const rep = await prisma.user.upsert({
      where: { email: `rep${i}@trueleqtric.com` },
      update: {},
      create: {
        userId: `USR-${1000 + i}`,
        name: `Sales`,
        surname: `Rep ${i}`,
        username: `rep${i}`,
        email: `rep${i}@trueleqtric.com`,
        password: hashedPass,
        role: 'sales',
        roleId: salesRole.id
      }
    });
    reps.push(rep);
  }

  // 3. Customers
  console.log('Seeding Customers...');
  const customers = [];
  for (let i = 1; i <= 15; i++) {
    const cust = await prisma.customer.upsert({
      where: { customerId: `CUST-10${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        customerId: `CUST-10${i.toString().padStart(2, '0')}`,
        name: `Enterprise Client ${i} Ltd`,
        type: i % 2 === 0 ? 'B2B' : 'B2G',
        segment: ['Industrial', 'Commercial', 'Residential', 'Government'][i % 4],
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai'][i % 5],
        email: `contact@enterprise${i}.com`,
        phone: `+91 987654321${i % 10}`,
        creditLimit: 500000 + (i * 50000),
        rating: i % 3 === 0 ? 'A (Excellent)' : 'B+ (Good)'
      }
    });
    customers.push(cust);
  }

  // 4. Vendors
  console.log('Seeding Vendors...');
  const vendors = [];
  for (let i = 1; i <= 12; i++) {
    const vend = await prisma.vendor.upsert({
      where: { vendorId: `VEND-20${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        vendorId: `VEND-20${i.toString().padStart(2, '0')}`,
        name: `Global Supplier ${i} Inc`,
        category: ['Electronics', 'Cables', 'Transformers', 'Switchgears'][i % 4],
        city: ['Ahmedabad', 'Surat', 'Hyderabad', 'Kolkata'][i % 4],
        email: `sales@supplier${i}.com`,
        leadTime: 15 + (i * 2),
        rating: i % 2 === 0 ? 'A (Excellent)' : 'B (Average)'
      }
    });
    vendors.push(vend);
  }

  // 5. Catalog & Inventory
  console.log('Seeding Catalog & Inventory...');
  const catalogItems = [];
  for (let i = 1; i <= 20; i++) {
    const cat = await prisma.catalog.upsert({
      where: { sku: `SKU-30${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        sku: `SKU-30${i.toString().padStart(2, '0')}`,
        name: `Industrial Equipment Product ${i}`,
        category: ['Switchgear', 'Transformer', 'Cables', 'Motors', 'Sensors'][i % 5],
        make: ['Siemens', 'ABB', 'Schneider', 'L&T', 'Havells'][i % 5],
        costPrice: 1000 + (i * 200),
        listPrice: 1500 + (i * 300),
        gstRate: '18%',
        unit: 'Nos.'
      }
    });
    catalogItems.push(cat);

    // Initial Inventory
    await prisma.inventory.upsert({
      where: { invId: `INV-${cat.sku}` },
      update: {},
      create: {
        invId: `INV-${cat.sku}`,
        sku: cat.sku,
        skuId: cat.id,
        product: cat.name,
        category: cat.category,
        make: cat.make,
        openingQty: 100 + (i * 10),
        receivedQty: 50,
        issuedQty: 20 + i,
        reorderLevel: 30
      }
    });
  }

  // 6. CRM (Leads, Quotations, SalesPOs)
  console.log('Seeding CRM Workflow...');
  for (let i = 1; i <= 15; i++) {
    const cust = customers[i % customers.length];
    const rep = reps[i % reps.length];
    const cat = catalogItems[i % catalogItems.length];
    
    const qty = 5 + i;
    const estValue = qty * cat.listPrice;
    
    // Lead
    const lead = await prisma.lead.upsert({
      where: { leadId: `LD-40${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        leadId: `LD-40${i.toString().padStart(2, '0')}`,
        customer: cust.name,
        customerId: cust.id,
        stage: ['New Enquiry', 'Quoted', 'Negotiation', 'Won'][i % 4],
        sku: cat.sku,
        skuId: cat.id,
        qty: qty,
        estValue: estValue,
        salesRep: rep.name,
        salesRepId: rep.id
      }
    });

    if (i % 2 !== 0) {
      // Quote for some leads
      const discount = 5;
      const unitPrice = cat.listPrice * 0.95;
      const lineTotal = qty * unitPrice;
      const quote = await prisma.quotation.upsert({
        where: { quoteId: `QT-50${i.toString().padStart(2, '0')}` },
        update: {},
        create: {
          quoteId: `QT-50${i.toString().padStart(2, '0')}`,
          customer: cust.name,
          customerId: cust.id,
          leadId: lead.leadId,
          leadRefId: lead.id,
          sku: cat.sku,
          product: cat.name,
          qty: qty,
          unitCost: cat.costPrice,
          unitPrice: unitPrice,
          discount: discount,
          lineTotal: lineTotal,
          total: lineTotal * 1.18, // + 18% GST
          status: ['Draft', 'Sent', 'Accepted'][i % 3],
          salesRep: rep.name,
          salesRepId: rep.id
        }
      });

      if (quote.status === 'Accepted') {
        // SalesPO for accepted quotes
        const spo = await prisma.salesPO.upsert({
          where: { spoId: `SPO-60${i.toString().padStart(2, '0')}` },
          update: {},
          create: {
            spoId: `SPO-60${i.toString().padStart(2, '0')}`,
            customer: cust.name,
            customerId: cust.id,
            quoteId: quote.quoteId,
            quoteRefId: quote.id,
            sku: cat.sku,
            product: cat.name,
            qty: qty,
            unitPrice: unitPrice,
            totalWithGst: lineTotal * 1.18,
            cost: cat.costPrice * qty,
            margin: (unitPrice - cat.costPrice) * qty,
            status: ['Order Confirmed', 'In Production', 'Dispatched', 'Delivered'][i % 4],
            salesRep: rep.name,
            salesRepId: rep.id
          }
        });

        // Accounts Receivable (AR) for this SPO
        await prisma.aR.create({
          data: {
            arId: `AR-${spo.spoId}`,
            customer: cust.name,
            customerId: cust.id,
            spoId: spo.spoId,
            spoRef: spo.id,
            invoiceAmt: spo.totalWithGst,
            amtReceived: i % 3 === 0 ? spo.totalWithGst : 0, // Some paid, some pending
            status: i % 3 === 0 ? 'Paid' : 'Pending',
            salesRep: rep.name,
            dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        });
      }
    }
  }

  // 7. Procurement & AP Workflow
  console.log('Seeding Procurement & AP Workflow...');
  for (let i = 1; i <= 12; i++) {
    const vend = vendors[i % vendors.length];
    const cat = catalogItems[(i + 5) % catalogItems.length];
    const qty = 50 + i * 10;
    
    const proc = await prisma.procurement.upsert({
      where: { procId: `PR-70${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        procId: `PR-70${i.toString().padStart(2, '0')}`,
        vendor: vend.name,
        vendorId: vend.id,
        sku: cat.sku,
        product: cat.name,
        qty: qty,
        unitCost: cat.costPrice,
        status: ['Enquiry Sent', 'PO Raised', 'Material Received'][i % 3],
      }
    });

    if (proc.status === 'Material Received') {
      // Accounts Payable (AP)
      const invoiceAmt = qty * cat.costPrice * 1.18;
      await prisma.aP.create({
        data: {
          apId: `AP-${proc.procId}`,
          vendor: vend.name,
          vendorId: vend.id,
          procId: proc.procId,
          procRef: proc.id,
          invoiceAmt: invoiceAmt,
          amtPaid: i % 2 === 0 ? invoiceAmt : invoiceAmt * 0.5,
          status: i % 2 === 0 ? 'Paid' : 'Partial',
          dueDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 8. Tenders
  console.log('Seeding Tenders...');
  for (let i = 1; i <= 10; i++) {
    const cust = customers[i % customers.length];
    await prisma.tender.upsert({
      where: { tenderId: `TND-80${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        tenderId: `TND-80${i.toString().padStart(2, '0')}`,
        title: `Supply of Electrical Goods - Project ${i}`,
        tenderNo: `GOV/TND/2026/${i}`,
        customer: cust.name,
        customerId: cust.id,
        status: ['Pre-Bid Prep', 'Submitted', 'Won', 'Lost'][i % 4],
        estimatedValue: 1000000 + (i * 200000),
        bidDate: new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
