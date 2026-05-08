// server/controllers/analyticsController.js
const asyncHandler = require('../middleware/asyncHandler');
const Lead = require('../models/Lead');
const SalesPO = require('../models/SalesPO');
const AR = require('../models/AR');
const { calcSPO, getOverdueDays } = require('../utils/financials');

exports.getOverview = asyncHandler(async (req, res) => {
  const [leads, spos, ar] = await Promise.all([Lead.find({isDeleted:false}), SalesPO.find({isDeleted:false}), AR.find({isDeleted:false})]);
  const totalRev = spos.reduce((s,p)=>s+calcSPO(p).rev,0);
  const totalGM = spos.reduce((s,p)=>s+calcSPO(p).margin,0);
  const avgMargin = totalRev>0?totalGM/totalRev:0;
  const pipeline = leads.filter(l=>l.stage!=='Closed Lost').reduce((s,l)=>s+(l.estValue||0),0);
  const overdueAR = ar.filter(a=>getOverdueDays(a.dueDate,a.status)>0).reduce((s,a)=>s+((a.invoiceAmt||0)-(a.amtReceived||0)),0);
  res.json({ totalRev, totalGM, avgMargin, pipeline, overdueAR });
});

exports.getMonthlyTrend = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year)||new Date().getFullYear();
  const [spos,leads] = await Promise.all([
    SalesPO.find({isDeleted:false, poDate:{$gte:new Date(`${year}-01-01`),$lte:new Date(`${year}-12-31`)}}),
    Lead.find({isDeleted:false, date:{$gte:new Date(`${year}-01-01`),$lte:new Date(`${year}-12-31`)}})
  ]);
  const months = {};
  for (let m=1;m<=12;m++) { const k=`${year}-${String(m).padStart(2,'0')}`; months[k]={label:new Date(year,m-1).toLocaleString('en',{month:'short'}),rev:0,margin:0,leads:0}; }
  spos.forEach(p=>{if(!p.poDate)return;const k=p.poDate.toISOString().slice(0,7);if(months[k]){const c=calcSPO(p);months[k].rev+=c.rev;months[k].margin+=c.margin;}});
  leads.forEach(l=>{if(!l.date)return;const k=new Date(l.date).toISOString().slice(0,7);if(months[k])months[k].leads++;});
  res.json({ data: Object.values(months) });
});

exports.getARAging = asyncHandler(async (req, res) => {
  const records = await AR.find({isDeleted:false});
  const aging={Current:0,'1-30d':0,'31-60d':0,'61-90d':0,'90+d':0};
  records.forEach(a=>{const od=getOverdueDays(a.dueDate,a.status);const bal=(a.invoiceAmt||0)-(a.amtReceived||0);if(od===0)aging.Current+=bal;else if(od<=30)aging['1-30d']+=bal;else if(od<=60)aging['31-60d']+=bal;else if(od<=90)aging['61-90d']+=bal;else aging['90+d']+=bal;});
  res.json({ data: aging });
});

exports.getCategoryRevenue = asyncHandler(async (req, res) => {
  const spos = await SalesPO.find({isDeleted:false});
  const cats = {};
  spos.forEach(p=>{const cat=p.category||'Other';const c=calcSPO(p);if(!cats[cat])cats[cat]={rev:0,margin:0,count:0};cats[cat].rev+=c.rev;cats[cat].margin+=c.margin;cats[cat].count++;});
  const data = Object.entries(cats).map(([category,d])=>({category,rev:d.rev,margin:d.margin,marginPct:d.rev>0?d.margin/d.rev:0,count:d.count})).sort((a,b)=>b.rev-a.rev);
  res.json({ data });
});

exports.getSalesRepScoreboard = asyncHandler(async (req, res) => {
  const [leads,spos] = await Promise.all([Lead.find({isDeleted:false}), SalesPO.find({isDeleted:false})]);
  const reps = {};
  leads.forEach(l=>{const r=l.salesRep||'Unassigned';if(!reps[r])reps[r]={leads:0,won:0,pipeline:0,revenue:0};reps[r].leads++;if(l.stage==='PO Received')reps[r].won++;reps[r].pipeline+=(l.estValue||0);});
  spos.forEach(p=>{const r=p.salesRep||'Unassigned';if(!reps[r])reps[r]={leads:0,won:0,pipeline:0,revenue:0};reps[r].revenue+=calcSPO(p).rev;});
  const data = Object.entries(reps).map(([rep,d])=>({rep,...d,winRate:d.leads>0?d.won/d.leads:0})).sort((a,b)=>b.revenue-a.revenue);
  res.json({ data });
});

exports.getForecast = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const spos = await SalesPO.find({isDeleted:false, poDate:{$gte:new Date(`${year}-01-01`)}});
  const monthly = {};
  for (let m=1;m<=12;m++){const k=`${year}-${String(m).padStart(2,'0')}`;monthly[k]={label:new Date(year,m-1).toLocaleString('en',{month:'short'}),rev:0};}
  spos.forEach(p=>{if(!p.poDate)return;const k=p.poDate.toISOString().slice(0,7);if(monthly[k])monthly[k].rev+=calcSPO(p).rev;});
  const revArr = Object.values(monthly).map(m=>m.rev);
  const forecast = ['Oct','Nov','Dec'].map((label,i)=>{const w=revArr.slice(Math.max(0,i+5),i+8);return {label,value:w.length?w.reduce((s,v)=>s+v,0)/w.length:0};});
  res.json({ monthly: Object.values(monthly), forecast });
});

exports.getMarginWaterfall = asyncHandler(async (req, res) => {
  const spos = await SalesPO.find({isDeleted:false}).sort({createdAt:-1}).limit(10);
  const data = spos.map(p=>{
    const c=calcSPO(p);const freightCost=p.freightCost||0;const ldDeduction=p.ldDeduction||0;
    const actualMargin=c.margin-freightCost-ldDeduction;const leakage=c.margin-actualMargin;
    return {id:p.spoId,customer:p.customer,rev:c.rev,margin:c.margin,marginPct:c.marginPct,freightCost,ldDeduction,actualMargin,leakage,actualPct:c.rev>0?actualMargin/c.rev:0};
  });
  res.json({ data });
});

exports.getLeadFunnel = asyncHandler(async (req, res) => {
  const leads = await Lead.find({isDeleted:false});
  const stages = ['New Enquiry','Qualified','Proposal Submitted','Negotiation','PO Received','Closed Lost'];
  const now = new Date();
  const result = stages.map(stage=>{
    const sl = leads.filter(l=>l.stage===stage);
    const avgDays = sl.length ? Math.round(sl.reduce((s,l)=>s+(l.date?Math.floor((now-new Date(l.date))/86400000):0),0)/sl.length) : 0;
    return {stage, count:sl.length, value:sl.reduce((s,l)=>s+(l.estValue||0),0), avgDays};
  });
  const stuckLeads = leads.filter(l=>!['PO Received','Closed Lost'].includes(l.stage)&&l.date&&Math.floor((now-new Date(l.date))/86400000)>30);
  res.json({ data: result, stuckLeads: stuckLeads.slice(0,10) });
});

exports.getInsights = asyncHandler(async (req, res) => {
  const [leads,spos,ar] = await Promise.all([Lead.find({isDeleted:false}), SalesPO.find({isDeleted:false}), AR.find({isDeleted:false})]);
  const insights = [];
  const totalRev = spos.reduce((s,p)=>s+calcSPO(p).rev,0);
  const totalGM = spos.reduce((s,p)=>s+calcSPO(p).margin,0);
  const avgMargin = totalRev>0?totalGM/totalRev:0;
  const overdueAR = ar.filter(a=>getOverdueDays(a.dueDate,a.status)>0).reduce((s,a)=>s+((a.invoiceAmt||0)-(a.amtReceived||0)),0);
  if (avgMargin>0.2) insights.push({icon:'📈',title:'Strong Margins',text:`Average margin of ${(avgMargin*100).toFixed(1)}% is above the 20% target.`,color:'green'});
  else insights.push({icon:'⚠',title:'Low Margins Alert',text:`Average margin of ${(avgMargin*100).toFixed(1)}% needs improvement.`,color:'amber'});
  if (overdueAR>0) insights.push({icon:'💰',title:'Overdue Receivables',text:`₹${(overdueAR/100000).toFixed(2)}L in AR is overdue. Initiate follow-up.`,color:'red'});
  const critLeads = leads.filter(l=>l.priority==='Critical'&&!['PO Received','Closed Lost'].includes(l.stage));
  if (critLeads.length) insights.push({icon:'🚨',title:'Critical Leads Pending',text:`${critLeads.length} critical lead(s) need immediate follow-up.`,color:'amber'});
  const wonLeads = leads.filter(l=>l.stage==='PO Received').length;
  const winRate = leads.length?wonLeads/leads.length:0;
  insights.push({icon:winRate>0.3?'🏆':'📊',title:`Win Rate: ${(winRate*100).toFixed(1)}%`,text:`${wonLeads} of ${leads.length} leads converted to orders.`,color:winRate>0.3?'green':'blue'});
  res.json({ data: insights });
});
