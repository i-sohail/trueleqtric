// client/src/pages/Leads.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import { useState } from 'react'
import toast from 'react-hot-toast'

const DEFAULTS = { customer:'', contact:'', segment:'', region:'', category:'', sku:'', qty:'', unit:'Nos.', source:'', tenderRef:'', bidDate:'', estValue:'', stage:'New Enquiry', priority:'Medium', salesRep:'', followUp:'', notes:'' }

export default function Leads() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => leadsApi.getAll({ limit: 500 }) })
  const { data: stats } = useQuery({ queryKey: ['leads-stats'], queryFn: leadsApi.getStats })

  const save = useMutation({
    mutationFn: (d) => modal.isEditing ? leadsApi.update(modal.editId, d) : leadsApi.create(d),
    onSuccess: (res) => { qc.invalidateQueries(['leads']); qc.invalidateQueries(['leads-stats']); modal.close(); toast.success(res.message) },
  })
  const remove = useMutation({
    mutationFn: leadsApi.remove,
    onSuccess: () => { qc.invalidateQueries(['leads']); toast.success('Lead moved to trash') },
  })
  const convert = useMutation({
    mutationFn: leadsApi.convertToQuote,
    onSuccess: () => { qc.invalidateQueries(['leads']); toast.success('Lead converted to Quotation!') },
  })

  const columns = [
    { key:'leadId', label:'Lead ID', render: v => <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--blue)', fontWeight:600 }}>{v}</span> },
    { key:'customer', label:'Customer', render: (v, r) => <div><div style={{ fontWeight:500 }}>{v}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{r.contact}</div></div> },
    { key:'segment', label:'Segment' },
    { key:'estValue', label:'Est. Value', align:'right', render: v => <span style={{ fontFamily:'var(--font-mono)', fontWeight:600 }}>{fmtCurrency(v)}</span> },
    { key:'stage', label:'Stage', render: v => <StatusBadge status={v} /> },
    { key:'priority', label:'Priority', render: v => <span className={`badge ${v==='Critical'?'badge-red':v==='High'?'badge-amber':v==='Low'?'badge-gray':'badge-blue'}`}>{v}</span> },
    { key:'salesRep', label:'Sales Rep', render: v => <span style={{ fontSize:11 }}>{v||'—'}</span> },
    { key:'followUp', label:'Follow-up', render: v => <span style={{ fontSize:11, color:'var(--text2)' }}>{fmtDate(v)}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r) => (
      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }} onClick={e => e.stopPropagation()}>
        <button className="btn-row-action" onClick={() => convert.mutate(r._id)} title="Convert to Quote">⚡</button>
        <button className="btn-row-action" onClick={() => modal.openEdit(r)}>✎</button>
        <button className="btn-row-action del" onClick={() => setDeleteId(r._id)}>🗑</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Leads & CRM" icon="◇" subtitle="Track and manage your sales pipeline"
        actions={<button className="btn btn-primary btn-sm" onClick={() => modal.openNew()}>+ New Lead</button>}
      />

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom:16 }}>
        <KPICard label="Total Leads" value={String(stats?.total || 0)} sub="all time" icon="◇" accent="var(--blue)" />
        <KPICard label="Active Leads" value={String(stats?.active || 0)} sub="in pipeline" icon="◎" accent="var(--green)" />
        <KPICard label="Pipeline Value" value={fmtCurrency(stats?.pipeline || 0)} sub="estimated" icon="💼" accent="var(--amber)" />
      </div>

      <DataTable
        title="All Leads" icon="◇" columns={columns} data={data?.data || []} loading={isLoading}
        filters={['New Enquiry','Qualified','Proposal Submitted','Negotiation','PO Received','Closed Lost']}
        onRowClick={row => modal.openEdit(row)}
        searchPlaceholder="Search leads…"
      />

      {/* Form Modal */}
      <Modal open={modal.open} onClose={modal.close} icon="◇"
        title={modal.isEditing ? 'Edit Lead' : 'New Lead'} subtitle="Lead & CRM entry"
        onSave={() => save.mutate(modal.form)} saveLabel={modal.isEditing ? 'Update Lead' : 'Save Lead'}
      >
        <div className="form-section"><div className="form-section-title">Customer & Enquiry</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Customer Name <span className="req">*</span></label><input className="form-input" value={modal.form.customer} onChange={e => modal.set('customer', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Contact Person</label><input className="form-input" value={modal.form.contact} onChange={e => modal.set('contact', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Segment</label><select className="form-select" value={modal.form.segment} onChange={e => modal.set('segment', e.target.value)}><option value="">— Select —</option>{(lists.segments||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Region</label><select className="form-select" value={modal.form.region} onChange={e => modal.set('region', e.target.value)}><option value="">— Select —</option>{(lists.regions||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Product Category</label><select className="form-select" value={modal.form.category} onChange={e => modal.set('category', e.target.value)}><option value="">— Select —</option>{(lists.prodCategories||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">SKU</label><input className="form-input" value={modal.form.sku} onChange={e => modal.set('sku', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Quantity</label><input className="form-input" type="number" value={modal.form.qty} onChange={e => modal.set('qty', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Unit</label><select className="form-select" value={modal.form.unit} onChange={e => modal.set('unit', e.target.value)}>{(lists.units||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Lead Details</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Lead Source</label><select className="form-select" value={modal.form.source} onChange={e => modal.set('source', e.target.value)}><option value="">— Select —</option>{(lists.leadSources||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Tender Ref No.</label><input className="form-input" value={modal.form.tenderRef} onChange={e => modal.set('tenderRef', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Bid Due Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.bidDate)} onChange={e => modal.set('bidDate', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Estimated Value (₹)</label><input className="form-input" type="number" value={modal.form.estValue} onChange={e => modal.set('estValue', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Stage</label><select className="form-select" value={modal.form.stage} onChange={e => modal.set('stage', e.target.value)}>{(lists.leadStages||['New Enquiry','Qualified','Proposal Submitted','Negotiation','PO Received','Closed Lost']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Priority</label><select className="form-select" value={modal.form.priority} onChange={e => modal.set('priority', e.target.value)}>{['Critical','High','Medium','Low'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Sales Rep</label><select className="form-select" value={modal.form.salesRep} onChange={e => modal.set('salesRep', e.target.value)}><option value="">— Select —</option>{(lists.salesReps||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Follow-up Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.followUp)} onChange={e => modal.set('followUp', e.target.value)} /></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e => modal.set('notes', e.target.value)} /></div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} title="Delete Lead" message="Move this lead to trash? It can be restored later." danger />
    </div>
  )
}
