// client/src/components/common/Modal.jsx
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, subtitle, icon, children, onSave, saveLabel = 'Save Record', footerLeft, size = 'default' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { default: 'min(800px, 96vw)', sm: 'min(500px, 96vw)', lg: 'min(1000px, 96vw)' }

  return (
    <div
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.4)', backdropFilter:'blur(3px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
    >
      <div className="modal-box" style={{ width: widths[size] }}>
        {/* Header */}
        <div className="modal-head">
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            {icon && <span style={{ fontSize:20, color:'var(--blue)', marginTop:2 }}>{icon}</span>}
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text0)' }}>{title}</div>
              {subtitle && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border2)', width:28, height:28, borderRadius:'var(--radius)', cursor:'pointer', fontSize:14, color:'var(--text3)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {(onSave || footerLeft) && (
          <div className="modal-foot">
            <div>{footerLeft}</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              {onSave && (
                <button className="btn btn-primary" onClick={onSave}>{saveLabel}</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
