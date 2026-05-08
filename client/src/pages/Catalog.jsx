// client/src/pages/Catalog.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { name:'', category:'', subCat:'', segment:'', make:'', unit:'Nos.', hsn:'', gstRate:'18%', costPrice:'', listPrice:'', minPrice:'', warranty:'', specs:'' }

export default function Catalog() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['catalog'], queryFn:()=>catalogApi.getAll({limit:500}) })
  const save = useMutation({ mutationFn: d=>modal.isEditing?catalogApi.update(modal.editId,d):catalogApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['catalog']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: catalogApi.remove, onSuccess:()=>{ qc.invalidateQueries(['catalog']); toast.success('Moved to trash') } })

  const margin = modal.form.listPrice && modal.form.costPrice ? ((modal.form.listPrice - modal.form.costPrice) / modal.form.listPrice * 100).toFixed(1) : null

  const columns = [
    { key:'sku', label:'SKU', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'name', label:'Product', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.make||''} · {r.category}</div></div> },
    { key:'category', label:'Category', render:v=><span style={{fontSize:11}}>{v}</span> },
    { key:'unit', label:'Unit', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{v}</span> },
    { key:'costPrice', label:'Cost Price', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)'}}>{fmtCurrency(v)}</span> },
    { key:'listPrice', label:'List Price', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'gstRate', label:'GST', render:v=><span style={{fontSize:11}}>{v}</span> },
    { key:'warranty', label:'Warranty', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Product Catalog" icon="▤" subtitle="Manage SKUs, pricing, and product specifications" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New SKU</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total SKUs" value={String(data?.total||0)} sub="in catalog" icon="▤" accent="var(--blue)" />
      </div>
      <DataTable title="Product Catalog" icon="▤" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Transformers','Solar PV Panels','Solar Inverters','Cables & Conductors','Switchgear & Protection','Battery Storage Systems']}
        onRowClick={modal.openEdit} searchPlaceholder="Search products..." />
      <Modal open={modal.open} onClose={modal.close} icon="▤" title={modal.isEditing?'Edit Product':'New Product / SKU'}
        onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}
        footerLeft={margin?<span style={{fontSize:11,color:'var(--text3)'}}>List Margin: <strong style={{color:parseFloat(margin)>=20?'var(--green)':'var(--amber)'}}>{margin}%</strong></span>:null}
      >
        <div className="form-section"><div className="form-section-title">Product Identity</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Product Name <span className="req">*</span></label><input className="form-input" value={modal.form.name} onChange={e=>modal.set('name',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Category <span className="req">*</span></label><select className="form-select" value={modal.form.category} onChange={e=>modal.set('category',e.target.value)}><option value="">— Select —</option>{(lists.prodCategories||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Sub-Category</label><input className="form-input" value={modal.form.subCat} onChange={e=>modal.set('subCat',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Segment</label><select className="form-select" value={modal.form.segment} onChange={e=>modal.set('segment',e.target.value)}><option value="">— Select —</option>{(lists.segments||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Make / Brand</label><input className="form-input" value={modal.form.make} onChange={e=>modal.set('make',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Unit</label><select className="form-select" value={modal.form.unit} onChange={e=>modal.set('unit',e.target.value)}>{(lists.units||['Nos.','Meters','KG']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">HSN Code</label><input className="form-input" value={modal.form.hsn} onChange={e=>modal.set('hsn',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">GST Rate</label><select className="form-select" value={modal.form.gstRate} onChange={e=>modal.set('gstRate',e.target.value)}>{(lists.gstRates||['0%','5%','12%','18%','28%']).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Pricing</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Cost Price (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.costPrice} onChange={e=>modal.set('costPrice',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">List Price (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.listPrice} onChange={e=>modal.set('listPrice',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Min Price (₹)</label><input className="form-input" type="number" value={modal.form.minPrice} onChange={e=>modal.set('minPrice',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Warranty</label><select className="form-select" value={modal.form.warranty} onChange={e=>modal.set('warranty',e.target.value)}><option value="">— Select —</option>{(lists.warrantyTerms||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field form-full"><label className="form-label">Specifications</label><textarea className="form-textarea" value={modal.form.specs} onChange={e=>modal.set('specs',e.target.value)} placeholder="Technical specs, ratings, standards..." /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Product" message="Move this SKU to trash?" danger />
    </div>
  )
}
