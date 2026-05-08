// client/src/pages/LoginPage.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) { toast.error('Enter email/username and password'); return }
    setLoading(true)
    try {
      const user = await login(form.email.trim(), form.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : 'Login failed. Check credentials.');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:'var(--font-sans)' }}>

      {/* Background pattern */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(circle at 25% 25%, rgba(37,99,235,0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(124,58,237,0.06) 0%, transparent 50%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:64, height:64, background:'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius:16, marginBottom:16, boxShadow:'0 8px 32px rgba(37,99,235,0.4)' }}>
            <span style={{ fontSize:32 }}>⚡</span>
          </div>
          <div style={{ fontSize:24, fontWeight:800, color:'#f1f5f9', letterSpacing:2, fontFamily:'var(--font-mono)' }}>TRUELEQTRIC</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:4, letterSpacing:1 }}>POWER & RENEWABLE ENERGY TRADING</div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(30,41,59,0.8)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:36, backdropFilter:'blur(20px)', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#f1f5f9', marginBottom:6 }}>Sign in to Command Center</h1>
            <p style={{ fontSize:13, color:'#64748b' }}>Enter your credentials to access the CRM platform</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email / Username */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#94a3b8', marginBottom:8, letterSpacing:'0.5px', textTransform:'uppercase' }}>Email or Username</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#475569' }}>✉</span>
                <input
                  type="text"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="you@company.com or username"
                  autoComplete="username"
                  style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px 12px 42px', color:'#f1f5f9', fontSize:14, outline:'none', transition:'all 0.15s', boxSizing:'border-box' }}
                  onFocus={e => { e.target.style.borderColor='rgba(37,99,235,0.6)'; e.target.style.background='rgba(255,255,255,0.08)'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:28 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#94a3b8', marginBottom:8, letterSpacing:'0.5px', textTransform:'uppercase' }}>Password</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#475569' }}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 44px 12px 42px', color:'#f1f5f9', fontSize:14, outline:'none', transition:'all 0.15s', boxSizing:'border-box' }}
                  onFocus={e => { e.target.style.borderColor='rgba(37,99,235,0.6)'; e.target.style.background='rgba(255,255,255,0.08)'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.12)' }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none' }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:14, padding:0 }}>{showPass ? '🙈' : '👁'}</button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width:'100%', background: loading ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color:'white', border:'none', borderRadius:10, padding:'14px', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.2s', letterSpacing:'0.5px', boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.4)', opacity: loading ? 0.8 : 1 }}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  Signing in...
                </span>
              ) : '⚡ Sign In to CRM'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop:24, padding:14, background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:10 }}>
            <div style={{ fontSize:10, color:'#60a5fa', fontWeight:700, marginBottom:8, letterSpacing:'1px', textTransform:'uppercase' }}>Demo Credentials</div>
            {[
              { label:'Admin', email:'admin@trueleqtric.com', pass:'admin123' },
              { label:'Sales', email:'vikram@trueleqtric.com', pass:'pass123' },
              { label:'Finance', email:'priya@trueleqtric.com', pass:'pass123' },
            ].map(c => (
              <div key={c.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'#93c5fd' }}><strong>{c.label}:</strong> {c.email}</span>
                <button onClick={() => setForm({ email: c.email, password: c.pass })} style={{ fontSize:10, background:'rgba(37,99,235,0.2)', border:'1px solid rgba(37,99,235,0.3)', color:'#60a5fa', borderRadius:4, padding:'2px 8px', cursor:'pointer' }}>Use</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:11, color:'#334155' }}>
          Trueleqtric Command Center • Power & Renewable Energy CRM
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
