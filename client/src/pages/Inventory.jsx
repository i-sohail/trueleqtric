// client/src/pages/Inventory.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { sku:'', product:'', category:'', make:'', unit:'Nos.', warehouse:'', location:'', openingQty:0, receivedQty:0, issuedQty:0, reservedQty:0, reorderLevel:0, reorderQty:0, notes:'' }

export default function Inventory() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['inventory'], queryFn: inventoryApi.getStats })
  const save = useMutation({ mutationFn: d=>modal.isEditing?inventoryApi.update(modal.editId,d):inventoryApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['inventory']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: inventoryApi.remove, onSuccess:()=>{ qc.invalidateQueries(['inventory']); toast.success('Moved to trash') } })

  const items = data?.data || []
  const stats = data?.stats || {}

  const getStockBadge = (status) => {
    if (status === 'In Stock') return 'badge-green'
    if (status === 'Low Stock') return 'badge-amber'
    return 'badge-red'
  }

  const columns = [
    { key:'invId', label:'ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'sku', label:'SKU / Product', render:(v,r)=><div><div style={{fontWeight:500}}>{r.product||v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{v} · {r.make||''}</div></div> },
    { key:'category', label:'Category', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'warehouse', label:'Warehouse', render:(v,r)=><div><div style={{fontSize:11}}>{v||'—'}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.location||''}</div></div> },
    { key:'currentStock', label:'Current Stock', align:'right', render:(v,r)=><span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:v<=0?'var(--red)':v<=(r.reorderLevel||0)?'var(--amber)':'var(--text0)'}}>{v} {r.unit}</span> },
    { key:'availableStock', label:'Available', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',color:'var(--text2)'}}>{v}</span> },
    { key:'reorderLevel', label:'Reorder At', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--text3)'}}>{v}</span> },
    { key:'stockValue', label:'Stock Value', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'stockStatus', label:'Status', render:v=><span className={`badge ${getStockBadge(v)}`}>{v}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Inventory" icon="▦" subtitle="Stock tracking, reorder management, and warehouse control" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ Stock Item</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total SKUs" value={String(stats.total||0)} sub="tracked" icon="▦" accent="var(--blue)" />
        <KPICard label="Low Stock" value={String(stats.lowStock||0)} sub="below reorder" icon="⚠" accent="var(--amber)" />
        <KPICard label="Out of Stock" value={String(stats.outOfStock||0)} sub="zero stock" icon="✕" accent="var(--red)" />
        <KPICard label="Stock Value" value={fmtCurrency(stats.totalValue||0)} sub="at cost" icon="₹" accent="var(--green)" />
      </div>
      <DataTable title="All Inventory Items" icon="▦" columns={columns} data={items} loading={isLoading}
        filters={['In Stock','Low Stock','Out of Stock']}
        onRowClick={modal.openEdit} searchPlaceholder="Search inventory..." />
      <Modal open={modal.open} onClose={modal.close} icon="▦" title={modal.isEditing?'Edit Stock Item':'New Stock Item'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-section"><div className="form-section-title">Product</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">SKU <span className="req">*</span></label><input className="form-input" value={modal.form.sku} onChange={e=>modal.set('sku',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Product Name</label><input className="form-input" value={modal.form.product} onChange={e=>modal.set('product',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Category</label><select className="form-select" value={modal.form.category} onChange={e=>modal.set('category',e.target.value)}><option value="">— Select —</option>{(lists.prodCategories||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Make</label><input className="form-input" value={modal.form.make} onChange={e=>modal.set('make',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Unit</label><select className="form-select" value={modal.form.unit} onChange={e=>modal.set('unit',e.target.value)}>{(lists.units||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Location</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Warehouse</label><select className="form-select" value={modal.form.warehouse} onChange={e=>modal.set('warehouse',e.target.value)}><option value="">— Select —</option>{(lists.warehouses||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Location Code</label><input className="form-input" placeholder="e.g. R-01-A" value={modal.form.location} onChange={e=>modal.set('location',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Stock Quantities</div>
          <div className="form-grid form-grid-3">
            <div className="form-field"><label className="form-label">Opening Qty</label><input className="form-input" type="number" value={modal.form.openingQty} onChange={e=>modal.set('openingQty',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Received Qty</label><input className="form-input" type="number" value={modal.form.receivedQty} onChange={e=>modal.set('receivedQty',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Issued Qty</label><input className="form-input" type="number" value={modal.form.issuedQty} onChange={e=>modal.set('issuedQty',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Reserved Qty</label><input className="form-input" type="number" value={modal.form.reservedQty} onChange={e=>modal.set('reservedQty',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Reorder Level</label><input className="form-input" type="number" value={modal.form.reorderLevel} onChange={e=>modal.set('reorderLevel',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Reorder Qty</label><input className="form-input" type="number" value={modal.form.reorderQty} onChange={e=>modal.set('reorderQty',e.target.value)} /></div>
          </div>
          <div style={{marginTop:10,padding:10,background:'var(--bg3)',borderRadius:6,fontSize:11,color:'var(--text2)'}}>
            Computed Current Stock = Opening ({modal.form.openingQty||0}) + Received ({modal.form.receivedQty||0}) - Issued ({modal.form.issuedQty||0}) = <strong>{(parseInt(modal.form.openingQty)||0)+(parseInt(modal.form.receivedQty)||0)-(parseInt(modal.form.issuedQty)||0)}</strong>
          </div>
          <div className="form-field" style={{marginTop:10}}><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Stock Item" message="Move this inventory item to trash?" danger />
    </div>
  )
}
