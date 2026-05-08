// client/src/pages/Vendors.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtDate } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { name:'', type:'', category:'', brands:'', gst:'', pan:'', contact:'', email:'', phone:'', city:'', region:'', leadTime:30, payTerms:30, currency:'INR', rating:'B+ (Good)', notes:'' }

export default function Vendors() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['vendors'], queryFn:()=>vendorsApi.getAll({limit:500}) })
  const save = useMutation({ mutationFn: d => modal.isEditing ? vendorsApi.update(modal.editId,d) : vendorsApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['vendors']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: vendorsApi.remove, onSuccess:()=>{ qc.invalidateQueries(['vendors']); toast.success('Moved to trash') } })

  const columns = [
    { key:'vendorId', label:'ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'name', label:'Vendor', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.contact} · {r.city}</div></div> },
    { key:'type', label:'Type', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'category', label:'Category', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'brands', label:'Brands', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{v||'—'}</span> },
    { key:'leadTime', label:'Lead Time', render:v=><span style={{fontSize:11}}>{v} days</span> },
    { key:'payTerms', label:'Pay Terms', render:v=><span style={{fontSize:11}}>{v} days</span> },
    { key:'rating', label:'Rating', render:v=><span className={`badge ${v==='A+ (Excellent)'||v==='A (Very Good)'?'badge-green':v==='Blacklisted'?'badge-red':'badge-blue'}`}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Vendors" icon="◈" subtitle="Vendor master data and performance management" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Vendor</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Vendors" value={String(data?.total||0)} sub="registered" icon="◈" accent="var(--blue)" />
      </div>
      <DataTable title="All Vendors" icon="◈" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['OEM / Manufacturer','Authorized Distributor','Trading Company','Service Provider']}
        onRowClick={modal.openEdit} searchPlaceholder="Search vendors..." />
      <Modal open={modal.open} onClose={modal.close} icon="◈" title={modal.isEditing?'Edit Vendor':'New Vendor'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Company Details</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Company Name <span className="req">*</span></label><input className="form-input" value={modal.form.name} onChange={e=>modal.set('name',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Vendor Type</label><select className="form-select" value={modal.form.type} onChange={e=>modal.set('type',e.target.value)}><option value="">— Select —</option>{(lists.vendorTypes||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Product Category</label><select className="form-select" value={modal.form.category} onChange={e=>modal.set('category',e.target.value)}><option value="">— Select —</option>{(lists.prodCategories||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Brands Supplied</label><input className="form-input" value={modal.form.brands} onChange={e=>modal.set('brands',e.target.value)} /></div>
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
        <div className="form-section"><div className="form-section-title">Commercial Terms</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Lead Time (Days)</label><input className="form-input" type="number" value={modal.form.leadTime} onChange={e=>modal.set('leadTime',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Payment Terms (Days)</label><input className="form-input" type="number" value={modal.form.payTerms} onChange={e=>modal.set('payTerms',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Currency</label><select className="form-select" value={modal.form.currency} onChange={e=>modal.set('currency',e.target.value)}>{(lists.currencies||['INR','USD']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Rating</label><select className="form-select" value={modal.form.rating} onChange={e=>modal.set('rating',e.target.value)}>{(lists.ratings||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Vendor" message="Move this vendor to trash?" danger />
    </div>
  )
}
