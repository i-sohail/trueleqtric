// client/src/components/common/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, reportsApi } from '../../services/modules'
import { fmtCurrency, fmtPct } from '../../utils/format'
import toast from 'react-hot-toast'

const NAV = [
  { group: 'OVERVIEW', items: [
    { path: '/',         label: 'Dashboard',            icon: '⬡' },
    { path: '/analytics',label: 'Analytics & Insights', icon: '◎' },
  ]},
  { group: 'COMMERCIAL', items: [
    { path: '/leads',      label: 'Leads & CRM',    icon: '◇', badgeKey: 'leads' },
    { path: '/quotations', label: 'Quotations',     icon: '◻', badgeKey: 'quotes', badgeClass: 'warn' },
    { path: '/salespo',    label: 'Sales Orders',   icon: '▣', badgeKey: 'spo' },
  ]},
  { group: 'OPERATIONS', items: [
    { path: '/procurement', label: 'Procurement',    icon: '◐' },
    { path: '/inventory',   label: 'Inventory',      icon: '▦', badgeKey: 'inv', badgeClass: 'danger' },
    { path: '/delivery',    label: 'Delivery Log',   icon: '▷', badgeKey: 'del', badgeClass: 'danger' },
  ]},
  { group: 'CONTRACTS & DOCS', items: [
    { path: '/bglc',      label: 'BG & LC Tracker',      icon: '🔐', badgeKey: 'bglc', badgeClass: 'danger' },
    { path: '/tenders',   label: 'Tender Management',    icon: '📋', badgeKey: 'tenders' },
    { path: '/documents', label: 'Documents (DMS)',       icon: '📎' },
  ]},
  { group: 'TRACKING', items: [
    { path: '/payment-schedules', label: 'Payment Schedules',    icon: '💳' },
    { path: '/prod-tracking',     label: 'Production Tracking',  icon: '🏭' },
  ]},
  { group: 'FINANCE', items: [
    { path: '/ar',           label: 'Receivables (AR)',   icon: '↑', badgeKey: 'ar', badgeClass: 'danger' },
    { path: '/ap',           label: 'Payables (AP)',      icon: '↓', badgeKey: 'ap', badgeClass: 'warn' },
    { path: '/credit-monitor', label: 'Credit Monitor',  icon: '🛡' },
    { path: '/cash-flow',    label: 'Cash Flow',          icon: '📊' },
  ]},
  { group: 'MASTER DATA', items: [
    { path: '/customers', label: 'Customers',        icon: '◉' },
    { path: '/vendors',   label: 'Vendors',          icon: '◈' },
    { path: '/catalog',   label: 'Product Catalog',  icon: '▤' },
    { path: '/pricing',   label: 'Pricing Master',   icon: '₹' },
  ]},
  { group: 'COMMERCIAL INTEL', items: [
    { path: '/commissions',   label: 'Commissions',         icon: '💰' },
    { path: '/vendor-scores', label: 'Vendor Scorecards',   icon: '⭐' },
  ]},
  { group: 'SETTINGS', items: [
    { path: '/lists',   label: 'Dropdown Lists',          icon: '≡' },
    { path: '/sellers', label: 'Seller Recommendations',  icon: '🔍' },
    { path: '/trash',   label: 'Recycle Bin',             icon: '🗑', badgeKey: 'trash', badgeClass: 'warn' },
  ]},
  { group: 'SYSTEM', items: [
    { path: '/access', label: 'Access Management', icon: '🔐', adminOnly: true },
  ]},
]

function useBadges() {
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: dashboardApi.getAlerts, refetchInterval: 30000, retry: false })
  return {
    leads:   alerts?.critLeads?.length || 0,
    quotes:  0,
    spo:     0,
    inv:     alerts?.lowStockItems?.length || 0,
    del:     alerts?.overdueDeliveries?.length || 0,
    ar:      alerts?.overdueAR?.length || 0,
    ap:      0,
    bglc:    alerts?.bglcExpiring?.length || 0,
    tenders: 0,
    trash:   0,
  }
}

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, close } = useSidebar()
  const { logout, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const badges = useBadges()

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleNav = (path) => {
    navigate(path)
    // Close on mobile
    if (mobileOpen) close()
  }

  const handleExport = () => {
    window.open('/api/reports/excel', '_blank')
    toast.success('Excel export started')
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={close} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:149, display:'none' }} className="sidebar-overlay" />
      )}

      <aside
        id="sidebar"
        style={{
          width: collapsed ? 52 : 224,
          minHeight: '100vh',
          background: 'var(--sidebar-bg, #0f172a)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          flexShrink: 0,
          position: 'relative',
          zIndex: 150,
          overflowX: 'hidden',
        }}
      >
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding: collapsed ? '14px 8px' : '14px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)', minHeight:56, flexShrink:0 }}>
          <div onClick={() => handleNav('/')} style={{ width:28, height:28, background:'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer', flexShrink:0 }}>⚡</div>
          {!collapsed && (
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'1.5px', color:'#f1f5f9', fontFamily:'var(--font-mono)', whiteSpace:'nowrap' }}>TRUELEQTRIC</div>
              <div style={{ fontSize:9, color:'#475569', whiteSpace:'nowrap' }}>Power &amp; Renewables</div>
            </div>
          )}
          <button
            onClick={toggle}
            style={{ background:'none', border:'1px solid rgba(255,255,255,0.08)', color:'#475569', width:20, height:20, borderRadius:4, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform 0.2s', transform: collapsed ? 'rotate(180deg)' : 'none' }}
          >‹</button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div style={{ padding:'8px 10px', flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#475569', fontSize:11, pointerEvents:'none' }}>⌕</span>
              <input
                type="text"
                placeholder="Search modules…"
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'6px 8px 6px 26px', color:'#e2e8f0', fontSize:11, outline:'none', boxSizing:'border-box', fontFamily:'var(--font-sans)' }}
                onFocus={e => e.target.style.borderColor='rgba(37,99,235,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'4px 0 8px' }}>
          {NAV.map(group => {
            // Filter admin-only items
            const items = group.items.filter(item => !item.adminOnly || isAdmin)
            if (items.length === 0) return null
            return (
              <div key={group.group} style={{ marginBottom:2 }}>
                {!collapsed && (
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.5px', color:'#334155', padding:'10px 12px 3px', textTransform:'uppercase', userSelect:'none' }}>
                    {group.group}
                  </div>
                )}
                {items.map(item => {
                  const active = isActive(item.path)
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0
                  return (
                    <div
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      title={collapsed ? item.label : ''}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: collapsed ? '8px 12px' : '7px 12px',
                        color: active ? '#60a5fa' : '#64748b',
                        cursor: 'pointer',
                        borderLeft: `2px solid ${active ? '#2563eb' : 'transparent'}`,
                        background: active ? 'rgba(37,99,235,0.1)' : 'transparent',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        transition: 'all 0.1s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='#94a3b8' } }}
                      onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b' } }}
                    >
                      <span style={{ fontSize:13, width:18, textAlign:'center', flexShrink:0, lineHeight:1 }}>{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span style={{ fontSize:12, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
                          {badge > 0 && (
                            <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:10, background: item.badgeClass==='danger'?'rgba(220,38,38,0.15)':item.badgeClass==='warn'?'rgba(217,119,6,0.15)':'rgba(37,99,235,0.15)', color: item.badgeClass==='danger'?'#f87171':item.badgeClass==='warn'?'#fbbf24':'#60a5fa', flexShrink:0 }}>
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        {!collapsed && user && (
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'10px 12px', flexShrink:0 }}>
            {/* User info */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 8px', background:'rgba(255,255,255,0.04)', borderRadius:6 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700, flexShrink:0 }}>
                {(user.name?.[0]||'?').toUpperCase()}
              </div>
              <div style={{ flex:1, overflow:'hidden' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name} {user.surname||''}</div>
                <div style={{ fontSize:9, color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                  {user.roleRef?.name || user.role || 'User'}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={handleExport} style={{ flex:1, padding:'5px 4px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', fontSize:10, fontFamily:'var(--font-sans)', borderRadius:5, cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.color='#60a5fa';e.currentTarget.style.borderColor='rgba(37,99,235,0.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#64748b';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
                ⬇ Export
              </button>
              {isAdmin && (
                <button onClick={()=>handleNav('/access')} style={{ flex:1, padding:'5px 4px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', fontSize:10, fontFamily:'var(--font-sans)', borderRadius:5, cursor:'pointer' }}
                  onMouseEnter={e=>{e.currentTarget.style.color='#a78bfa';e.currentTarget.style.borderColor='rgba(124,58,237,0.3)'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='#64748b';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
                  🔐 Access
                </button>
              )}
              <button onClick={logout} style={{ flex:1, padding:'5px 4px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#64748b', fontSize:10, fontFamily:'var(--font-sans)', borderRadius:5, cursor:'pointer' }}
                onMouseEnter={e=>{e.currentTarget.style.color='#f87171';e.currentTarget.style.borderColor='rgba(220,38,38,0.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#64748b';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}}>
                ↺ Logout
              </button>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ padding:'10px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:6, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            {isAdmin && <button onClick={()=>handleNav('/access')} title="Access Management" style={{ background:'none', border:'none', cursor:'pointer', fontSize:16 }}>🔐</button>}
            <button onClick={logout} title="Logout" style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#64748b' }}>↺</button>
          </div>
        )}
      </aside>
    </>
  )
}
