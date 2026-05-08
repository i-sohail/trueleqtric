import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { vendor:'', procId:'', vendorInvNo:'', invDate:'', dueDate:'', milestone:'', invoiceAmt:'', gst:0, amtPaid:0, payDate:'', status:'Pending', payMode:'', bankRef:'', itcClaimed:false, approvedBy:'', notes:'' }

export default function AP() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const { data, isLoading } = useQuery({ queryKey:['ap'], queryFn:()=>apApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['ap-stats'], queryFn: apApi.getStats })
  const save = useMutation({ mutationFn: d => modal.isEditing ? apApi.update(modal.editId, d) : apApi.create(d), onSuccess: res => { qc.invalidateQueries(['ap']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: apApi.remove, onSuccess:()=>{ qc.invalidateQueries(['ap']); toast.success('Moved to trash') } })

  const columns = [
    { key:'apId', label:'AP ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'vendor', label:'Vendor', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.vendorInvNo}</div></div> },
    { key:'invoiceAmt', label:'Invoice Amt', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'gst', label:'GST', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:11}}>{fmtCurrency(v)}</span> },
    { key:'amtPaid', label:'Paid', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',color:'var(--green)'}}>{fmtCurrency(v)}</span> },
    { key:'dueDate', label:'Due Date', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'milestone', label:'Milestone', render:v=><span style={{fontSize:11,color:'var(--text3)'}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Accounts Payable" icon="↓" subtitle="Track vendor invoices and payments"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ AP Entry</button>}
      />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Payable" value={fmtCurrency(stats?.totalPayable||0)} sub="all bills" icon="↓" accent="var(--orange)" />
        <KPICard label="Total Paid" value={fmtCurrency(stats?.totalPaid||0)} sub="paid out" icon="✓" accent="var(--green)" />
        <KPICard label="Pending" value={fmtCurrency(stats?.totalPending||0)} sub={`${stats?.pendingCount||0} bills`} icon="⚠" accent="var(--amber)" />
      </div>
      <DataTable title="All AP Entries" icon="↓" columns={columns} data={data?.data||[]} loading={isLoading} filters={['Pending','Payment Done','Overdue','Disputed']} onRowClick={modal.openEdit} searchPlaceholder="Search AP…" />
      <Modal open={modal.open} onClose={modal.close} icon="↓" title={modal.isEditing?'Edit AP Entry':'New AP Entry'} onSave={()=>save.mutate(modal.form)}>
        <div className="form-grid">
          <div className="form-field form-full"><label className="form-label">Vendor <span className="req">*</span></label><input className="form-input" value={modal.form.vendor} onChange={e=>modal.set('vendor',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Procurement PO Ref</label><input className="form-input" value={modal.form.procId} onChange={e=>modal.set('procId',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Vendor Invoice No. <span className="req">*</span></label><input className="form-input" value={modal.form.vendorInvNo} onChange={e=>modal.set('vendorInvNo',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Invoice Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.invDate)} onChange={e=>modal.set('invDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Due Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.dueDate)} onChange={e=>modal.set('dueDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Milestone</label><input className="form-input" value={modal.form.milestone} onChange={e=>modal.set('milestone',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Invoice Amount (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.invoiceAmt} onChange={e=>modal.set('invoiceAmt',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">GST Amount (₹)</label><input className="form-input" type="number" value={modal.form.gst} onChange={e=>modal.set('gst',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Amount Paid (₹)</label><input className="form-input" type="number" value={modal.form.amtPaid} onChange={e=>modal.set('amtPaid',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Payment Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.payDate)} onChange={e=>modal.set('payDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{['Pending','Received - Partial','Payment Done','Overdue','Disputed','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field"><label className="form-label">Payment Mode</label><select className="form-select" value={modal.form.payMode} onChange={e=>modal.set('payMode',e.target.value)}><option value="">— Select —</option>{(lists.payModes||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field"><label className="form-label">Bank Reference</label><input className="form-input" value={modal.form.bankRef} onChange={e=>modal.set('bankRef',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Approved By</label><input className="form-input" value={modal.form.approvedBy} onChange={e=>modal.set('approvedBy',e.target.value)} /></div>
          <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete AP Entry" message="Move this AP entry to trash?" danger />
    </div>
  )
}
