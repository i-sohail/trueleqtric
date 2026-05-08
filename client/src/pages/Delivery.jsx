// client/src/pages/Delivery.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { spoId:'', sku:'', product:'', qtyDispatched:1, dispValue:'', contractedDate:'', dispatchDate:'', actualDelivery:'', transMode:'Road - Truck', transporter:'', lrNo:'', vehicleNo:'', weight:'', insRef:'', status:'Pending', podReceived:false, ldRate:0, notes:'' }

export default function Delivery() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['delivery'], queryFn:()=>deliveryApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['delivery-stats'], queryFn: deliveryApi.getStats })
  const save = useMutation({ mutationFn: d=>modal.isEditing?deliveryApi.update(modal.editId,d):deliveryApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['delivery']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: deliveryApi.remove, onSuccess:()=>{ qc.invalidateQueries(['delivery']); toast.success('Moved to trash') } })

  const isOverdue = (r) => {
    const done = ['Delivered - POD Received','Delivered - Pending POD','Cancelled']
    return !done.includes(r.status) && r.contractedDate && !r.actualDelivery && new Date(r.contractedDate) < new Date()
  }

  const columns = [
    { key:'delId', label:'DEL ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'spoId', label:'SPO Ref', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:11}}>{v||'—'}</span> },
    { key:'product', label:'Product', render:(v,r)=><span style={{fontSize:11}}>{v||r.sku||'—'}</span> },
    { key:'qtyDispatched', label:'Qty', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)'}}>{v}</span> },
    { key:'dispValue', label:'Value', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'contractedDate', label:'Contracted', render:(v,r)=><div><div style={{fontSize:11,color:isOverdue(r)?'var(--red)':'var(--text2)'}}>{fmtDate(v)}</div>{isOverdue(r)&&<div style={{fontSize:10,fontWeight:700,color:'var(--red)'}}>OVERDUE</div>}</div> },
    { key:'dispatchDate', label:'Dispatched', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'transporter', label:'Transporter', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'podReceived', label:'POD', render:v=><span className={`badge ${v?'badge-green':'badge-gray'}`}>{v?'Received':'Pending'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Delivery Log" icon="▷" subtitle="Dispatch tracking, POD management, and LD monitoring" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Dispatch</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Dispatches" value={String(stats?.total||0)} sub="all time" icon="▷" accent="var(--blue)" />
        <KPICard label="Overdue" value={String(stats?.overdue||0)} sub="past contracted date" icon="⚠" accent={stats?.overdue>0?'var(--red)':'var(--green)'} />
      </div>
      <DataTable title="All Deliveries" icon="▷" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Pending','Packing','Ready to Dispatch','In Transit','Delivered - POD Received','Overdue']}
        onRowClick={modal.openEdit} searchPlaceholder="Search deliveries..." />
      <Modal open={modal.open} onClose={modal.close} icon="▷" title={modal.isEditing?'Edit Delivery':'New Dispatch'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Order & Product</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Sales PO Ref <span className="req">*</span></label><input className="form-input" value={modal.form.spoId} onChange={e=>modal.set('spoId',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">SKU</label><input className="form-input" value={modal.form.sku} onChange={e=>modal.set('sku',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Product</label><input className="form-input" value={modal.form.product} onChange={e=>modal.set('product',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Qty Dispatched <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.qtyDispatched} onChange={e=>modal.set('qtyDispatched',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Dispatch Value (₹)</label><input className="form-input" type="number" value={modal.form.dispValue} onChange={e=>modal.set('dispValue',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{(lists.delStatuses||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Dates</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Contracted Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.contractedDate)} onChange={e=>modal.set('contractedDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Dispatch Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.dispatchDate)} onChange={e=>modal.set('dispatchDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Actual Delivery</label><input className="form-input" type="date" value={fmtDateInput(modal.form.actualDelivery)} onChange={e=>modal.set('actualDelivery',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Logistics</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Transport Mode</label><select className="form-select" value={modal.form.transMode} onChange={e=>modal.set('transMode',e.target.value)}>{(lists.transModes||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Transporter</label><input className="form-input" value={modal.form.transporter} onChange={e=>modal.set('transporter',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">LR / AWB No.</label><input className="form-input" value={modal.form.lrNo} onChange={e=>modal.set('lrNo',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Vehicle No.</label><input className="form-input" value={modal.form.vehicleNo} onChange={e=>modal.set('vehicleNo',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Weight (MT)</label><input className="form-input" type="number" step="0.1" value={modal.form.weight} onChange={e=>modal.set('weight',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Insurance Ref</label><input className="form-input" value={modal.form.insRef} onChange={e=>modal.set('insRef',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">LD Rate (%/week)</label><input className="form-input" type="number" step="0.1" value={modal.form.ldRate} onChange={e=>modal.set('ldRate',e.target.value)} /></div>
            <div className="form-field" style={{display:'flex',alignItems:'center',gap:8,paddingTop:20}}>
              <input type="checkbox" id="pod" checked={!!modal.form.podReceived} onChange={e=>modal.set('podReceived',e.target.checked)} style={{width:15,height:15,accentColor:'var(--blue)'}} />
              <label htmlFor="pod" style={{fontSize:12,fontWeight:500,cursor:'pointer'}}>POD Received</label>
            </div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Delivery" message="Move this delivery entry to trash?" danger />
    </div>
  )
}
