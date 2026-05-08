// client/src/pages/Commissions.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commissionsApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput, fmtPct } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { spoId:'', vendor:'', customer:'', product:'', orderValue:'', commissionType:'Trading Margin', commissionPct:0, commissionAmt:'', commissionBasis:'', status:'Pending', invoiceNo:'', invoiceDate:'', amtReceived:0, notes:'' }

export default function Commissions() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['commissions'], queryFn:()=>commissionsApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['commissions-stats'], queryFn: commissionsApi.getStats })
  const save = useMutation({ mutationFn: d=>modal.isEditing?commissionsApi.update(modal.editId,d):commissionsApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['commissions']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: commissionsApi.remove, onSuccess:()=>{ qc.invalidateQueries(['commissions']); toast.success('Moved to trash') } })

  const columns = [
    { key:'commissionId', label:'COM ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'customer', label:'Customer', render:(v,r)=><div><div style={{fontWeight:500}}>{v||'—'}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.spoId||''}</div></div> },
    { key:'vendor', label:'Vendor', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'product', label:'Product', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'orderValue', label:'Order Value', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)'}}>{fmtCurrency(v)}</span> },
    { key:'commissionAmt', label:'Commission', align:'right', render:(v,r)=><div><div style={{fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--green)'}}>{fmtCurrency(v)}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.commissionPct?fmtPct(r.commissionPct/100):r.commissionType}</div></div> },
    { key:'amtReceived', label:'Received', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',color:v>0?'var(--green)':'var(--text3)'}}>{fmtCurrency(v)}</span> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Commissions" icon="💰" subtitle="Track trading margins and commission income" actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Commission</button>} />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Commission" value={fmtCurrency(stats?.total||0)} sub="all time" icon="💰" accent="var(--green)" />
        <KPICard label="Received" value={fmtCurrency(stats?.received||0)} sub="collected" icon="✓" accent="var(--blue)" />
        <KPICard label="Pending" value={fmtCurrency(stats?.pending||0)} sub="to collect" icon="⏳" accent="var(--amber)" />
        <KPICard label="Count" value={String(stats?.count||0)} sub="entries" icon="◎" accent="var(--purple)" />
      </div>
      <DataTable title="All Commissions" icon="💰" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Pending','Invoiced - Awaiting Payment','Received','Partially Received']}
        onRowClick={modal.openEdit} searchPlaceholder="Search commissions..." />
      <Modal open={modal.open} onClose={modal.close} icon="💰" title={modal.isEditing?'Edit Commission':'New Commission Entry'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-grid">
          <div className="form-field"><label className="form-label">Sales PO <span className="req">*</span></label><input className="form-input" value={modal.form.spoId} onChange={e=>modal.set('spoId',e.target.value)} placeholder="SPO-2025-001" /></div>
          <div className="form-field"><label className="form-label">Vendor</label><input className="form-input" value={modal.form.vendor} onChange={e=>modal.set('vendor',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Customer</label><input className="form-input" value={modal.form.customer} onChange={e=>modal.set('customer',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Product / Description</label><input className="form-input" value={modal.form.product} onChange={e=>modal.set('product',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Order Value (₹)</label><input className="form-input" type="number" value={modal.form.orderValue} onChange={e=>modal.set('orderValue',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Commission Type</label><select className="form-select" value={modal.form.commissionType} onChange={e=>modal.set('commissionType',e.target.value)}>{['Trading Margin','Fixed Commission','% Commission','Brokerage','Success Fee'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field"><label className="form-label">Commission %</label><input className="form-input" type="number" step="0.01" value={modal.form.commissionPct} onChange={e=>modal.set('commissionPct',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Commission Amount (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.commissionAmt} onChange={e=>modal.set('commissionAmt',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Basis</label><input className="form-input" value={modal.form.commissionBasis} onChange={e=>modal.set('commissionBasis',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{['Pending','Invoiced - Awaiting Payment','Received','Partially Received'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field"><label className="form-label">Invoice No.</label><input className="form-input" value={modal.form.invoiceNo} onChange={e=>modal.set('invoiceNo',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Invoice Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.invoiceDate)} onChange={e=>modal.set('invoiceDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Amount Received (₹)</label><input className="form-input" type="number" value={modal.form.amtReceived} onChange={e=>modal.set('amtReceived',e.target.value)} /></div>
          <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Commission" message="Move this commission entry to trash?" danger />
    </div>
  )
}
