// client/src/pages/Quotations.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotationsApi, reportsApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtPct, calcQuote } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { customer:'', leadId:'', items:[], sku:'', product:'', category:'', qty:1, unit:'Nos.', make:'', unitCost:'', unitPrice:'', discount:0, gstRate:'18%', validity:30, status:'Draft', salesRep:'', delivTerms:'', payTerms:'', incoterm:'', warranty:'', notes:'' }

export default function Quotations() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({ queryKey:['quotations'], queryFn:()=>quotationsApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['quotations-stats'], queryFn: quotationsApi.getStats })

  const save = useMutation({
    mutationFn: d => modal.isEditing ? quotationsApi.update(modal.editId, d) : quotationsApi.create(d),
    onSuccess: res => { qc.invalidateQueries(['quotations']); modal.close(); toast.success(res.message) },
  })
  const remove = useMutation({ mutationFn: quotationsApi.remove, onSuccess:()=>{ qc.invalidateQueries(['quotations']); toast.success('Moved to trash') } })
  const convertToPO = useMutation({
    mutationFn: quotationsApi.convertToPO,
    onSuccess: () => { qc.invalidateQueries(['quotations']); qc.invalidateQueries(['salespo']); toast.success('Converted to Sales PO!') },
  })

  const addItem = () => modal.set('items', [...(modal.form.items||[]), { sku:'', product:'', qty:1, unit:'Nos.', make:'', unitCost:0, unitPrice:0, discount:0, gstRate:'18%' }])
  const removeItem = (i) => modal.set('items', modal.form.items.filter((_,idx)=>idx!==i))
  const updateItem = (i, f, v) => { const items=[...modal.form.items]; items[i]={...items[i],[f]:v}; modal.set('items',items) }

  const calc = calcQuote(modal.form)

  const columns = [
    { key:'quoteId', label:'Quote ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'customer', label:'Customer', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.leadId||''}</div></div> },
    { key:'total', label:'Total', align:'right', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(v)}</span> },
    { key:'marginPct', label:'Margin', align:'right', render:v=><span className={v>=0.2?'margin-high':v>=0.1?'margin-mid':'margin-low'}>{fmtPct(v)}</span> },
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'validity', label:'Validity', render:v=><span style={{fontSize:11,color:'var(--text3)'}}>{v} days</span> },
    { key:'salesRep', label:'Rep', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=>(
      <div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
        <button className="btn-row-action" onClick={()=>window.open(reportsApi.getDocumentUrl('quotation',r._id),'_blank')} title="Print">🖨</button>
        <button className="btn-row-action convert" onClick={()=>convertToPO.mutate(r._id)}>→PO</button>
        <button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button>
        <button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Quotations" icon="◻" subtitle="Manage quotations, pricing, and convert to sales orders"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Quote</button>}
      />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Quotes" value={String(data?.total||0)} sub="all time" icon="◻" accent="var(--blue)" />
        <KPICard label="Expiring/Active" value={String(stats?.expiring||0)} sub="need action" icon="⚠" accent="var(--amber)" />
      </div>
      <DataTable title="All Quotations" icon="◻" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Draft','Submitted','Under Review','Accepted','Rejected','Converted to PO']}
        onRowClick={modal.openEdit} searchPlaceholder="Search quotations…"
      />
      <Modal open={modal.open} onClose={modal.close} icon="◻" size="lg"
        title={modal.isEditing?'Edit Quotation':'New Quotation'}
        onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}
        footerLeft={<span style={{fontSize:11,color:'var(--text3)'}}>Total: <strong style={{fontFamily:'var(--font-mono)',color:'var(--blue)'}}>{fmtCurrency(calc.total)}</strong> · Margin: <strong style={{color:calc.marginPct>=0.2?'var(--green)':'var(--amber)'}}>{fmtPct(calc.marginPct)}</strong></span>}
      >
        <div className="form-section"><div className="form-section-title">Customer & Reference</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Customer <span className="req">*</span></label><input className="form-input" value={modal.form.customer} onChange={e=>modal.set('customer',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Lead Ref</label><input className="form-input" value={modal.form.leadId} onChange={e=>modal.set('leadId',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{(lists.quoteStatuses||['Draft','Submitted','Accepted','Rejected']).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Sales Rep</label><select className="form-select" value={modal.form.salesRep} onChange={e=>modal.set('salesRep',e.target.value)}><option value="">— Select —</option>{(lists.salesReps||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Validity (Days)</label><input className="form-input" type="number" value={modal.form.validity} onChange={e=>modal.set('validity',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Line Items</div>
          <div style={{overflowX:'auto',marginBottom:8}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:'var(--bg3)'}}>
                {['#','Product','Qty','Unit','Make','Cost(₹)','Price(₹)','Disc%','GST','Total',''].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',fontWeight:700,color:'var(--text3)',fontSize:10,borderBottom:'1px solid var(--border)'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(modal.form.items||[]).map((it,i)=>{
                  const net=(parseFloat(it.unitPrice)||0)*(1-(parseFloat(it.discount)||0)/100)
                  const line=net*(parseFloat(it.qty)||0)
                  return <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'4px 8px',color:'var(--text3)'}}>{i+1}</td>
                    <td style={{padding:'4px 4px'}}><input className="form-input" style={{minWidth:120}} value={it.product} onChange={e=>updateItem(i,'product',e.target.value)} /></td>
                    <td style={{padding:'4px 4px'}}><input className="form-input" type="number" style={{width:60}} value={it.qty} onChange={e=>updateItem(i,'qty',e.target.value)} /></td>
                    <td style={{padding:'4px 4px'}}><select className="form-select" style={{minWidth:65}} value={it.unit} onChange={e=>updateItem(i,'unit',e.target.value)}>{(lists.units||['Nos.','Meters','KG']).map(u=><option key={u}>{u}</option>)}</select></td>
                    <td style={{padding:'4px 4px'}}><input className="form-input" style={{minWidth:70}} value={it.make} onChange={e=>updateItem(i,'make',e.target.value)} /></td>
                    <td style={{padding:'4px 4px'}}><input className="form-input" type="number" style={{width:90}} value={it.unitCost} onChange={e=>updateItem(i,'unitCost',e.target.value)} /></td>
                    <td style={{padding:'4px 4px'}}><input className="form-input" type="number" style={{width:90}} value={it.unitPrice} onChange={e=>updateItem(i,'unitPrice',e.target.value)} /></td>
                    <td style={{padding:'4px 4px'}}><input className="form-input" type="number" style={{width:55}} value={it.discount} onChange={e=>updateItem(i,'discount',e.target.value)} /></td>
                    <td style={{padding:'4px 4px'}}><select className="form-select" style={{minWidth:65}} value={it.gstRate} onChange={e=>updateItem(i,'gstRate',e.target.value)}>{['0%','5%','12%','18%','28%'].map(r=><option key={r}>{r}</option>)}</select></td>
                    <td style={{padding:'4px 8px',fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,textAlign:'right',color:'var(--blue)'}}>{fmtCurrency(line)}</td>
                    <td style={{padding:'4px 4px'}}><button onClick={()=>removeItem(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:14}}>✕</button></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Line Item</button>
        </div>
        <div className="form-section"><div className="form-section-title">Terms</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Delivery Terms</label><input className="form-input" value={modal.form.delivTerms} onChange={e=>modal.set('delivTerms',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Payment Terms</label><select className="form-select" value={modal.form.payTerms} onChange={e=>modal.set('payTerms',e.target.value)}><option value="">— Select —</option>{(lists.paymentTermsOptions||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Incoterm</label><select className="form-select" value={modal.form.incoterm} onChange={e=>modal.set('incoterm',e.target.value)}><option value="">— Select —</option>{(lists.incoterms||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Warranty</label><select className="form-select" value={modal.form.warranty} onChange={e=>modal.set('warranty',e.target.value)}><option value="">— Select —</option>{(lists.warrantyTerms||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Quotation" message="Move this quotation to trash?" danger />
    </div>
  )
}
