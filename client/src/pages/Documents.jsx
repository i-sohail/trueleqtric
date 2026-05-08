// client/src/pages/Documents.jsx
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../services/modules'
import { PageHeader, KPICard, ConfirmDialog } from '../components/common/ui.jsx'
import { fmtDate } from '../utils/format'
import toast from 'react-hot-toast'

const CATEGORIES = ['Customer PO Scan','Bank Guarantee','Letter of Credit','Inspection Certificate','Test Certificate','Insurance Policy','Warranty Card','Compliance Document','Tender Document','GST Invoice','Delivery Challan','Other']

export default function Documents() {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [deleteId, setDeleteId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [uploadForm, setUploadForm] = useState({ title:'', category:'Other', linkedType:'', linkedTo:'', notes:'' })
  const [showUpload, setShowUpload] = useState(false)

  const { data, isLoading } = useQuery({ queryKey:['documents',filterCat,search], queryFn:()=>documentsApi.getAll({category:filterCat||undefined,search:search||undefined}) })
  const remove = useMutation({ mutationFn: documentsApi.remove, onSuccess:()=>{ qc.invalidateQueries(['documents']); toast.success('Document deleted') } })

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error('Please select a file'); return }
    if (!uploadForm.title) { toast.error('Title is required'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      Object.entries(uploadForm).forEach(([k,v]) => { if(v) fd.append(k, v) })
      await documentsApi.upload(fd)
      qc.invalidateQueries(['documents'])
      setShowUpload(false)
      setUploadForm({ title:'', category:'Other', linkedType:'', linkedTo:'', notes:'' })
      if (fileRef.current) fileRef.current.value = ''
      toast.success('Document uploaded successfully')
    } catch(e) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const docs = data?.data || []

  const getMimeIcon = (mime) => {
    if (!mime) return '📄'
    if (mime.includes('pdf')) return '📕'
    if (mime.includes('image')) return '🖼️'
    if (mime.includes('word') || mime.includes('document')) return '📝'
    if (mime.includes('excel') || mime.includes('sheet')) return '📊'
    return '📄'
  }

  const fmtSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes > 1048576) return (bytes/1048576).toFixed(1) + ' MB'
    if (bytes > 1024) return (bytes/1024).toFixed(0) + ' KB'
    return bytes + ' B'
  }

  return (
    <div>
      <PageHeader title="Documents (DMS)" icon="📎" subtitle="Upload and manage project documents, certificates, and contracts"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>setShowUpload(true)}>+ Upload Document</button>}
      />

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14,padding:'10px 14px',background:'var(--bg2)',borderRadius:8,border:'1px solid var(--border)',alignItems:'center'}}>
        <button className={`filter-chip ${!filterCat?'active':''}`} onClick={()=>setFilterCat('')}>All</button>
        {CATEGORIES.map(c=><button key={c} className={`filter-chip ${filterCat===c?'active':''}`} onClick={()=>setFilterCat(c)}>{c}</button>)}
        <div style={{marginLeft:'auto',position:'relative'}}>
          <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',fontSize:12}}>⌕</span>
          <input className="form-input" style={{paddingLeft:27,width:180}} placeholder="Search docs..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {showUpload && (
        <div className="card mb-16" style={{borderLeft:'3px solid var(--blue)'}}>
          <div className="card-head"><div style={{fontSize:12,fontWeight:600}}>📎 Upload New Document</div><button onClick={()=>setShowUpload(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:16}}>✕</button></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-field form-full">
                <label className="form-label">File <span className="req">*</span></label>
                <input type="file" ref={fileRef} className="form-input" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx" onChange={e=>{ if(!uploadForm.title&&e.target.files[0]) setUploadForm(f=>({...f,title:e.target.files[0].name.replace(/\.[^.]+$/,'')})) }} />
              </div>
              <div className="form-field form-full"><label className="form-label">Title <span className="req">*</span></label><input className="form-input" value={uploadForm.title} onChange={e=>setUploadForm(f=>({...f,title:e.target.value}))} placeholder="Document title..." /></div>
              <div className="form-field"><label className="form-label">Category</label><select className="form-select" value={uploadForm.category} onChange={e=>setUploadForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-field"><label className="form-label">Link To</label><select className="form-select" value={uploadForm.linkedType} onChange={e=>setUploadForm(f=>({...f,linkedType:e.target.value}))}><option value="">— No link —</option><option value="salespo">Sales PO</option><option value="procurement">Purchase PO</option><option value="leads">Lead</option><option value="tenders">Tender</option><option value="customers">Customer</option></select></div>
              <div className="form-field"><label className="form-label">Linked Record ID</label><input className="form-input" value={uploadForm.linkedTo} onChange={e=>setUploadForm(f=>({...f,linkedTo:e.target.value}))} placeholder="e.g. SPO-2025-001" /></div>
              <div className="form-field form-full"><label className="form-label">Notes</label><textarea className="form-textarea" value={uploadForm.notes} onChange={e=>setUploadForm(f=>({...f,notes:e.target.value}))} rows={2} /></div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button className="btn btn-ghost" onClick={()=>setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>{uploading?'Uploading...':'📎 Upload'}</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading...</div> :
      docs.length === 0 ? (
        <div className="empty-state"><div style={{fontSize:36,marginBottom:10,opacity:0.2}}>📎</div><div style={{fontSize:13,color:'var(--text2)',marginBottom:4}}>No Documents Found</div><div style={{fontSize:11,color:'var(--text3)'}}>Upload documents using the button above</div></div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Document</th><th>Category</th><th>Linked To</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead>
            <tbody>
              {docs.map(doc=>(
                <tr key={doc._id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:20}}>{getMimeIcon(doc.mimeType)}</span>
                      <div><div style={{fontWeight:500,fontSize:12}}>{doc.title}</div><div style={{fontSize:10,color:'var(--text3)'}}>{doc.originalName||''}</div></div>
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{doc.category}</span></td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{doc.linkedType&&doc.linkedTo?`${doc.linkedType}: ${doc.linkedTo}`:'—'}</td>
                  <td style={{fontSize:11,color:'var(--text3)'}}>{fmtSize(doc.fileSize)}</td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(doc.uploadedDate||doc.createdAt)}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <a href={documentsApi.getDownloadUrl(doc._id)} target="_blank" rel="noreferrer" className="btn-row-action" style={{textDecoration:'none'}}>⬇ Download</a>
                      <button className="btn-row-action del" onClick={()=>setDeleteId(doc._id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Document" message="Permanently delete this document and its file?" danger />
    </div>
  )
}
