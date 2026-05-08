// client/src/pages/AR.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { arApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtDate, fmtDateInput, getOverdueDays } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { customer:'', spoId:'', invoiceNo:'', invoiceDate:'', dueDate:'', milestone:'', invoiceAmt:'', cgst:0, sgst:0, igst:0, amtReceived:0, receivedDate:'', status:'Pending', payMode:'', txnRef:'', salesRep:'', notes:'' }

export default function AR() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState({ amount:'', date:'', mode:'RTGS', ref:'' })

  const { data, isLoading } = useQuery({ queryKey:['ar'], queryFn:()=>arApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['ar-stats'], queryFn: arApi.getStats })

  const save = useMutation({
    mutationFn: d => modal.isEditing ? arApi.update(modal.editId, d) : arApi.create(d),
    onSuccess: res => { qc.invalidateQueries(['ar']); modal.close(); toast.success(res.message) },
  })
  const remove = useMutation({ mutationFn: arApi.remove, onSuccess:()=>{ qc.invalidateQueries(['ar']); toast.success('Moved to trash') } })
  const recordPay = useMutation({
    mutationFn: ({id, data}) => arApi.recordPayment(id, data),
    onSuccess: () => { qc.invalidateQueries(['ar']); setPayModal(null); toast.success('Payment recorded') },
  })

  const columns = [
    { key:'arId', label:'AR ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'customer', label:'Customer', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.invoiceNo}</div></div> },
    { key:'invoiceAmt', label:'Invoice Amt', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'amtReceived', label:'Received', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',color:'var(--green)'}}>{fmtCurrency(v)}</span> },
    { key:'invoiceAmt', label:'Outstanding', align:'right', render:(v,r)=>{
      const out=(r.invoiceAmt||0)-(r.amtReceived||0)
      return <span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:out>0?'var(--red)':'var(--text3)'}}>{out>0?fmtCurrency(out):'—'}</span>
    }},
    { key:'dueDate', label:'Due Date', render:(v,r)=>{
      const od=getOverdueDays(v,r.status)
      return <div><div style={{fontSize:11,color:od>0?'var(--red)':'var(--text2)'}}>{fmtDate(v)}</div>{od>0&&<div style={{fontSize:10,color:'var(--red)',fontWeight:600}}>{od}d overdue</div>}</div>
    }},
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'milestone', label:'Milestone', render:v=><span style={{fontSize:11,color:'var(--text3)'}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=>(
      <div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
        <button className="btn-row-action go" onClick={()=>{ setPayModal(r._id); setPayForm({amount:'',date:'',mode:'RTGS',ref:''}) }}>💳 Pay</button>
        <button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button>
        <button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Accounts Receivable" icon="↑" subtitle="Track customer invoices and payment collection"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ AR Entry</button>}
      />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Invoiced" value={fmtCurrency(stats?.totalInvoiced||0)} sub="all invoices" icon="↑" accent="var(--blue)" />
        <KPICard label="Total Collected" value={fmtCurrency(stats?.totalCollected||0)} sub="received" icon="✓" accent="var(--green)" />
        <KPICard label="Outstanding" value={fmtCurrency(stats?.totalOutstanding||0)} sub="to collect" icon="◎" accent="var(--amber)" />
        <KPICard label="Overdue" value={fmtCurrency(stats?.totalOverdue||0)} sub={`${stats?.overdueCount||0} invoices`} icon="⚠" accent="var(--red)" />
      </div>
      <DataTable title="All AR Entries" icon="↑" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Pending','Received - Partial','Received - Full','Overdue','Disputed']}
        onRowClick={modal.openEdit} searchPlaceholder="Search AR…"
      />
      <Modal open={modal.open} onClose={modal.close} icon="↑" title={modal.isEditing?'Edit AR Entry':'New AR Entry'} onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}>
        <div className="form-grid">
          <div className="form-field form-full"><label className="form-label">Customer <span className="req">*</span></label><input className="form-input" value={modal.form.customer} onChange={e=>modal.set('customer',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Sales PO Ref</label><input className="form-input" value={modal.form.spoId} onChange={e=>modal.set('spoId',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Invoice No. <span className="req">*</span></label><input className="form-input" value={modal.form.invoiceNo} onChange={e=>modal.set('invoiceNo',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Invoice Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.invoiceDate)} onChange={e=>modal.set('invoiceDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Due Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.dueDate)} onChange={e=>modal.set('dueDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Milestone</label><input className="form-input" placeholder="e.g. Advance 30%" value={modal.form.milestone} onChange={e=>modal.set('milestone',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Invoice Amount (₹) <span className="req">*</span></label><input className="form-input" type="number" value={modal.form.invoiceAmt} onChange={e=>modal.set('invoiceAmt',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">CGST (₹)</label><input className="form-input" type="number" value={modal.form.cgst} onChange={e=>modal.set('cgst',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">SGST (₹)</label><input className="form-input" type="number" value={modal.form.sgst} onChange={e=>modal.set('sgst',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">IGST (₹)</label><input className="form-input" type="number" value={modal.form.igst} onChange={e=>modal.set('igst',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Amount Received (₹)</label><input className="form-input" type="number" value={modal.form.amtReceived} onChange={e=>modal.set('amtReceived',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Received Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.receivedDate)} onChange={e=>modal.set('receivedDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{(lists.payStatuses||['Pending','Received - Full','Received - Partial','Overdue']).map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field"><label className="form-label">Payment Mode</label><select className="form-select" value={modal.form.payMode} onChange={e=>modal.set('payMode',e.target.value)}><option value="">— Select —</option>{(lists.payModes||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field"><label className="form-label">Transaction Ref</label><input className="form-input" value={modal.form.txnRef} onChange={e=>modal.set('txnRef',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Sales Rep</label><select className="form-select" value={modal.form.salesRep} onChange={e=>modal.set('salesRep',e.target.value)}><option value="">— Select —</option>{(lists.salesReps||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
        </div>
      </Modal>
      {payModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(3px)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--bg1)',border:'1px solid var(--border2)',borderRadius:'var(--radius-lg)',width:'min(440px,94vw)',overflow:'hidden',boxShadow:'var(--shadow-lg)'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text0)'}}>💳 Record Payment</div>
            </div>
            <div style={{padding:20}}>
              <div className="form-grid">
                <div className="form-field form-full"><label className="form-label">Amount (₹) <span className="req">*</span></label><input className="form-input" type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} /></div>
                <div className="form-field"><label className="form-label">Date</label><input className="form-input" type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))} /></div>
                <div className="form-field"><label className="form-label">Mode</label><select className="form-select" value={payForm.mode} onChange={e=>setPayForm(f=>({...f,mode:e.target.value}))}>{(lists.payModes||['RTGS','NEFT','Cheque']).map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="form-field form-full"><label className="form-label">Transaction Ref</label><input className="form-input" value={payForm.ref} onChange={e=>setPayForm(f=>({...f,ref:e.target.value}))} /></div>
              </div>
            </div>
            <div style={{padding:'12px 20px',borderTop:'1px solid var(--border)',background:'var(--bg2)',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setPayModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>recordPay.mutate({id:payModal,data:payForm})}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete AR Entry" message="Move this AR entry to trash?" danger />
    </div>
  )
}
