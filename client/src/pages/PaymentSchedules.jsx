// client/src/pages/PaymentSchedules.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentScheduleApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { spoId:'', customer:'', totalOrderValue:'', milestones:[], notes:'' }
const MILESTONE_DEFAULTS = { name:'', dueDate:'', amount:'', percentage:'', status:'Pending', notes:'' }

export default function PaymentSchedules() {
  const qc = useQueryClient()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['payment-schedules'], queryFn:()=>paymentScheduleApi.getAll({limit:500}) })
  const save = useMutation({ mutationFn: d=>modal.isEditing?paymentScheduleApi.update(modal.editId,d):paymentScheduleApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['payment-schedules']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: paymentScheduleApi.remove, onSuccess:()=>{ qc.invalidateQueries(['payment-schedules']); toast.success('Moved to trash') } })

  const addMilestone = () => modal.set('milestones', [...(modal.form.milestones||[]), {...MILESTONE_DEFAULTS}])
  const removeMilestone = (i) => modal.set('milestones', modal.form.milestones.filter((_,idx)=>idx!==i))
  const updateMilestone = (i,f,v) => { const ms=[...modal.form.milestones]; ms[i]={...ms[i],[f]:v}; modal.set('milestones',ms) }

  const totalScheduled = (modal.form.milestones||[]).reduce((s,m)=>s+(parseFloat(m.amount)||0),0)

  const columns = [
    { key:'scheduleId', label:'Schedule ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'customer', label:'Customer', render:(v,r)=><div><div style={{fontWeight:500}}>{v||'—'}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.spoId||''}</div></div> },
    { key:'totalOrderValue', label:'Order Value', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'milestones', label:'Milestones', render:v=><span style={{fontFamily:'var(--font-mono)'}}>{(v||[]).length} milestones</span> },
    { key:'milestones', label:'Pending', render:v=>{
      const pending=(v||[]).filter(m=>m.status==='Pending').reduce((s,m)=>s+(m.amount||0),0)
      return <span style={{fontFamily:'var(--font-mono)',color:pending>0?'var(--amber)':'var(--text3)'}}>{fmtCurrency(pending)}</span>
    }},
    { key:'milestones', label:'Received', render:v=>{
      const recv=(v||[]).filter(m=>m.status==='Received').reduce((s,m)=>s+(m.amount||0),0)
      return <span style={{fontFamily:'var(--font-mono)',color:'var(--green)'}}>{fmtCurrency(recv)}</span>
    }},
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Payment Schedules" icon="💳" subtitle="Milestone-based payment tracking tied to sales orders" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Schedule</button>} />
      <DataTable title="All Payment Schedules" icon="💳" columns={columns} data={data?.data||[]} loading={isLoading} onRowClick={modal.openEdit} searchPlaceholder="Search schedules..." />
      <Modal open={modal.open} onClose={modal.close} icon="💳" size="lg" title={modal.isEditing?'Edit Schedule':'New Payment Schedule'}
        onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}
        footerLeft={<span style={{fontSize:11,color:'var(--text3)'}}>Total Scheduled: <strong style={{fontFamily:'var(--font-mono)',color:'var(--blue)'}}>{fmtCurrency(totalScheduled)}</strong></span>}
      >
        <div className="form-section"><div className="form-section-title">Order Reference</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Sales PO Ref</label><input className="form-input" value={modal.form.spoId} onChange={e=>modal.set('spoId',e.target.value)} placeholder="SPO-2025-001" /></div>
            <div className="form-field"><label className="form-label">Customer</label><input className="form-input" value={modal.form.customer} onChange={e=>modal.set('customer',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Total Order Value (₹)</label><input className="form-input" type="number" value={modal.form.totalOrderValue} onChange={e=>modal.set('totalOrderValue',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Payment Milestones</div>
          {(modal.form.milestones||[]).map((m,i)=>(
            <div key={i} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:6,padding:12,marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--text2)'}}>Milestone {i+1}</span>
                <button onClick={()=>removeMilestone(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:14}}>✕</button>
              </div>
              <div className="form-grid">
                <div className="form-field"><label className="form-label">Name</label><input className="form-input" value={m.name} onChange={e=>updateMilestone(i,'name',e.target.value)} placeholder="e.g. Advance 30%" /></div>
                <div className="form-field"><label className="form-label">Due Date</label><input className="form-input" type="date" value={fmtDateInput(m.dueDate)} onChange={e=>updateMilestone(i,'dueDate',e.target.value)} /></div>
                <div className="form-field"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" value={m.amount} onChange={e=>updateMilestone(i,'amount',e.target.value)} /></div>
                <div className="form-field"><label className="form-label">Percentage %</label><input className="form-input" type="number" value={m.percentage} onChange={e=>updateMilestone(i,'percentage',e.target.value)} /></div>
                <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={m.status} onChange={e=>updateMilestone(i,'status',e.target.value)}>{['Pending','Received','Overdue','Waived'].map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addMilestone}>+ Add Milestone</button>
        </div>
        <div className="form-field"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Schedule" message="Move this payment schedule to trash?" danger />
    </div>
  )
}
