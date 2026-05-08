// client/src/pages/PricingMaster.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogApi, reportsApi } from '../services/modules'
import { PageHeader, KPICard } from '../components/common/ui.jsx'
import { fmtCurrency, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'

export default function PricingMaster() {
  const qc = useQueryClient()
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [historyId, setHistoryId] = useState(null)
  const [filter, setFilter] = useState('')

  const { data, isLoading } = useQuery({ queryKey:['catalog'], queryFn:()=>catalogApi.getAll({limit:500}) })
  const { data: historyData } = useQuery({ queryKey:['price-history',historyId], queryFn:()=>catalogApi.getPriceHistory(historyId), enabled:!!historyId })

  const updatePrice = useMutation({
    mutationFn: ({id,data}) => catalogApi.updatePrice(id, data),
    onSuccess: () => { qc.invalidateQueries(['catalog']); setEditId(null); toast.success('Price updated') },
  })

  const items = (data?.data||[]).filter(i => !filter || i.category === filter)
  const categories = [...new Set((data?.data||[]).map(i=>i.category).filter(Boolean))]

  const startEdit = (item) => {
    setEditId(item._id)
    setEditForm({ costPrice: item.costPrice, listPrice: item.listPrice, minPrice: item.minPrice, note:'' })
  }

  const handleDownloadExcel = () => {
    window.open(reportsApi.getExcelUrl(), '_blank')
  }

  return (
    <div>
      <PageHeader title="Pricing Master" icon="₹" subtitle="Manage product prices with full change history"
        actions={<div style={{display:'flex',gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadExcel}>⬇ Export Excel</button>
        </div>}
      />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total SKUs" value={String(data?.total||0)} sub="in catalog" icon="▤" accent="var(--blue)" />
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14,padding:'10px 14px',background:'var(--bg2)',borderRadius:8,border:'1px solid var(--border)'}}>
        <span style={{fontSize:11,fontWeight:700,color:'var(--text3)',alignSelf:'center'}}>Filter:</span>
        <button className={`filter-chip ${!filter?'active':''}`} onClick={()=>setFilter('')}>All</button>
        {categories.map(c=><button key={c} className={`filter-chip ${filter===c?'active':''}`} onClick={()=>setFilter(c)}>{c}</button>)}
      </div>

      <div className="card">
        <div style={{overflowX:'auto'}}>
          <table className="data-table" id="pricing-master-table">
            <thead>
              <tr>
                <th>SKU</th><th>Product</th><th>Category</th><th style={{textAlign:'right'}}>Cost Price</th>
                <th style={{textAlign:'right'}}>List Price</th><th style={{textAlign:'right'}}>Min Price</th>
                <th style={{textAlign:'center'}}>Margin %</th><th>Last Updated</th><th>Changes</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={10} style={{textAlign:'center',padding:30,color:'var(--text3)'}}>Loading...</td></tr> :
              items.map(item=>{
                const margin = item.listPrice>0?(item.listPrice-item.costPrice)/item.listPrice*100:0
                const isEditRow = editId === item._id
                return <tr key={item._id} style={{background:isEditRow?'var(--blue-light)':'transparent'}}>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--text3)'}}>{item.sku}</td>
                  <td style={{fontWeight:500,maxWidth:200}}>{item.name}</td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{item.category}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>
                    {isEditRow ? <input type="number" className="form-input" style={{width:100,textAlign:'right'}} value={editForm.costPrice} onChange={e=>setEditForm(f=>({...f,costPrice:e.target.value}))} /> : fmtCurrency(item.costPrice)}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:600}}>
                    {isEditRow ? <input type="number" className="form-input" style={{width:100,textAlign:'right'}} value={editForm.listPrice} onChange={e=>setEditForm(f=>({...f,listPrice:e.target.value}))} /> : fmtCurrency(item.listPrice)}
                  </td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>
                    {isEditRow ? <input type="number" className="form-input" style={{width:100,textAlign:'right'}} value={editForm.minPrice} onChange={e=>setEditForm(f=>({...f,minPrice:e.target.value}))} /> : fmtCurrency(item.minPrice)}
                  </td>
                  <td style={{textAlign:'center'}}>
                    <span className={margin>=25?'margin-high':margin>=15?'margin-mid':margin>=0?'margin-low':'margin-neg'}>{margin.toFixed(1)}%</span>
                  </td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(item.updatedAt)}</td>
                  <td style={{textAlign:'center',fontFamily:'var(--font-mono)',fontSize:11}}>{(item.priceHistory||[]).length}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      {isEditRow ? (
                        <>
                          <input className="form-input" style={{width:120,fontSize:11}} placeholder="Change reason..." value={editForm.note} onChange={e=>setEditForm(f=>({...f,note:e.target.value}))} />
                          <button className="btn btn-primary btn-xs" onClick={()=>updatePrice.mutate({id:item._id,data:editForm})}>Save</button>
                          <button className="btn btn-ghost btn-xs" onClick={()=>setEditId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-row-action" onClick={()=>startEdit(item)}>✎ Edit</button>
                          <button className="btn-row-action" onClick={()=>setHistoryId(item._id)}>📋 History</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>

      {historyId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(3px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)setHistoryId(null)}}>
          <div style={{background:'var(--bg1)',border:'1px solid var(--border2)',borderRadius:'var(--radius-lg)',width:'min(700px,96vw)',maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'var(--shadow-lg)'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:15,fontWeight:700}}>📋 Price History — {historyData?.data?.name}</div>
              <button onClick={()=>setHistoryId(null)} style={{background:'none',border:'1px solid var(--border2)',width:28,height:28,borderRadius:'var(--radius)',cursor:'pointer',fontSize:14,color:'var(--text3)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              <table className="data-table">
                <thead><tr><th>Date</th><th style={{textAlign:'right'}}>Cost</th><th style={{textAlign:'right'}}>List</th><th style={{textAlign:'right'}}>Min</th><th>Note</th><th>Changed By</th></tr></thead>
                <tbody>
                  {(historyData?.data?.priceHistory||[]).slice().reverse().map((h,i)=>(
                    <tr key={i}>
                      <td style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(h.date)}</td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>{fmtCurrency(h.costPrice)}</td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(h.listPrice)}</td>
                      <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>{fmtCurrency(h.minPrice)}</td>
                      <td style={{fontSize:11,color:'var(--text2)'}}>{h.note||'—'}</td>
                      <td style={{fontSize:11}}>{h.changedBy||'—'}</td>
                    </tr>
                  ))}
                  {!(historyData?.data?.priceHistory?.length) && <tr><td colSpan={6} style={{textAlign:'center',padding:20,color:'var(--text3)'}}>No price history yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
