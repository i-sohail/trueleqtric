// client/src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, reportsApi, analyticsApi } from '../services/modules'
import { KPICard, PageHeader, ProgressBar, PageLoader } from '../components/common/ui.jsx'
import { fmtCurrency, fmtPct, fmtDate, getStatusBadge } from '../utils/format'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const STAGE_COLORS = {
  'New Enquiry':'#2563EB','Qualified':'#0891B2','Proposal Submitted':'#D97706',
  'Negotiation':'#EA580C','PO Received':'#16A34A','Closed Lost':'#DC2626','On Hold':'#a855f7'
}

function InsightCard({ icon, title, text, color, bg, border }) {
  return (
    <div style={{ display:'flex', gap:10, padding:10, background:bg, borderRadius:6, border:`1px solid ${border}` }}>
      <div style={{ fontSize:18, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color, marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.5 }}>{text}</div>
      </div>
    </div>
  )
}

function AlertBanner({ alerts }) {
  const navigate = useNavigate()
  if (!alerts) return null
  const items = []
  if (alerts.overdueAR?.length) items.push({ color:'var(--red)', bg:'var(--red-dim)', text:`${alerts.overdueAR.length} overdue AR invoice(s)`, link:'/ar' })
  if (alerts.lowStockItems?.length) items.push({ color:'var(--amber)', bg:'var(--amber-dim)', text:`${alerts.lowStockItems.length} low/out-of-stock SKU(s)`, link:'/inventory' })
  if (alerts.critLeads?.length) items.push({ color:'var(--blue)', bg:'var(--blue-dim)', text:`${alerts.critLeads.length} critical lead(s) need follow-up`, link:'/leads' })
  if (!items.length) return null
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:item.bg, borderRadius:5, border:`1px solid ${item.color}33` }}>
          <span style={{ fontSize:14 }}>⚠</span>
          <span style={{ fontSize:12, color:item.color }}><strong>{item.text}</strong> — <a href={item.link} onClick={e => { e.preventDefault(); navigate(item.link) }} style={{ color:item.color }}>View →</a></span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: kpis, isLoading } = useQuery({ queryKey: ['dashboard-kpis'], queryFn: () => dashboardApi.getKPIs() })
  const { data: pipeline } = useQuery({ queryKey: ['pipeline-funnel'], queryFn: dashboardApi.getPipeline })
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: dashboardApi.getAlerts, refetchInterval: 30000 })
  const { data: recentOrders } = useQuery({ queryKey: ['recent-orders'], queryFn: dashboardApi.getRecentOrders })

  const handleMIS = (type) => {
    if (type === 'excel') {
      window.open(reportsApi.getExcelUrl(), '_blank')
      toast.success('Excel export started')
    } else if (type === 'pdf') {
      window.print()
    }
  }

  const maxPipeline = pipeline?.data ? Math.max(...pipeline.data.map(s => s.value), 1) : 1

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        icon="⬡"
        subtitle="Command Center — Real-time business overview"
        actions={
          <>
            <div style={{ position:'relative' }}>
              <select onChange={e => handleMIS(e.target.value)} defaultValue="" className="btn btn-secondary btn-sm" style={{ paddingRight:20 }}>
                <option value="" disabled>📊 MIS Report ▾</option>
                <option value="excel">📗 Export Excel</option>
                <option value="pdf">🖨 Print / PDF</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/leads')}>+ New Lead</button>
          </>
        }
      />

      {/* Alert banner */}
      <AlertBanner alerts={alerts} />

      {/* KPI Grid */}
      <div className="kpi-grid">
        {isLoading ? Array(8).fill(0).map((_, i) => <div key={i} className="kpi-card" style={{ height:100, background:'var(--bg3)', animation:'pulse 1.5s ease-in-out infinite' }} />) : kpis && (
          <>
            <KPICard label="Pipeline Value" value={fmtCurrency(kpis.pipeline)} sub={`${kpis.leadsCount} leads`} icon="💼" accent="var(--blue)" />
            <KPICard label="Revenue Booked" value={fmtCurrency(kpis.totalRevenue)} sub="all sales orders" icon="₹" accent="var(--green)" />
            <KPICard label="Gross Margin" value={fmtCurrency(kpis.totalGM)} sub={`${fmtPct(kpis.avgMargin)} avg`} icon="%" accent="var(--amber)" />
            <KPICard label="Win Rate" value={fmtPct(kpis.winRate)} sub="leads converted" icon="🏆" accent="var(--purple)" />
            <KPICard label="Overdue AR" value={fmtCurrency(kpis.overdueAR)} sub="past due date" icon="⚠" accent={kpis.overdueAR > 0 ? 'var(--red)' : 'var(--green)'} />
            <KPICard label="Pending AP" value={fmtCurrency(kpis.pendingAP)} sub="vendor payments" icon="↓" accent="var(--orange)" />
            <KPICard label="Stock Value" value={fmtCurrency(kpis.stockValue)} sub={`${kpis.lowStock} low/OOS`} icon="▦" accent="#0891b2" />
            <KPICard label="Active Orders" value={String(kpis.activePOs)} sub="not yet closed" icon="▣" accent="var(--blue)" />
          </>
        )}
      </div>

      {/* Business Commentary */}
      <BusinessInsights />

      {/* 2-col grid */}
      <div className="dash-grid">
        {/* Pipeline Funnel */}
        <div className="card mb-16">
          <div className="card-head">
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'var(--blue)' }}>◇</span> Lead Pipeline Funnel
            </div>
            <button className="btn btn-ghost btn-xs" onClick={() => navigate('/leads')}>View All →</button>
          </div>
          <div className="card-body">
            {pipeline?.data?.map(stage => (
              <div key={stage.stage} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:130, fontSize:11, color:'var(--text2)', flexShrink:0 }}>{stage.stage}</div>
                <div style={{ flex:1, background:'var(--bg3)', borderRadius:3, height:20, position:'relative', overflow:'hidden' }}>
                  <div style={{ width:`${Math.max(4, stage.value / maxPipeline * 100)}%`, height:'100%', background: STAGE_COLORS[stage.stage] || 'var(--blue)', opacity:0.8, borderRadius:3 }} />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'0 6px', fontSize:10, fontWeight:700, color:'#fff' }}>{stage.count} leads</div>
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', width:75, textAlign:'right', fontFamily:'var(--font-mono)' }}>{fmtCurrency(stage.value)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="card mb-16">
          <div className="card-head">
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'var(--red)' }}>⚠</span> Action Required
            </div>
          </div>
          <div className="card-body" style={{ padding:0 }}>
            {alerts?.overdueAR?.slice(0, 4).map(a => (
              <div key={a._id} onClick={() => navigate('/ar')} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500 }}>Overdue AR — {a.customer}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{a.arId}</div>
                </div>
                <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--red)', fontWeight:700 }}>{fmtCurrency((a.invoiceAmt || 0) - (a.amtReceived || 0))}</div>
              </div>
            ))}
            {alerts?.lowStockItems?.slice(0, 3).map(item => (
              <div key={item._id} onClick={() => navigate('/inventory')} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--amber-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500 }}>{item.stockStatus}: {(item.product || item.sku || '').slice(0, 28)}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Stock: {item.currentStock} {item.unit}</div>
                </div>
                <span className="badge badge-amber">{item.stockStatus}</span>
              </div>
            ))}
            {(!alerts?.overdueAR?.length && !alerts?.lowStockItems?.length) && (
              <div style={{ padding:24, textAlign:'center', color:'var(--green)', fontSize:12 }}>✓ All clear — no urgent actions</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-head">
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)', display:'flex', alignItems:'center', gap:6 }}>▣ Recent Sales Orders</div>
          <button className="btn btn-ghost btn-xs" onClick={() => navigate('/salespo')}>View All →</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th style={{ textAlign:'right' }}>Revenue</th>
                <th style={{ textAlign:'right' }}>Margin</th><th>Status</th><th>PO Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.data?.slice(0, 8).map(po => (
                <tr key={po._id} onClick={() => navigate('/salespo')}>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--blue)', fontWeight:600 }}>{po.spoId}</td>
                  <td style={{ fontWeight:500 }}>{po.customer}</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:600 }}>{fmtCurrency(po.calc?.rev)}</td>
                  <td style={{ textAlign:'right' }}>
                    <span className={po.calc?.marginPct >= 0.2 ? 'margin-high' : po.calc?.marginPct >= 0.1 ? 'margin-mid' : 'margin-low'}>
                      {fmtPct(po.calc?.marginPct)}
                    </span>
                  </td>
                  <td><span className={`badge ${getStatusBadge(po.status)}`}>{po.status}</span></td>
                  <td style={{ fontSize:11, color:'var(--text2)' }}>{fmtDate(po.poDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BusinessInsights() {
  const { data } = useQuery({ queryKey: ['insights'], queryFn: analyticsApi.getInsights, staleTime: 60000 })
  if (!data?.data?.length) return null
  const colorMap = { green: { bg:'var(--green-dim)', border:'rgba(22,163,74,0.2)', color:'var(--green)' }, red: { bg:'var(--red-dim)', border:'rgba(220,38,38,0.2)', color:'var(--red)' }, amber: { bg:'var(--amber-dim)', border:'rgba(217,119,6,0.2)', color:'var(--amber)' }, blue: { bg:'var(--blue-dim)', border:'var(--blue-border)', color:'var(--blue)' } }
  return (
    <div className="card mb-16" style={{ borderLeft:'3px solid var(--blue)', marginBottom:16 }}>
      <div className="card-head">
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)', display:'flex', alignItems:'center', gap:6 }}>💡 Business Commentary</div>
      </div>
      <div className="card-body">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {data.data.slice(0, 4).map((ins, i) => {
            const c = colorMap[ins.color] || colorMap.blue
            return <InsightCard key={i} {...ins} {...c} />
          })}
        </div>
      </div>
    </div>
  )
}
