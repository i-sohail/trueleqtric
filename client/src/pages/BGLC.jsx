// client/src/pages/BGLC.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bglcApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { type:'Bank Guarantee', direction:'Outgoing', instrument:'Performance BG', status:'Active', bgNo:'', amount:'', currency:'INR', marginMoney:0, bank:'', branchCity:'', issueDate:'', expiryDate:'', renewalAlert:30, linkedType:'', linkedTo:'', beneficiary:'', purpose:'', notes:'' }

export default function BGLC() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['bglc'], queryFn:()=>bglcApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['bglc-stats'], queryFn: bglcApi.getStats })
  const save = useMutation({ mutationFn: d=>modal.isEditing?bglcApi.update(modal.editId,d):bglcApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['bglc']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: bglcApi.remove, onSuccess:()=>{ qc.invalidateQueries(['bglc']); toast.success('Moved to trash') } })

  const getDaysToExpiry = (d) => {
    if (!d) return null
    return Math.ceil((new Date(d) - new Date()) / 86400000)
  }

  const columns = [
    { key:'bglcId', label:'ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'type', label:'Type', render:(v,r)=><div><span className={`badge ${v==='Bank Guarantee'?'badge-blue':'badge-purple'}`}>{v}</span><div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>{r.direction}</div></div> },
    { key:'instrument', label:'Instrument', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'bank', label:'Bank', render:(v,r)=><div><div style={{fontWeight:500,fontSize:11}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.bgNo||''}</div></div> },
    { key:'amount', label:'Amount', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:700}}>{fmtCurrency(v)}</span> },
    { key:'issueDate', label:'Issued', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'expiryDate', label:'Expiry', render:(v,r)=>{
      const days = getDaysToExpiry(v)
      const expiring = days !== null && days >= 0 && days <= (r.renewalAlert||30)
      return <div>
        <div style={{fontSize:11,color:days!==null&&days<0?'var(--red)':expiring?'var(--amber)':'var(--text2)'}}>{fmtDate(v)}</div>
        {days !== null && days >= 0 && <div style={{fontSize:10,fontWeight:700,color:expiring?'var(--amber)':'var(--text3)'}}>{days}d left{expiring?' ⚠':''}</div>}
        {days !== null && days < 0 && <div style={{fontSize:10,fontWeight:700,color:'var(--red)'}}>EXPIRED</div>}
      </div>
    }},
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'beneficiary', label:'Beneficiary', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="BG & LC Tracker" icon="🔐" subtitle="Bank Guarantees and Letters of Credit — expiry monitoring" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New BG / LC</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Instruments" value={String(stats?.total||0)} sub="all BG & LC" icon="🔐" accent="var(--blue)" />
        <KPICard label="Active" value={String(stats?.active||0)} sub="currently live" icon="✓" accent="var(--green)" />
        <KPICard label="Expiring Soon" value={String(stats?.expiring||0)} sub="within alert window" icon="⚠" accent={stats?.expiring>0?'var(--amber)':'var(--green)'} />
        <KPICard label="Total Value at Risk" value={fmtCurrency(stats?.totalValue||0)} sub="active instruments" icon="₹" accent="var(--purple)" />
      </div>
      <DataTable title="All BG & LC Instruments" icon="🔐" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Bank Guarantee','Letter of Credit','Active','Expired','Invoked']}
        onRowClick={modal.openEdit} searchPlaceholder="Search BG/LC..." />
      <Modal open={modal.open} onClose={modal.close} icon="🔐" title={modal.isEditing?'Edit BG / LC':'New Bank Guarantee / LC'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Instrument Details</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Type <span className="req">*</span></label><select className="form-select" value={modal.form.type} onChange={e=>modal.set('type',e.target.value)}><option>Bank Guarantee</option><option>Letter of Credit</option></select></div>
            <div className="form-field"><label className="form-label">Direction <span className="req">*</span></label><select className="form-select" value={modal.form.direction} onChange={e=>modal.set('direction',e.target.value)}><option>Outgoing</option><option>Incoming</option></select></div>
            <div className="form-field"><label className="form-label">Instrument Sub-Type</label><select className="form-select" value={modal.form.instrument} onChange={e=>modal.set('instrument',e.target.value)}>{['Performance BG','Advance Payment BG','Security Deposit BG','Bid Bond BG','Usance LC','Sight LC','Standby LC'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{['Active','Expired','Invoked','Released','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Reference No.</label><input className="form-input" value={modal.form.bgNo} onChange={e=>modal.set('bgNo',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Amount (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.amount} onChange={e=>modal.set('amount',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Currency</label><select className="form-select" value={modal.form.currency} onChange={e=>modal.set('currency',e.target.value)}>{(lists.currencies||['INR','USD']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Margin Money (₹)</label><input className="form-input" type="number" value={modal.form.marginMoney} onChange={e=>modal.set('marginMoney',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Bank & Dates</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Bank Name <span className="req">*</span></label><input className="form-input" value={modal.form.bank} onChange={e=>modal.set('bank',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Branch / City</label><input className="form-input" value={modal.form.branchCity} onChange={e=>modal.set('branchCity',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Issue Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.issueDate)} onChange={e=>modal.set('issueDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Expiry Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.expiryDate)} onChange={e=>modal.set('expiryDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Renewal Alert (days before expiry)</label><input className="form-input" type="number" value={modal.form.renewalAlert} onChange={e=>modal.set('renewalAlert',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Linkage</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Link To</label><select className="form-select" value={modal.form.linkedType} onChange={e=>modal.set('linkedType',e.target.value)}><option value="">— No link —</option><option value="salespo">Sales PO</option><option value="procurement">Purchase PO</option><option value="tenders">Tender</option><option value="leads">Lead</option></select></div>
            <div className="form-field"><label className="form-label">Linked Record ID</label><input className="form-input" value={modal.form.linkedTo} onChange={e=>modal.set('linkedTo',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Beneficiary</label><input className="form-input" value={modal.form.beneficiary} onChange={e=>modal.set('beneficiary',e.target.value)} /></div>
            <div className="form-field form-full"><label className="form-label">Purpose</label><input className="form-input" value={modal.form.purpose} onChange={e=>modal.set('purpose',e.target.value)} /></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete BG/LC" message="Move this instrument to trash?" danger />
    </div>
  )
}
