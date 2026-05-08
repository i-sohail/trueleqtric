// server/controllers/sellersController.js
const asyncHandler = require('../middleware/asyncHandler');
const Vendor = require('../models/Vendor');

const SELLER_DATABASE = [
  { name:'BHEL',type:'OEM / Manufacturer',category:'Transformers',products:'Power Transformers, Distribution Transformers, Reactors',city:'New Delhi',region:'Delhi NCR',website:'https://www.bhel.com',email:'contact@bhel.com',phone:'+91-11-26172580',notes:'Largest Indian power equipment manufacturer' },
  { name:'Siemens India',type:'OEM / Manufacturer',category:'Switchgear & Protection',products:'MV/LV Switchgear, Protection Relays, Automation',city:'Mumbai',region:'Mumbai',website:'https://www.siemens.com/in',email:'',phone:'',notes:'German MNC, strong in industrial automation' },
  { name:'ABB India',type:'OEM / Manufacturer',category:'Switchgear & Protection',products:'HV/MV Switchgear, Transformers, Drives',city:'Bengaluru',region:'Bengaluru',website:'https://new.abb.com/in',email:'',phone:'',notes:'Swiss MNC, comprehensive power portfolio' },
  { name:'Waaree Energies',type:'OEM / Manufacturer',category:'Solar PV Panels',products:'Solar Panels, Modules, BIPV',city:'Surat',region:'Ahmedabad',website:'https://www.waaree.com',email:'info@waaree.com',phone:'+91-79-35001000',notes:"India's largest solar panel manufacturer" },
  { name:'Adani Solar',type:'OEM / Manufacturer',category:'Solar PV Panels',products:'Solar Cells, Modules, Integrated solutions',city:'Mundra',region:'Ahmedabad',website:'https://www.adanisolar.com',email:'',phone:'',notes:'Vertically integrated solar manufacturer' },
  { name:'Havells India',type:'OEM / Manufacturer',category:'Cables & Conductors',products:'LT/HT Cables, Wires, Switchgear, MCBs',city:'Noida',region:'Delhi NCR',website:'https://www.havells.com',email:'',phone:'',notes:'Leading electrical equipment manufacturer' },
  { name:'Polycab India',type:'OEM / Manufacturer',category:'Cables & Conductors',products:'Wires, Cables, FMEG products',city:'Mumbai',region:'Mumbai',website:'https://www.polycab.com',email:'',phone:'',notes:"India's largest cable manufacturer" },
  { name:'Hitachi Energy',type:'OEM / Manufacturer',category:'Transformers',products:'Power Transformers, HVDC, Grid Automation',city:'Bengaluru',region:'Bengaluru',website:'https://www.hitachienergy.com',email:'',phone:'',notes:'Formerly ABB Power Grids' },
  { name:'Tata Power Solar',type:'OEM / Manufacturer',category:'Solar PV Panels',products:'Solar Panels, EPC, Rooftop Solar',city:'Bengaluru',region:'Bengaluru',website:'https://www.tatapowersolar.com',email:'',phone:'',notes:'Tata Group solar arm' },
  { name:'Delta Electronics India',type:'OEM / Manufacturer',category:'Solar Inverters',products:'Solar Inverters, UPS, Power Electronics',city:'Gurgaon',region:'Delhi NCR',website:'https://www.deltaww.com/en-US/index',email:'',phone:'',notes:'Taiwanese MNC, strong inverter portfolio' },
  { name:'SMA India',type:'Authorized Distributor',category:'Solar Inverters',products:'String Inverters, Central Inverters, Storage',city:'Mumbai',region:'Mumbai',website:'https://www.sma.de/en',email:'',phone:'',notes:'German inverter specialist' },
  { name:'Luminous Power Technologies',type:'OEM / Manufacturer',category:'Battery Storage Systems',products:'Inverters, Batteries, Solar solutions',city:'Gurgaon',region:'Delhi NCR',website:'https://www.luminousindia.com',email:'',phone:'',notes:'Leading battery and inverter brand' },
  { name:'Exide Industries',type:'OEM / Manufacturer',category:'Battery Storage Systems',products:'Lead-acid batteries, Lithium batteries',city:'Kolkata',region:'Kolkata',website:'https://www.exideindustries.com',email:'',phone:'',notes:'India\'s largest battery maker' },
  { name:'Schneider Electric India',type:'OEM / Manufacturer',category:'Switchgear & Protection',products:'MV/LV switchgear, SCADA, Energy Management',city:'Bengaluru',region:'Bengaluru',website:'https://www.se.com/in',email:'',phone:'',notes:'French MNC, leader in energy management' },
  { name:'CG Power',type:'OEM / Manufacturer',category:'Transformers',products:'Power & Distribution Transformers, Motors',city:'Mumbai',region:'Mumbai',website:'https://www.cgpower.com',email:'',phone:'',notes:'Crompton Greaves, major transformer OEM' },
  { name:'Tata Nexarc',type:'Trading Company',category:'Solar BOS & Accessories',products:'Solar BOS, Mounting Structures, DC cables',city:'Mumbai',region:'Mumbai',website:'https://www.tatanexarc.com',email:'',phone:'',notes:'B2B platform for solar components' },
  { name:'KEI Industries',type:'OEM / Manufacturer',category:'Cables & Conductors',products:'EHV/HT/LT Cables, Stainless Steel Wires',city:'New Delhi',region:'Delhi NCR',website:'https://www.kei-ind.com',email:'',phone:'',notes:'Leading cable manufacturer, EHV specialty' },
  { name:'Finolex Cables',type:'OEM / Manufacturer',category:'Cables & Conductors',products:'Electrical Wires, Cables, Communication',city:'Pune',region:'Pune',website:'https://www.finolex.com',email:'',phone:'',notes:'Strong in house wiring segment' },
  { name:'Secure Meters',type:'OEM / Manufacturer',category:'Meters & Instrumentation',products:'Smart Meters, AMI, Energy Management',city:'Udaipur',region:'Jaipur',website:'https://www.securemeters.com',email:'',phone:'',notes:'Smart metering specialist, export-focused' },
  { name:'HPL Electric & Power',type:'OEM / Manufacturer',category:'Meters & Instrumentation',products:'Energy Meters, MCBs, LED Lighting',city:'Gurgaon',region:'Delhi NCR',website:'https://www.hplindia.com',email:'',phone:'',notes:'Listed company, metering & MCB' },
];

exports.getAll = asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  let results = SELLER_DATABASE;
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(s =>
      JSON.stringify(s).toLowerCase().includes(q)
    );
  }
  if (category) {
    results = results.filter(s => s.category === category);
  }
  res.json({ data: results, total: results.length });
});

exports.addAsVendor = asyncHandler(async (req, res) => {
  const { sellerIndex, ...extra } = req.body;
  const seller = SELLER_DATABASE[parseInt(sellerIndex)];
  if (!seller) return res.status(400).json({ error: 'Seller not found' });
  const vendor = await Vendor.create({
    name: seller.name,
    type: 'OEM / Manufacturer',
    category: seller.category,
    brands: seller.name,
    email: seller.email || '',
    phone: seller.phone || '',
    city: seller.city || '',
    region: seller.region || '',
    website: seller.website || '',
    notes: `Source: Seller Recommendations | ${seller.products || ''} | ${seller.website || ''}`,
    rating: 'B+ (Good)',
    leadTime: 30,
    payTerms: 30,
    currency: 'INR',
    createdBy: req.user._id,
    ...extra,
  });
  res.status(201).json({ data: vendor, message: `${seller.name} added as vendor` });
});
