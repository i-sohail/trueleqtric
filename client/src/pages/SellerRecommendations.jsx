import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellersApi } from '../services/modules'
import { PageHeader } from '../components/common/ui.jsx'
import toast from 'react-hot-toast'

const QUICK_SEARCHES = ['Transformers','Solar Panels','Cables','Battery Storage','EV Charging','Inverters','Switchgear','Smart Meters','Wind']

export default function SellerRecommendations() {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { data, isLoading } = useQuery({ queryKey:['sellers',submitted], queryFn:()=>sellersApi.getAll({search:submitted}), enabled:true })
  const addVendor = useMutation({
    mutationFn: ({sellerIndex}) => sellersApi.addAsVendor({sellerIndex}),
    onSuccess: res => { qc.invalidateQueries(['vendors']); toast.success(res.message) },
  })
  const sellers = data?.data || []

  return (
    <div>
      <PageHeader title="Seller Recommendations" icon="🔍" subtitle={`Search our curated database of ${data?.total||0} verified Indian power & energy sector suppliers`} />
      <div className="card mb-16">
        <div className="card-head"><div style={{fontSize:12,fontWeight:600}}>🔍 Search for New Suppliers</div></div>
        <div className="card-body">
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
            {QUICK_SEARCHES.map(q=><button key={q} className="filter-chip" onClick={()=>{ setQuery(q); setSubmitted(q) }}>{q}</button>)}
            <button className="filter-chip" onClick={()=>{ setQuery(''); setSubmitted('') }}>Show All</button>
          </div>
          <div style={{display:'flex',gap:8}}>
            <input className="form-input" style={{flex:1,maxWidth:500}} placeholder="Search by name, product, city, category…" value={query}
              onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') setSubmitted(query) }} />
            <button className="btn btn-primary" onClick={()=>setSubmitted(query)}>🔍 Search</button>
          </div>
          <div style={{marginTop:8,fontSize:12,color:'var(--text3)'}}>{sellers.length} suppliers {submitted?`matching "${submitted}"`:'in database'}</div>
        </div>
      </div>
      <div>
        {isLoading ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading…</div> :
         sellers.map((s,idx)=>(
          <div key={idx} className="card mb-16" style={{padding:'14px 18px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:14,fontWeight:700,color:'var(--text0)'}}>{s.name}</span>
                  <span className="badge badge-blue">{s.type}</span>
                  <span className="badge badge-gray">{s.category}</span>
                </div>
                <div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>📦 {s.products}</div>
                <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:11,color:'var(--text3)'}}>
                  {s.city&&<span>📍 {s.city}{s.region&&s.region!==s.city?', '+s.region:''}</span>}
                  {s.website&&<span>🌐 <a href={s.website} target="_blank" rel="noreferrer" style={{color:'var(--blue)'}}>{s.website.replace('https://','')}</a></span>}
                  {s.email&&<span>✉ {s.email}</span>}
                  {s.phone&&<span>📞 {s.phone}</span>}
                </div>
                {s.notes&&<div style={{fontSize:11,color:'var(--text3)',marginTop:5,fontStyle:'italic'}}>{s.notes}</div>}
              </div>
              <button className="btn btn-success btn-sm" onClick={()=>addVendor.mutate({sellerIndex:idx})}>+ Add as Vendor</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
