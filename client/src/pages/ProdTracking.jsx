// client/src/pages/ProdTracking.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { prodTrackingApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge, ProgressBar } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { spoId:'', vendor:'', product:'', category:'', qtyOrdered:1, unit:'Nos.', productionStart:'', expectedCompletion:'', actualCompletion:'', status:'Pending', qcStatus:'Pending', inspector:'', inspectionDate:'', progressPct:0, notes:'' }

export default function ProdTracking() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['prod-tracking'], queryFn:()=>prodTrackingApi.getAll({limit:500}) })
  const save = useMutation({ mutationFn: d=>modal.isEditing?prodTrackingApi.update(modal.editId,d):prodTrackingApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['prod-tracking']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: prodTrackingApi.remove, onSuccess:()=>{ qc.invalidateQueries(['prod-tracking']); toast.success('Moved to trash') } })

  const columns = [
    { key:'trackId', label:'Track ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'vendor', label:'Vendor', render:(v,r)=><div><div style={{fontWeight:500}}>{v||'—'}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.spoId||''}</div></div> },
    { key:'product', label:'Product', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'qtyOrdered', label:'Qty', render:(v,r)=><span style={{fontFamily:'var(--font-mono)'}}>{v} {r.unit}</span> },
    { key:'progressPct', label:'Progress', render:v=><div style={{display:'flex',alignItems:'center',gap:6,minWidth:100}}><ProgressBar value={v||0} color={v>=100?'var(--green)':v>=50?'var(--blue)':'var(--amber)'} height={6} /><span style={{fontSize:10,color:'var(--text3)',minWidth:28}}>{v||0}%</span></div> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'qcStatus', label:'QC', render:v=><span className={`badge ${v==='Approved'?'badge-green':v==='Rejected'?'badge-red':v==='Under Inspection'?'badge-blue':'badge-gray'}`}>{v}</span> },
    { key:'expectedCompletion', label:'Expected', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Production Tracking" icon="🏭" subtitle="Monitor manufacturing and production progress for ordered goods" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ Track Order</button>} />
      <DataTable title="All Production Tracks" icon="🏭" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Pending','In Production','QC Inspection','Ready to Dispatch','Dispatched','Completed']}
        onRowClick={modal.openEdit} searchPlaceholder="Search production orders..." />
      <Modal open={modal.open} onClose={modal.close} icon="🏭" title={modal.isEditing?'Edit Production Track':'New Production Track'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Order Details</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Sales PO Ref</label><input className="form-input" value={modal.form.spoId} onChange={e=>modal.set('spoId',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Vendor <span className="req">*</span></label><input className="form-input" value={modal.form.vendor} onChange={e=>modal.set('vendor',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Product</label><input className="form-input" value={modal.form.product} onChange={e=>modal.set('product',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Category</label><select className="form-select" value={modal.form.category} onChange={e=>modal.set('category',e.target.value)}><option value="">— Select —</option>{(lists.prodCategories||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Qty Ordered</label><input className="form-input" type="number" value={modal.form.qtyOrdered} onChange={e=>modal.set('qtyOrdered',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Unit</label><select className="form-select" value={modal.form.unit} onChange={e=>modal.set('unit',e.target.value)}>{(lists.units||['Nos.','Sets']).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Progress & Status</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Production Start</label><input className="form-input" type="date" value={fmtDateInput(modal.form.productionStart)} onChange={e=>modal.set('productionStart',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Expected Completion</label><input className="form-input" type="date" value={fmtDateInput(modal.form.expectedCompletion)} onChange={e=>modal.set('expectedCompletion',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Actual Completion</label><input className="form-input" type="date" value={fmtDateInput(modal.form.actualCompletion)} onChange={e=>modal.set('actualCompletion',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{['Pending','In Production','QC Inspection','Ready to Dispatch','Dispatched','Completed','On Hold','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Progress % (0–100)</label>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input className="form-input" type="number" min="0" max="100" value={modal.form.progressPct} onChange={e=>modal.set('progressPct',e.target.value)} style={{maxWidth:80}} />
                <ProgressBar value={modal.form.progressPct||0} color={modal.form.progressPct>=100?'var(--green)':modal.form.progressPct>=50?'var(--blue)':'var(--amber)'} height={8} />
              </div>
            </div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">QC / Inspection</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">QC Status</label><select className="form-select" value={modal.form.qcStatus} onChange={e=>modal.set('qcStatus',e.target.value)}>{(lists.qcStatuses||['Pending','Under Inspection','Approved','Rejected']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Inspector</label><input className="form-input" value={modal.form.inspector} onChange={e=>modal.set('inspector',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Inspection Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.inspectionDate)} onChange={e=>modal.set('inspectionDate',e.target.value)} /></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Track" message="Move this production track to trash?" danger />
    </div>
  )
}
