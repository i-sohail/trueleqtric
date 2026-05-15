// client/src/components/common/KPICard.jsx
export function KPICard({ label, value, sub, icon, accent = 'var(--blue)' }) {
  return (
    <div className="kpi-card" style={{ '--kpi-accent': accent }}>
      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'1px', color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:'var(--text0)', lineHeight:1, marginBottom:4, fontFamily:'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text3)' }}>{sub}</div>
      {icon && <div style={{ position:'absolute', bottom:10, right:12, fontSize:26, opacity:0.06 }}>{icon}</div>}
    </div>
  )
}

// client/src/components/common/PageHeader.jsx
export function PageHeader({ title, icon, subtitle, actions }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--text0)', display:'flex', alignItems:'center', gap:8 }}>
          {icon && <span style={{ color:'var(--blue)' }}>{icon}</span>}
          {title}
        </div>
        {subtitle && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>{actions}</div>}
    </div>
  )
}

// client/src/components/common/Badge.jsx
export function Badge({ label, type = 'gray' }) {
  return <span className={`badge badge-${type}`}>{label}</span>
}

// client/src/components/common/ConfirmDialog.jsx
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(3px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border2)', borderRadius:'var(--radius-lg)', width:'min(420px,94vw)', boxShadow:'var(--shadow-lg)', overflow:'hidden' }}>
        <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:700, color: danger ? 'var(--red)' : 'var(--text0)', marginBottom:6 }}>{title}</div>
          <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{message}</div>
        </div>
        <div style={{ padding:16, display:'flex', justifyContent:'flex-end', gap:8, background:'var(--bg2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>
            {danger ? '🗑 Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// client/src/components/common/FormField.jsx
export function FormField({ label, required, children, className = '' }) {
  return (
    <div className={`form-field ${className}`}>
      {label && <label className="form-label">{label}{required && <span className="req"> *</span>}</label>}
      {children}
    </div>
  )
}

// client/src/components/common/StatusBadge.jsx
import { getStatusBadge } from '../../utils/format'
export function StatusBadge({ status }) {
  return <span className={`badge ${getStatusBadge(status)}`}>{status || '—'}</span>
}

// client/src/components/common/ProgressBar.jsx
export function ProgressBar({ value, max = 100, color = 'var(--blue)', height = 6 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ background:'var(--bg3)', borderRadius:3, height, overflow:'hidden', flex:1 }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.3s ease' }} />
    </div>
  )
}

// client/src/components/common/PageLoader.jsx
export function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh', height:'100%', flexDirection:'column', gap:12 }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border2)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ color:'var(--text3)', fontSize:13, fontFamily:'var(--font-mono)' }}>Loading data…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
