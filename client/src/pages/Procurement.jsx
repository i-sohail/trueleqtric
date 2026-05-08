// client/src/pages/Procurement.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { procurementApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { vendor:'', salesPORef:'', sku:'', product:'', category:'', qty:1, unit:'Nos.', make:'', unitCost:'', gstRate:'18%', purDate:'', expDelivery:'', status:'Enquiry Sent', buyer:'', notes:'' }

export default function Procurement() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['procurement'], queryFn:()=>procurementApi.getAll({limit:500}) })
  const save = useMutation({ mutationFn: d=>modal.isEditing?procurementApi.update(modal.editId,d):procurementApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['procurement']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: procurementApi.remove, onSuccess:()=>{ qc.invalidateQueries(['procurement']); toast.success('Moved to trash') } })

  const columns = [
    { key:'procId', label:'PPO ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'vendor', label:'Vendor', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.salesPORef||''}</div></div> },
    { key:'product', label:'Product', render:(v,r)=><span style={{fontSize:11}}>{v||r.sku||'—'}</span> },
    { key:'qty', label:'Qty', render:(v,r)=><span style={{fontFamily:'var(--font-mono)'}}>{v} {r.unit}</span> },
    { key:'unitCost', label:'Unit Cost', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'expDelivery', label:'Exp. Delivery', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'buyer', label:'Buyer', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Procurement" icon="◐" subtitle="Manage purchase orders and vendor procurement" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Purchase PO</button>} />
      <DataTable title="All Procurement POs" icon="◐" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Enquiry Sent','Quotes Received','PO Raised','Partial Delivery','Fully Delivered','Payment Done']}
        onRowClick={modal.openEdit} searchPlaceholder="Search procurement..." />
      <Modal open={modal.open} onClose={modal.close} icon="◐" title={modal.isEditing?'Edit Purchase PO':'New Purchase PO'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Vendor & Reference</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Vendor <span className="req">*</span></label><input className="form-input" value={modal.form.vendor} onChange={e=>modal.set('vendor',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Sales PO Ref</label><input className="form-input" value={modal.form.salesPORef} onChange={e=>modal.set('salesPORef',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{(lists.procStatuses||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Buyer</label><select className="form-select" value={modal.form.buyer} onChange={e=>modal.set('buyer',e.target.value)}><option value="">— Select —</option>{(lists.buyers||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Product Details</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">SKU</label><input className="form-input" value={modal.form.sku} onChange={e=>modal.set('sku',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Product Description</label><input className="form-input" value={modal.form.product} onChange={e=>modal.set('product',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Category</label><select className="form-select" value={modal.form.category} onChange={e=>modal.set('category',e.target.value)}><option value="">— Select —</option>{(lists.prodCategories||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Make</label><input className="form-input" value={modal.form.make} onChange={e=>modal.set('make',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Quantity <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.qty} onChange={e=>modal.set('qty',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Unit</label><select className="form-select" value={modal.form.unit} onChange={e=>modal.set('unit',e.target.value)}>{(lists.units||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Unit Cost (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.unitCost} onChange={e=>modal.set('unitCost',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">GST Rate</label><select className="form-select" value={modal.form.gstRate} onChange={e=>modal.set('gstRate',e.target.value)}>{['0%','5%','12%','18%','28%'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Purchase Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.purDate)} onChange={e=>modal.set('purDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Expected Delivery</label><input className="form-input" type="date" value={fmtDateInput(modal.form.expDelivery)} onChange={e=>modal.set('expDelivery',e.target.value)} /></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete PO" message="Move this procurement PO to trash?" danger />
    </div>
  )
}
