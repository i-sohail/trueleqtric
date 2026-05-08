// server/controllers/listsController.js
const DropdownList = require('../models/DropdownList');
const asyncHandler = require('../middleware/asyncHandler');

const DEFAULT_LISTS = {
  leadStages: ['New Enquiry','Qualified','Proposal Submitted','Negotiation','PO Received','Closed Lost','On Hold','Repeat Order'],
  segments: ['Power Transmission','Power Distribution','Industrial Power','Renewable - Solar','Renewable - Wind','Renewable - Hydro','Energy Storage / BESS','EV Charging Infrastructure','Green Hydrogen','Smart Grid / AMI','Substations','Railways / Metro','Oil & Gas','Data Centers'],
  prodCategories: ['Transformers','Switchgear & Protection','Cables & Conductors','Meters & Instrumentation','Surge Protection & Earthing','Substation Equipment','Solar PV Panels','Solar Inverters','Solar BOS & Accessories','Wind Components','Battery Storage Systems','EV Charging Equipment','Green Hydrogen Equipment','Power Electronics','AMC & Service Contracts','Commissioning Services','Testing & Inspection','Survey & Feasibility','Spare Parts & Consumables'],
  custTypes: ['State Utility (DISCOM)','State Utility (TRANSCO)','Central PSU (CPSU)','Private IPP','EPC Contractor','Industrial Consumer','Renewable Developer','Government Department','Municipal Body','Railway / Metro','Defense','Export Customer','Dealer / Distributor','System Integrator'],
  vendorTypes: ['OEM / Manufacturer','Authorized Distributor','Trading Company','Service Provider','Logistics Partner','Testing Lab','Inspection Agency'],
  poStatuses: ['Order Confirmed','Procurement Initiated','Procurement Done','In Stock','Packing & Dispatch','In Transit','Delivered','Installation Done','Commissioned','Invoiced','Payment Pending','Closed'],
  payStatuses: ['Pending','Received - Full','Received - Partial','Overdue','Disputed','Written Off','Advance Adjusted'],
  payModes: ['RTGS','NEFT','IMPS','Cheque','Demand Draft','Letter of Credit','Bank Guarantee','Online Portal (GeM/CPPP)','UPI'],
  delStatuses: ['Pending','Packing','Ready to Dispatch','In Transit','Delivered - Pending POD','Delivered - POD Received','Installation Pending','Commissioned','Overdue','On Hold - Site Not Ready','Cancelled'],
  currencies: ['INR','USD','EUR','AED','GBP','SGD'],
  gstRates: ['0%','5%','12%','18%','28%'],
  units: ['Nos.','Sets','Kits','MT','KG','Meters','KM','KVA','KW','KWp','MWp','KWh','MWh','LS (Lump Sum)','Man-Days','Lot','Hours'],
  priorities: ['Critical','High','Medium','Low'],
  incoterms: ['EX-WORKS','FOR Destination','FOR Dispatch','C&F','CIF','DDP','DAP','FOB'],
  salesReps: ['Vikram Nair','Priya Sinha','Rahul Mehra','Anjali Kapoor','Suresh Iyer','Deepika Rao','Manish Gupta','Kavya Reddy','Arjun Bose','Sneha Tiwari'],
  quoteStatuses: ['Draft','Submitted','Under Review','Revised','Accepted','Rejected','Expired','Converted to PO'],
  procStatuses: ['Enquiry Sent','Quotes Received','PO Raised','Partial Delivery','Fully Delivered','Invoice Pending','Payment Done','Cancelled'],
  transModes: ['Road - Truck','Road - Trailer (ODC)','Rail','Sea Freight - FCL','Sea Freight - LCL','Air Freight','Courier','Hand Carry','Multi-Modal'],
  regions: ['Delhi NCR','Mumbai','Chennai','Kolkata','Bengaluru','Hyderabad','Ahmedabad','Pune','Jaipur','Lucknow','Bhopal','Chandigarh','North India','South India','East India','West India','Central India','Pan India','Export - SAARC','Export - SEA','Export - Middle East','Export - Africa'],
  ratings: ['A+ (Excellent)','A (Very Good)','B+ (Good)','B (Average)','C (Below Average)','Blacklisted'],
  buyers: ['Rajesh Kumar','Sanjay Mehta','Neha Sharma','Amit Joshi','Pooja Nair','Ravi Verma','Swati Das','Mohan Pillai'],
  warehouses: ['Delhi Warehouse','Mumbai Warehouse','Pune Warehouse','Chennai Warehouse','Bengaluru Warehouse'],
  bgTypes: ['Performance BG','Advance Payment BG','Bid Security BG','Warranty BG','Retention Money BG'],
  lcTypes: ['Sight LC','Usance LC','Revolving LC','Back-to-Back LC','Standby LC'],
  tenderTypes: ['Open Tender','Limited Tender','Single Tender','GEM Portal','CPPP','Private Tender'],
  tenderStatuses: ['Under Preparation','Bid Submitted','Technical Evaluation','Financial Evaluation','L1 / Selected','Lost','Cancelled','Repeat Order Expected'],
  commTypes: ['Trading Margin','Commission on Revenue','Flat Fee','Success Fee'],
  docCategories: ['Customer PO Scan','Bank Guarantee','Letter of Credit','Inspection Certificate','Test Certificate','Insurance Policy','Warranty Card','Compliance Document','Tender Document','GST Invoice','Delivery Challan','Other'],
  paymentTermsOptions: ['100% Advance','30% Advance + 70% against Invoice','50% Advance + 50% on Delivery','Letter of Credit at Sight','Net 30 days','Net 45 days','Net 60 days','Net 90 days','Milestone-based as per schedule'],
  ldTerms: ['0.5% per week, max 5%','0.5% per week, max 10%','1% per week, max 5%','No LD clause'],
  warrantyTerms: ['12 months from date of commissioning','24 months from date of commissioning','12 months from date of delivery','24 months from date of delivery','As per OEM warranty'],
};

exports.getAll = asyncHandler(async (req, res) => {
  const dbLists = await DropdownList.find({});
  const result = { ...DEFAULT_LISTS };
  dbLists.forEach(l => { result[l.key] = l.values; });
  res.json({ data: result });
});

exports.updateList = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { values } = req.body;
  const list = await DropdownList.findOneAndUpdate(
    { key },
    { values, updatedBy: req.user._id },
    { upsert: true, new: true }
  );
  res.json({ data: list, message: 'List updated' });
});

exports.addValue = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const list = await DropdownList.findOneAndUpdate(
    { key },
    { $addToSet: { values: value }, updatedBy: req.user._id },
    { upsert: true, new: true }
  );
  res.json({ data: list, message: 'Value added' });
});

exports.removeValue = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const list = await DropdownList.findOneAndUpdate(
    { key },
    { $pull: { values: value }, updatedBy: req.user._id },
    { new: true }
  );
  res.json({ data: list, message: 'Value removed' });
});
