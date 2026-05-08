// client/src/pages/Tenders.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tendersApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { title:'', tenderNo:'', customer:'', type:'Open Tender', segment:'', region:'', status:'Pre-Bid Prep', salesRep:'', linkedLead:'', estimatedValue:'', ourBidValue:'', emdAmount:'', emdMode:'Demand Draft', emdRef:'', bidDate:'', openDate:'', resultDate:'', linkedBG:'', checklist:{ preBidMeeting:false, documentsDownloaded:false, emdArranged:false, technicalCompliance:false, commercialApproval:false, bidSubmitted:false, resultAwaited:false }, notes:'', tags:'' }

export default function Tenders() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['tenders'], queryFn:()=>tendersApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['tenders-stats'], queryFn: tendersApi.getStats })
  const save = useMutation({ mutationFn: d=>modal.isEditing?tendersApi.update(modal.editId,d):tendersApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['tenders']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: tendersApi.remove, onSuccess:()=>{ qc.invalidateQueries(['tenders']); toast.success('Moved to trash') } })

  const checklistItems = [
    { key:'preBidMeeting', label:'Pre-Bid Meeting Done' },
    { key:'documentsDownloaded', label:'Tender Documents Downloaded' },
    { key:'emdArranged', label:'EMD Arranged' },
    { key:'technicalCompliance', label:'Technical Compliance Checked' },
    { key:'commercialApproval', label:'Commercial Approval Obtained' },
    { key:'bidSubmitted', label:'Bid Submitted' },
    { key:'resultAwaited', label:'Result Awaited' },
  ]

  const getChecklistPct = (cl) => {
    if (!cl) return 0
    const done = Object.values(cl).filter(Boolean).length
    return Math.round(done / checklistItems.length * 100)
  }

  const columns = [
    { key:'tenderId', label:'Tender ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'title', label:'Title', render:(v,r)=><div><div style={{fontWeight:500,fontSize:12}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.tenderNo||''} · {r.customer||''}</div></div> },
    { key:'type', label:'Type', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{v}</span> },
    { key:'estimatedValue', label:'Est. Value', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'ourBidValue', label:'Our Bid', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)'}}>{fmtCurrency(v)}</span> },
    { key:'bidDate', label:'Bid Date', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'checklist', label:'Progress', render:v=>{
      const pct = getChecklistPct(v)
      return <div style={{display:'flex',alignItems:'center',gap:6}}>
        <div style={{flex:1,background:'var(--bg3)',borderRadius:3,height:5,minWidth:60}}><div style={{width:`${pct}%`,height:'100%',borderRadius:3,background:pct===100?'var(--green)':'var(--blue)'}} /></div>
        <span style={{fontSize:10,color:'var(--text3)'}}>{pct}%</span>
      </div>
    }},
    { key:'salesRep', label:'Rep', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Tender Management" icon="📋" subtitle="Track tenders, bids, EMD, and win/loss analysis" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Tender</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Active Tenders" value={String(stats?.active||0)} sub="in progress" icon="📋" accent="var(--blue)" />
      </div>
      <DataTable title="All Tenders" icon="📋" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Pre-Bid Prep','Bid Submitted','Under Evaluation','L1 / Lowest','Awarded','Lost']}
        onRowClick={modal.openEdit} searchPlaceholder="Search tenders..." />
      <Modal open={modal.open} onClose={modal.close} icon="📋" size="lg" title={modal.isEditing?'Edit Tender':'New Tender'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Tender Identity</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Tender Title <span className="req">*</span></label><input className="form-input" value={modal.form.title} onChange={e=>modal.set('title',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Tender No.</label><input className="form-input" value={modal.form.tenderNo} onChange={e=>modal.set('tenderNo',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Customer / Authority <span className="req">*</span></label><input className="form-input" value={modal.form.customer} onChange={e=>modal.set('customer',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Type</label><select className="form-select" value={modal.form.type} onChange={e=>modal.set('type',e.target.value)}>{['Open Tender','Limited Tender','Single Tender','GeM Tender','Global Tender','Private RFQ'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Segment</label><select className="form-select" value={modal.form.segment} onChange={e=>modal.set('segment',e.target.value)}><option value="">— Select —</option>{(lists.segments||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Region</label><select className="form-select" value={modal.form.region} onChange={e=>modal.set('region',e.target.value)}><option value="">— Select —</option>{(lists.regions||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{['Pre-Bid Prep','Bid Submitted','Under Evaluation','L1 / Lowest','Technical Qualified','Negotiation','Awarded','Lost','Cancelled','Dropped'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Sales Rep</label><select className="form-select" value={modal.form.salesRep} onChange={e=>modal.set('salesRep',e.target.value)}><option value="">— Select —</option>{(lists.salesReps||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Commercial</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Estimated Value (₹)</label><input className="form-input" type="number" value={modal.form.estimatedValue} onChange={e=>modal.set('estimatedValue',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Our Bid Value (₹)</label><input className="form-input" type="number" value={modal.form.ourBidValue} onChange={e=>modal.set('ourBidValue',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">EMD Amount (₹)</label><input className="form-input" type="number" value={modal.form.emdAmount} onChange={e=>modal.set('emdAmount',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">EMD Mode</label><select className="form-select" value={modal.form.emdMode} onChange={e=>modal.set('emdMode',e.target.value)}>{['Demand Draft','Bank Guarantee','Online Payment','Exempted'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Bid Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.bidDate)} onChange={e=>modal.set('bidDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Open Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.openDate)} onChange={e=>modal.set('openDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Result Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.resultDate)} onChange={e=>modal.set('resultDate',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Bid Checklist</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {checklistItems.map(item=>(
              <label key={item.key} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:5,cursor:'pointer'}}>
                <input type="checkbox" checked={!!(modal.form.checklist||{})[item.key]} onChange={e=>modal.set('checklist',{...(modal.form.checklist||{}), [item.key]:e.target.checked})} style={{width:14,height:14,accentColor:'var(--blue)'}} />
                <span style={{fontSize:12}}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-field" style={{marginTop:10}}><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Tender" message="Move this tender to trash?" danger />
    </div>
  )
}
