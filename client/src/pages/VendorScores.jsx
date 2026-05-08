// client/src/pages/VendorScores.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorScoresApi } from '../services/modules'
import { useFormModal } from '../hooks/useFormModal'
import { useLists } from '../hooks/useLists'
import { PageHeader, KPICard, ConfirmDialog, ProgressBar } from '../components/common/ui.jsx'
import DataTable from '../components/common/DataTable'
import Modal from '../components/common/Modal'
import { fmtDate, fmtDateInput } from '../utils/format'
import toast from 'react-hot-toast'

const DEFAULTS = { vendor:'', procId:'', reviewDate:'', reviewedBy:'', qualityScore:3, onTimeScore:3, documentationScore:3, responsivenessScore:3, notes:'' }

const ScoreInput = ({ label, field, value, onChange }) => (
  <div className="form-field">
    <label className="form-label">{label} (1–5)</label>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <input className="form-input" type="number" min="1" max="5" step="0.5" value={value} onChange={e=>onChange(field,parseFloat(e.target.value)||3)} style={{maxWidth:80}} />
      <div style={{flex:1}}>
        <ProgressBar value={(value/5)*100} color={value>=4?'var(--green)':value>=3?'var(--amber)':'var(--red)'} height={6} />
      </div>
      <span style={{fontSize:11,fontWeight:700,color:value>=4?'var(--green)':value>=3?'var(--amber)':'var(--red)',minWidth:24}}>{value}</span>
    </div>
  </div>
)

export default function VendorScores() {
  const qc = useQueryClient()
  const lists = useLists()
  const modal = useFormModal(DEFAULTS)
  const [deleteId, setDeleteId] = useState(null)
  const [view, setView] = useState('scorecard')
  const { data: scorecard, isLoading: scLoading } = useQuery({ queryKey:['vendor-scorecard'], queryFn: vendorScoresApi.getScorecard })
  const { data: reviews, isLoading: rvLoading } = useQuery({ queryKey:['vendor-scores'], queryFn:()=>vendorScoresApi.getAll({limit:500}) })
  const save = useMutation({ mutationFn: d=>modal.isEditing?vendorScoresApi.update(modal.editId,d):vendorScoresApi.create(d), onSuccess: res=>{ qc.invalidateQueries(['vendor-scores']); qc.invalidateQueries(['vendor-scorecard']); modal.close(); toast.success(res.message) } })
  const remove = useMutation({ mutationFn: vendorScoresApi.remove, onSuccess:()=>{ qc.invalidateQueries(['vendor-scores']); qc.invalidateQueries(['vendor-scorecard']); toast.success('Moved to trash') } })

  const overallScore = () => {
    const { qualityScore:q, onTimeScore:o, documentationScore:d, responsivenessScore:r } = modal.form
    return ((parseFloat(q)||3)+(parseFloat(o)||3)+(parseFloat(d)||3)+(parseFloat(r)||3))/4
  }

  const reviewColumns = [
    { key:'reviewId', label:'Review ID', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'var(--blue)',fontWeight:600}}>{v}</span> },
    { key:'vendor', label:'Vendor', render:v=><span style={{fontWeight:500}}>{v}</span> },
    { key:'reviewDate', label:'Date', render:v=><span style={{fontSize:11,color:'var(--text2)'}}>{fmtDate(v)}</span> },
    { key:'qualityScore', label:'Quality', align:'center', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:v>=4?'var(--green)':v>=3?'var(--amber)':'var(--red)'}}>{v}/5</span> },
    { key:'onTimeScore', label:'On-Time', align:'center', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:v>=4?'var(--green)':v>=3?'var(--amber)':'var(--red)'}}>{v}/5</span> },
    { key:'documentationScore', label:'Docs', align:'center', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:v>=4?'var(--green)':v>=3?'var(--amber)':'var(--red)'}}>{v}/5</span> },
    { key:'responsivenessScore', label:'Response', align:'center', render:v=><span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:v>=4?'var(--green)':v>=3?'var(--amber)':'var(--red)'}}>{v}/5</span> },
    { key:'overallScore', label:'Overall', align:'center', render:v=><span style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700,color:v>=4?'var(--green)':v>=3?'var(--amber)':'var(--red)'}}>{v}/5</span> },
    { key:'reviewedBy', label:'By', render:v=><span style={{fontSize:11}}>{v||'—'}</span> },
    { key:'_id', label:'', sortable:false, render:(v,r)=><div style={{display:'flex',gap:4,justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}><button className="btn-row-action" onClick={()=>modal.openEdit(r)}>✎</button><button className="btn-row-action del" onClick={()=>setDeleteId(r._id)}>🗑</button></div> },
  ]

  return (
    <div>
      <PageHeader title="Vendor Scorecards" icon="⭐" subtitle="Rate and track vendor performance across quality, delivery, documentation, and responsiveness"
        actions={<div style={{display:'flex',gap:8}}>
          <div style={{display:'flex',gap:4}}>
            <button className={`btn btn-sm ${view==='scorecard'?'btn-primary':'btn-secondary'}`} onClick={()=>setView('scorecard')}>Scorecard</button>
            <button className={`btn btn-sm ${view==='reviews'?'btn-primary':'btn-secondary'}`} onClick={()=>setView('reviews')}>All Reviews</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>modal.openNew()}>+ Rate Vendor</button>
        </div>}
      />
      {view === 'scorecard' ? (
        <div>
          {scLoading ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Loading...</div> :
          (scorecard?.data||[]).map(v=>(
            <div key={v._id} className="card mb-16" style={{padding:'16px 20px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <span style={{fontSize:14,fontWeight:700,color:'var(--text0)'}}>{v.name}</span>
                    <span className={`badge ${v.rating==='A+ (Excellent)'||v.rating==='A (Very Good)'?'badge-green':v.rating==='Blacklisted'?'badge-red':'badge-blue'}`}>{v.rating}</span>
                    {v.avgScore&&<span style={{fontFamily:'var(--font-mono)',fontSize:16,fontWeight:700,color:v.avgScore>=4?'var(--green)':v.avgScore>=3?'var(--amber)':'var(--red)'}}>{v.avgScore}/5</span>}
                    <span style={{fontSize:11,color:'var(--text3)'}}>{v.reviewCount} review{v.reviewCount!==1?'s':''}</span>
                  </div>
                  {v.avgScore&&<div style={{display:'flex',gap:16,fontSize:11,color:'var(--text2)'}}>
                    <span>Category: {v.category||'—'}</span>
                    <span>Lead Time: {v.leadTime||'—'}d</span>
                    <span>Pay Terms: {v.payTerms||'—'}d</span>
                  </div>}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={()=>modal.openNew({vendor:v.name})}>+ Review</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable title="All Vendor Reviews" icon="⭐" columns={reviewColumns} data={reviews?.data||[]} loading={rvLoading} onRowClick={modal.openEdit} searchPlaceholder="Search reviews..." />
      )}
      <Modal open={modal.open} onClose={modal.close} icon="⭐" title={modal.isEditing?'Edit Review':'Rate Vendor'}
        onSave={()=>save.mutate(modal.form)} saveLabel={modal.isEditing?'Update Review':'Save Review'}
        footerLeft={<span style={{fontSize:11,color:'var(--text3)'}}>Overall Score: <strong style={{color:overallScore()>=4?'var(--green)':overallScore()>=3?'var(--amber)':'var(--red)'}}>{overallScore().toFixed(2)}/5</strong></span>}
      >
        <div className="form-grid" style={{marginBottom:16}}>
          <div className="form-field"><label className="form-label">Vendor <span className="req">*</span></label><input className="form-input" value={modal.form.vendor} onChange={e=>modal.set('vendor',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Procurement PO</label><input className="form-input" value={modal.form.procId} onChange={e=>modal.set('procId',e.target.value)} placeholder="PPO-2025-001" /></div>
          <div className="form-field"><label className="form-label">Review Date</label><input className="form-input" type="date" value={fmtDateInput(modal.form.reviewDate)||new Date().toISOString().slice(0,10)} onChange={e=>modal.set('reviewDate',e.target.value)} /></div>
          <div className="form-field"><label className="form-label">Reviewed By</label><select className="form-select" value={modal.form.reviewedBy} onChange={e=>modal.set('reviewedBy',e.target.value)}><option value="">— Select —</option>{(lists.reviewers||lists.salesReps||[]).map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="form-section"><div className="form-section-title">Ratings</div>
          <div className="form-grid">
            <ScoreInput label="Product Quality" field="qualityScore" value={modal.form.qualityScore||3} onChange={modal.set} />
            <ScoreInput label="On-Time Delivery" field="onTimeScore" value={modal.form.onTimeScore||3} onChange={modal.set} />
            <ScoreInput label="Documentation Quality" field="documentationScore" value={modal.form.documentationScore||3} onChange={modal.set} />
            <ScoreInput label="Responsiveness" field="responsivenessScore" value={modal.form.responsivenessScore||3} onChange={modal.set} />
          </div>
        </div>
        <div className="form-field" style={{marginTop:10}}><label className="form-label">Notes / Observations</label><textarea className="form-textarea" value={modal.form.notes} onChange={e=>modal.set('notes',e.target.value)} /></div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>remove.mutate(deleteId)} title="Delete Review" message="Move this review to trash?" danger />
    </div>
  )
}
