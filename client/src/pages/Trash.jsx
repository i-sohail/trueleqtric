import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trashApi } from '../services/modules'
import { PageHeader, ConfirmDialog } from '../components/common/ui.jsx'
import { fmtDate } from '../utils/format'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Trash() {
  const qc = useQueryClient()
  const [emptyConfirm, setEmptyConfirm] = useState(false)
  const { data, isLoading } = useQuery({ queryKey:['trash'], queryFn: trashApi.getAll })
  const restore = useMutation({ mutationFn: trashApi.restore, onSuccess: res => { qc.invalidateQueries(['trash']); toast.success(res.message) } })
  const permDelete = useMutation({ mutationFn: trashApi.permanentDelete, onSuccess: () => { qc.invalidateQueries(['trash']); toast.success('Permanently deleted') } })
  const emptyAll = useMutation({ mutationFn: trashApi.emptyTrash, onSuccess: () => { qc.invalidateQueries(['trash']); toast.success('Trash emptied') } })
  const items = data?.data || []

  return (
    <div>
      <PageHeader title="Recycle Bin" icon="🗑" subtitle="Soft-deleted records — restore or permanently delete"
        actions={items.length>0&&<button className="btn btn-danger btn-sm" onClick={()=>setEmptyConfirm(true)}>🗑 Empty Trash ({items.length})</button>}
      />
      {isLoading ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading…</div> :
       items.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:'var(--text3)'}}>
          <div style={{fontSize:48,marginBottom:12,opacity:0.25}}>🗑</div>
          <div style={{fontSize:14,color:'var(--text2)',marginBottom:6}}>Trash is Empty</div>
          <div style={{fontSize:12}}>Deleted records will appear here for 30 days</div>
        </div>
       ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Type</th><th>Record ID</th><th>Name / Description</th><th>Deleted</th><th>Expires</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(item=>(
                <tr key={item._id}>
                  <td><span className="badge badge-gray" style={{textTransform:'uppercase',fontSize:9}}>{item.collection}</span></td>
                  <td style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{item.displayId}</td>
                  <td style={{fontWeight:500}}>{item.displayName}</td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(item.deletedAt)}</td>
                  <td style={{fontSize:11,color:'var(--amber)'}}>{fmtDate(item.expiresAt)}</td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-success btn-xs" onClick={()=>restore.mutate(item.trashId)}>↺ Restore</button>
                      <button className="btn btn-danger btn-xs" onClick={()=>permDelete.mutate(item.trashId)}>🗑 Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       )}
      <ConfirmDialog open={emptyConfirm} onClose={()=>setEmptyConfirm(false)} onConfirm={()=>emptyAll.mutate()} title="Empty Trash" message="Permanently delete ALL items in trash? This cannot be undone." danger />
    </div>
  )
}
