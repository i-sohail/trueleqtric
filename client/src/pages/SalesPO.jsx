// client/src/pages/SalesPO.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salespoApi, reportsApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, StatusBadge } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtCurrency, fmtPct, fmtDate, fmtDateInput, calcSPO } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { customer:'', quoteId:'', items:[], sku:'', product:'', category:'', qty:1, unit:'Nos.', make:'', unitPrice:'', unitCost:'', gstRate:'18%', incoterm:'', poDate:'', delivDate:'', status:'Order Confirmed', salesRep:'', paymentTerms:'', ldTerms:'', warrantyTerms:'', freightCost:0, ldDeduction:0, notes:'' }

export default function SalesPO() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const [arModal, setArModal] = useState(null)

  const { data, isLoading } = useQuery({ queryKey:['salespo'], queryFn:()=>salespoApi.getAll({limit:500}) })
  const { data: stats } = useQuery({ queryKey:['salespo-stats'], queryFn: salespoApi.getStats })

  const save = useMutation({
    mutationFn: d => modal.isEditing ? salespoApi.update(modal.editId, d) : salespoApi.create(d),
    onSuccess: res => { qc.invalidateQueries(['salespo']); modal.close(); toast.success(res.message) },
  })
  const remove = useMutation({ mutationFn: salespoApi.remove, onSuccess:()=>{ qc.invalidateQueries(['salespo']); toast.success('Moved to trash') } })
  const createAR = useMutation({
    mutationFn: ({id,data}) => salespoApi.createAR(id, data),
    onSuccess: () => { qc.invalidateQueries(['ar']); setArModal(null); toast.success('AR entry created!') },
  })
  const createProc = useMutation({
    mutationFn: ({id,data}) => salespoApi.createProcurement(id, data),
    onSuccess: () => { qc.invalidateQueries(['procurement']); toast.success('Procurement PO created!') },
  })

  const addItem = () => modal.set('items', [...(modal.form.items||[]), { sku:'', product:'', qty:1, unit:'Nos.', make:'', unitCost:0, unitPrice:0, discount:0, gstRate:'18%' }])
  const removeItem = i => modal.set('items', modal.form.items.filter((_,idx)=>idx!==i))
  const updateItem = (i, f, v) => { const items=[...modal.form.items]; items[i]={...items[i],[f]:v}; modal.set('items',items) }

  const calc = calcSPO(modal.form)

  const columns = [
    { key:'spoId', label:'SPO ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'customer', label:'Customer', render:(v,r)=><div><div style={{fontWeight:500}}>{v}</div><div style={{fontSize:10,color:'var(--text3)'}}>{r.quoteId||''}</div></div> },
    { key:'rev', label:'Revenue', align:'right', render:(v,r)=><span style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(calcSPO(r).rev)}</span> },
    { key:'marginPct', label:'Margin', align:'right', render:(v,r)=>{ const c=calcSPO(r); return <span className={c.marginPct>=0.2?'margin-high':c.marginPct>=0.1?'margin-mid':'margin-low'}>{fmtPct(c.marginPct)}</span> }},
    { key:'status', label:'Status', render:v=><StatusBadge status={v} /> },
    { key:'poDate', label:'PO Date', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'delivDate', label:'Delivery', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'salesRep', label:'Rep', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=>(
      <div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
        <button className="btn-row-action" onClick={()=>window.open(reportsApi.getDocumentUrl('salespo',r._id),'_blank')} title="Print">🖨</button>
        <button className="btn-row-action" onClick={()=>setArModal(r._id)} title="Create AR">+AR</button>
        <button className="btn-row-action" onClick={()=>createProc.mutate({id:r._id,data:{vendor:'',buyer:''}})} title="Create Proc PO">+PPO</button>
        <button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button>
        <button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Sales Orders" icon="▣" subtitle="Track sales orders from confirmation to closure"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ New Sales PO</button>}
      />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Revenue" value={fmtCurrency(stats?.totalRevenue||0)} sub="all orders" icon="₹" accent="var(--green)" />
        <KPICard label="Avg Margin" value={fmtPct(stats?.avgMargin||0)} sub="gross margin" icon="%" accent="var(--amber)" />
        <KPICard label="Active Orders" value={String(stats?.active||0)} sub="not closed" icon="▣" accent="var(--blue)" />
        <KPICard label="Total Orders" value={String(stats?.total||0)} sub="all time" icon="◎" accent="var(--purple)" />
      </div>
      <DataTable title="All Sales Orders" icon="▣" columns={columns} data={data?.data||[]} loading={isLoading}
        filters={['Order Confirmed','Procurement Initiated','In Transit','Delivered','Commissioned','Invoiced','Closed']}
        onRowClick={modal.openEdit} searchPlaceholder="Search sales orders…"
      />
      <Modal open={modal.open} onClose={modal.close} icon="▣" size="lg"
        title={modal.isEditing?'Edit Sales PO':'New Sales PO'}
        onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update':'Save'}
        footerLeft={<span style={{fontSize:11,color:'var(--text3)'}}>Revenue: <strong style={{fontFamily:'var(--font-mono)',color:'var(--green)'}}>{fmtCurrency(calc.rev)}</strong> · Margin: <strong style={{color:calc.marginPct>=0.2?'var(--green)':'var(--amber)'}}>{fmtPct(calc.marginPct)}</strong></span>}
      >
        <div className="form-section"><div className="form-section-title">Order Details</div>
          <div className="form-grid">
            <div className="form-field form-full"><label className="form-label">Customer <span className="req">*</span></label><input className="form-input" value={modal.form.customer} onChange={e=>modal.set('customer',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Quote Ref</label><input className="form-input" value={modal.form.quoteId} onChange={e=>modal.set('quoteId',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Status</label><select className="form-select" value={modal.form.status} onChange={e=>modal.set('status',e.target.value)}>{(lists.poStatuses||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">PO Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.poDate)} onChange={e=>modal.set('poDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Delivery Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.delivDate)} onChange={e=>modal.set('delivDate',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Sales Rep</label><select className="form-select" value={modal.form.salesRep} onChange={e=>modal.set('salesRep',e.target.value)}><option value="">— Select —</option>{(lists.salesReps||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Incoterm</label><select className="form-select" value={modal.form.incoterm} onChange={e=>modal.set('incoterm',e.target.value)}><option value="">— Select —</option>{(lists.incoterms||[]).map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Line Items</div>
          <div style={{overflowX:'auto',marginBottom:8}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:'var(--bg3)'}}>{['#','Product','Qty','Unit','Make','Cost','Price','Disc%','GST','Total',''].map(h=><th key={h} style={{padding:'5px 6px',textAlign:'left',fontWeight:700,color:'var(--text3)',fontSize:10,borderBottom:'1px solid var(--border)'}}>{h}</th>)}</tr></thead>
              <tbody>
                {(modal.form.items||[]).map((it,i)=>{
                  const net=(parseFloat(it.unitPrice)||0)*(1-(parseFloat(it.discount)||0)/100)
                  const line=net*(parseFloat(it.qty)||0)
                  return <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'3px 6px',color:'var(--text3)'}}>{i+1}</td>
                    <td style={{padding:'3px 3px'}}><input className="form-input" style={{minWidth:120}} value={it.product} onChange={e=>updateItem(i,'product',e.target.value)} /></td>
                    <td style={{padding:'3px 3px'}}><input className="form-input" type="number" style={{width:55}} value={it.qty} onChange={e=>updateItem(i,'qty',e.target.value)} /></td>
                    <td style={{padding:'3px 3px'}}><select className="form-select" style={{minWidth:60}} value={it.unit} onChange={e=>updateItem(i,'unit',e.target.value)}>{(lists.units||['Nos.','Meters']).map(u=><option key={u}>{u}</option>)}</select></td>
                    <td style={{padding:'3px 3px'}}><input className="form-input" style={{minWidth:60}} value={it.make} onChange={e=>updateItem(i,'make',e.target.value)} /></td>
                    <td style={{padding:'3px 3px'}}><input className="form-input" type="number" style={{width:80}} value={it.unitCost} onChange={e=>updateItem(i,'unitCost',e.target.value)} /></td>
                    <td style={{padding:'3px 3px'}}><input className="form-input" type="number" style={{width:80}} value={it.unitPrice} onChange={e=>updateItem(i,'unitPrice',e.target.value)} /></td>
                    <td style={{padding:'3px 3px'}}><input className="form-input" type="number" style={{width:50}} value={it.discount} onChange={e=>updateItem(i,'discount',e.target.value)} /></td>
                    <td style={{padding:'3px 3px'}}><select className="form-select" style={{minWidth:60}} value={it.gstRate} onChange={e=>updateItem(i,'gstRate',e.target.value)}>{['0%','5%','12%','18%','28%'].map(r=><option key={r}>{r}</option>)}</select></td>
                    <td style={{padding:'3px 6px',fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,textAlign:'right',color:'var(--blue)'}}>{fmtCurrency(line)}</td>
                    <td style={{padding:'3px 3px'}}><button onClick={()=>removeItem(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer'}}>✕</button></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Line Item</button>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
            <div className="form-field"><label className="form-label">Freight Cost (₹)</label><input className="form-input" type="number" value={modal.form.freightCost} onChange={e=>modal.set('freightCost',e.target.value)} /></div>
            <div className="form-field"><label className="form-label">LD Deduction (₹)</label><input className="form-input" type="number" value={modal.form.ldDeduction} onChange={e=>modal.set('ldDeduction',e.target.value)} /></div>
          </div>
        </div>
        <div className="form-section"><div className="form-section-title">Contract Terms</div>
          <div className="form-grid">
            <div className="form-field"><label className="form-label">Payment Terms</label><select className="form-select" value={modal.form.paymentTerms} onChange={e=>modal.set('paymentTerms',e.target.value)}><option value="">— Select —</option>{(lists.paymentTermsOptions||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">LD Terms</label><select className="form-select" value={modal.form.ldTerms} onChange={e=>modal.set('ldTerms',e.target.value)}><option value="">— Select —</option>{(lists.ldTerms||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="form-label">Warranty Terms</label><select className="form-select" value={modal.form.warrantyTerms} onChange={e=>modal.set('warrantyTerms',e.target.value)}><option value="">— Select —</option>{(lists.warrantyTerms||[]).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Sales PO" message="Move this sales PO to trash?" danger />
    </div>
  )
}
