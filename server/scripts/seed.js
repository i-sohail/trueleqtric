// server/scripts/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User  = require('../models/User');
const Role  = require('../models/Role');
const Customer  = require('../models/Customer');
const Vendor    = require('../models/Vendor');
const Catalog   = require('../models/Catalog');
const Lead      = require('../models/Lead');
const SalesPO   = require('../models/SalesPO');
const AR        = require('../models/AR');
const Inventory = require('../models/Inventory');

const ALL_MODULES = [
  'dashboard','analytics','leads','quotations','salespo','procurement',
  'inventory','delivery','ar','ap','customers','vendors','catalog','pricing',
  'bglc','tenders','documents','paymentschedule','prodtracking','commissions',
  'vendorscores','creditmonitor','cashflow','lists','sellers','trash','access',
];

const fullPerms  = ALL_MODULES.map(m => ({ module: m, read: true,  write: true,  delete: true  }));
const salesPerms = ALL_MODULES.map(m => ({ module: m, read: ['dashboard','analytics','leads','quotations','salespo','customers','catalog'].includes(m), write: ['leads','quotations','salespo'].includes(m), delete: false }));
const viewPerms  = ALL_MODULES.map(m => ({ module: m, read: true,  write: false, delete: false }));
const financePerms = ALL_MODULES.map(m => ({ module: m, read: true, write: ['ar','ap','commissions','creditmonitor','cashflow'].includes(m), delete: false }));

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  await Promise.all([User.deleteMany({}), Role.deleteMany({}), Customer.deleteMany({}), Vendor.deleteMany({}), Catalog.deleteMany({}), Lead.deleteMany({}), SalesPO.deleteMany({}), AR.deleteMany({}), Inventory.deleteMany({})]);
  console.log('🗑  Cleared');

  // Create system roles
  const [adminRole, salesRole, financeRole, viewerRole] = await Role.insertMany([
    { name: 'Administrator', description: 'Full system access', permissions: fullPerms, isSystem: true },
    { name: 'Sales Executive', description: 'Access to commercial modules', permissions: salesPerms, isSystem: true },
    { name: 'Finance Manager', description: 'Finance and AR/AP access', permissions: financePerms, isSystem: true },
    { name: 'Viewer', description: 'Read-only access to all modules', permissions: viewPerms, isSystem: true },
  ]);
  console.log('🔐 Roles created');

  // Create users
  const admin = await User.create({ name:'Admin', surname:'User', username:'admin', email:'admin@trueleqtric.com', password:'admin123', mobile:'+91-9999999999', country:'India', city:'New Delhi', region:'Delhi NCR', role:'admin', roleRef: adminRole._id, userId:'USR-0001' });
  await User.create({ name:'Vikram', surname:'Nair', username:'vikram.nair', email:'vikram@trueleqtric.com', password:'pass123', mobile:'+91-9876543210', country:'India', city:'Mumbai', region:'Mumbai', role:'sales', roleRef: salesRole._id });
  await User.create({ name:'Priya', surname:'Sinha', username:'priya.sinha', email:'priya@trueleqtric.com', password:'pass123', mobile:'+91-9876543211', country:'India', city:'New Delhi', region:'Delhi NCR', role:'finance', roleRef: financeRole._id });
  await User.create({ name:'Rahul', surname:'Mehra', username:'rahul.mehra', email:'rahul@trueleqtric.com', password:'pass123', mobile:'+91-9876543212', country:'India', city:'Bengaluru', region:'Bengaluru', role:'sales', roleRef: salesRole._id });
  console.log('👤 Users created');

  // Customers
  await Customer.insertMany([
    { customerId:'CUST-001', name:'Powergrid Corp Ltd', type:'Central PSU (CPSU)', segment:'Power Transmission', gst:'07AAACN0025M1ZJ', contact:'Rajesh Kumar', email:'rajesh.k@powergrid.in', phone:'+91-11-26582222', city:'New Delhi', region:'Delhi NCR', creditLimit:50000000, payTerms:90, rating:'A+ (Excellent)' },
    { customerId:'CUST-002', name:'MSEDCL', type:'State Utility (DISCOM)', segment:'Power Distribution', contact:'Priya Nair', email:'priya.n@msedcl.in', city:'Mumbai', region:'Mumbai', creditLimit:30000000, payTerms:60, rating:'A (Very Good)' },
    { customerId:'CUST-003', name:'Adani Green Energy', type:'Private IPP', segment:'Renewable - Solar', contact:'Sanjay Mehta', email:'sanjay.m@adanigreen.com', city:'Ahmedabad', region:'Ahmedabad', creditLimit:80000000, payTerms:45, rating:'A+ (Excellent)' },
    { customerId:'CUST-004', name:'Tata Power Renewable', type:'Private IPP', segment:'Renewable - Solar', contact:'Anjali Sharma', email:'anjali.s@tatapower.com', city:'Mumbai', region:'Mumbai', creditLimit:60000000, payTerms:45, rating:'A+ (Excellent)' },
    { customerId:'CUST-005', name:'NTPC Ltd', type:'Central PSU (CPSU)', segment:'Power Transmission', contact:'Anil Kumar', email:'anil.k@ntpc.co.in', city:'Noida', region:'Delhi NCR', creditLimit:100000000, payTerms:90, rating:'A+ (Excellent)' },
  ]);
  console.log('🏢 Customers created');

  await Vendor.insertMany([
    { vendorId:'VEND-001', name:'BHEL', type:'OEM / Manufacturer', category:'Transformers', contact:'S.K. Sharma', email:'sk.sharma@bhel.in', city:'New Delhi', region:'Delhi NCR', leadTime:90, payTerms:60, rating:'A+ (Excellent)' },
    { vendorId:'VEND-002', name:'Waaree Energies', type:'OEM / Manufacturer', category:'Solar PV Panels', contact:'Hitesh Shah', email:'hitesh@waaree.com', city:'Surat', region:'Ahmedabad', leadTime:30, payTerms:30, rating:'A (Very Good)' },
    { vendorId:'VEND-003', name:'KEI Industries', type:'OEM / Manufacturer', category:'Cables & Conductors', contact:'Anil Gupta', email:'anil@kei-ind.com', city:'New Delhi', region:'Delhi NCR', leadTime:45, payTerms:45, rating:'A (Very Good)' },
  ]);
  console.log('🏭 Vendors created');

  await Catalog.insertMany([
    { sku:'SKU-TRF-001', name:'Distribution Transformer 100 kVA', category:'Transformers', make:'BHEL', unit:'Nos.', hsn:'8504', gstRate:'18%', costPrice:185000, listPrice:260000, minPrice:220000, warranty:'2 Years', specs:'100 kVA, 11kV/415V, ONAN' },
    { sku:'SKU-SOL-001', name:'Solar Panel 540W Mono PERC', category:'Solar PV Panels', make:'Waaree', unit:'Nos.', hsn:'8541', gstRate:'5%', costPrice:12500, listPrice:16500, minPrice:14000, warranty:'25 Years', specs:'540W, Mono PERC' },
    { sku:'SKU-CAB-001', name:'HT Cable 11kV 3C 120 sqmm', category:'Cables & Conductors', make:'KEI', unit:'Meters', hsn:'8544', gstRate:'18%', costPrice:850, listPrice:1200, minPrice:1000, warranty:'1 Year', specs:'11kV, 3 Core, XLPE' },
  ]);
  console.log('📦 Catalog created');

  await Lead.insertMany([
    { leadId:'LD-2025-001', customer:'Adani Green Energy', segment:'Renewable - Solar', region:'Ahmedabad', category:'Solar PV Panels', sku:'SKU-SOL-001', qty:5000, unit:'Nos.', source:'Direct Enquiry', estValue:82500000, stage:'Negotiation', priority:'Critical', salesRep:'Vikram Nair' },
    { leadId:'LD-2025-002', customer:'Powergrid Corp Ltd', segment:'Power Transmission', region:'Delhi NCR', category:'Transformers', sku:'SKU-TRF-001', qty:5, unit:'Nos.', source:'Tender / e-Tender', estValue:25000000, stage:'Proposal Submitted', priority:'High', salesRep:'Rahul Mehra' },
    { leadId:'LD-2025-003', customer:'MSEDCL', segment:'Power Distribution', region:'Mumbai', category:'Cables & Conductors', sku:'SKU-CAB-001', qty:50000, unit:'Meters', source:'Repeat Customer', estValue:60000000, stage:'PO Received', priority:'High', salesRep:'Vikram Nair' },
  ]);
  console.log('◇ Leads created');

  console.log('\n✅ Seed complete!');
  console.log('📧 admin@trueleqtric.com / admin123');
  console.log('📧 vikram@trueleqtric.com / pass123 (Sales)');
  console.log('📧 priya@trueleqtric.com  / pass123 (Finance)');
  await mongoose.disconnect();
}
seed().catch(e => { console.error('❌', e); process.exit(1); });
