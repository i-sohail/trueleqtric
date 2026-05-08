import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listsApi } from '../services/modules'
import { PageHeader } from '../components/common/ui.jsx'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

export default function DropdownLists() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [newVal, setNewVal] = useState('')
  const { data, isLoading } = useQuery({ queryKey:['lists'], queryFn: listsApi.getAll })
  const lists = data?.data || {}

  const addVal = useMutation({
    mutationFn: ({key,value}) => listsApi.addValue(key, value),
    onSuccess: () => { qc.invalidateQueries(['lists']); setNewVal(''); toast.success('Value added') },
  })
  const removeVal = useMutation({
    mutationFn: ({key,value}) => listsApi.removeValue(key, value),
    onSuccess: () => { qc.invalidateQueries(['lists']); toast.success('Value removed') },
  })

  const listKeys = Object.keys(lists)

  return (
    <div>
      <PageHeader title="Dropdown Lists" icon="≡" subtitle="Manage all dropdown options used across the CRM" />
      {isLoading ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading…</div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
          {listKeys.map(key => (
            <div key={key} className="card">
              <div className="card-head">
                <div style={{fontSize:12,fontWeight:600,color:'var(--text1)'}}>{key}</div>
                <span style={{fontSize:10,color:'var(--text3)',background:'var(--bg3)',padding:'1px 6px',borderRadius:10}}>{(lists[key]||[]).length} items</span>
              </div>
              <div className="card-body" style={{maxHeight:200,overflowY:'auto'}}>
                {(lists[key]||[]).map(val=>(
                  <div key={val} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                    <span style={{color:'var(--text1)'}}>{val}</span>
                    <button onClick={()=>removeVal.mutate({key,value:val})} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:12,opacity:0.6,padding:'2px 6px'}} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.6}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{padding:'8px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:6}}>
                <input className="form-input" style={{flex:1,fontSize:11}} placeholder="Add new value…" value={editing===key?newVal:''} onFocus={()=>setEditing(key)} onChange={e=>setNewVal(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&newVal.trim()){ addVal.mutate({key,value:newVal.trim()}); setEditing(null) }}} />
                <button className="btn btn-primary btn-xs" onClick={()=>{ if(newVal.trim()){addVal.mutate({key,value:newVal.trim()});setEditing(null)} }}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
