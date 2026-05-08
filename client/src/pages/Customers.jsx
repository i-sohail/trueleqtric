// client/src/pages/Customers.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency } from '../utils/format'
import { useState } from 'react'
import toast from 'react-hot-toast'

const DEFAULTS = { name:'', type:'', segment:'', gst:'', pan:'', contact:'', email:'', phone:'', city:'', region:'', creditLimit:'', payTerms:30, currency:'INR', rating:'B+ (Good)', notes:'' }

export default function Customers() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['customers'], queryFn:()=>customersApi.getAll({limit:500}) })

  const save = useMutation({
    mutationFn: d => modal.isEditing ? customersApi.update(modal.editId, d) : customersApi.create(d),
    onSuccess: res => { qc.invalidateQueries(['customers']); modal.close(); toast.success(res.message) },
  })
  const remove = useMutation({ mutationFn: customersApi.remove, onSuccess: ()=>{ qc.invalidateQueries(['customers']); toast.success('Moved to trash') } })

  const columns = [
    { key:'customerId', label:'ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'name', label:'Company', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.contact} · {r.email}</div></div> },
    { key:'type', label:'Type', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'segment', label:'Segment' },
    { key:'city', label:'City' },
    { key:'rating', label:'Rating', render:v=><span className={`badge ${v==='A+ (Excellent)'?'badge-green':v==='Blacklisted'?'badge-red':'badge-blue'}`}>{v||'—'}</span> },
    { key:'creditLimit', label:'Credit Limit', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'payTerms', label:'Pay Terms', render:v=><span style={{fontSize:11}}>{v} days</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Customers" icon="◉" subtitle="Customer master data and credit management"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Customer</button>}
      />
      <DataTable title="All Customers" icon="◉" columns={columns} data={data?.data||[]} loading={isLoading} filters={['State Utility (DISCOM)','Central PSU (CPSU)','Private IPP','EPC Contractor']} onRowClick={modal.openEdit} searchPlaceholder="Search customers…" />
      <Modal open={modal.open} onClose={modal.close} icon="◉" title={modal.isEditing?'Edit Customer':'New Customer'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update Customer':'Save Customer'}>
        <div className="form-section"><div className="form-section-title">Company Details</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Company Name <span className="req">*</span></label><input className="form-input" value={modal.form.name} onChange={e=>modal.set('name',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Customer Type</label><select className="form-select" value={modal.form.type} onChange={e=>modal.set('type',e.target.value)}><option value="">— Select —</option>{(lists.custTypes||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Segment</label><select className="form-select" value={modal.form.segment} onChange={e=>modal.set('segment',e.target.value)}><option value="">— Select —</option>{(lists.segments||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">GST Number</label><input className="form-input" value={modal.form.gst} onChange={e=>modal.set('gst',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">PAN</label><input className="form-input" value={modal.form.pan} onChange={e=>modal.set('pan',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Contact Details</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Contact Person <span className="req">*</span></label><input className="form-input" value={modal.form.contact} onChange={e=>modal.set('contact',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Email</label><input className="form-input" type="email" value={modal.form.email} onChange={e=>modal.set('email',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Phone</label><input className="form-input" value={modal.form.phone} onChange={e=>modal.set('phone',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">City</label><input className="form-input" value={modal.form.city} onChange={e=>modal.set('city',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Region</label><select className="form-select" value={modal.form.region} onChange={e=>modal.set('region',e.target.value)}><option value="">— Select —</option>{(lists.regions||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Credit & Terms</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Credit Limit (₹)</label><input className="form-input" type="number" value={modal.form.creditLimit} onChange={e=>modal.set('creditLimit',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Payment Terms (Days)</label><input className="form-input" type="number" value={modal.form.payTerms} onChange={e=>modal.set('payTerms',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Currency</label><select className="form-select" value={modal.form.currency} onChange={e=>modal.set('currency',e.target.value)}>{(lists.currencies||['INR','USD']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Rating</label><select className="form-select" value={modal.form.rating} onChange={e=>modal.set('rating',e.target.value)}>{(lists.ratings||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Customer" message="Move this customer to trash?" danger />
    </div>
  )
}
