import { useQuery } from '@tanstack/react-query'
import { creditMonitorApi } from '../services/modules'
import { PageHeader, KPICard, ProgressBar } from '../components/common/ui.jsx'
import { fmtCurrency, fmtPct } from '../utils/format'

export default function CreditMonitor() {
  const { data, isLoading } = useQuery({ queryKey:['credit-monitor'], queryFn: creditMonitorApi.getExposure })
  const rows = data?.data || []
  const summary = data?.summary || {}

  return (
    <div>
      <PageHeader title="Customer Credit Monitor" icon="🛡" subtitle="Real-time credit utilisation · Outstanding AR + open orders vs limits" />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Customers Monitored" value={String(summary.monitored||0)} sub="with credit limits" icon="◉" accent="var(--blue)" />
        <KPICard label="Limit Breached" value={String(summary.breaching||0)} sub="over credit limit" icon="🚨" accent={summary.breaching>0?'var(--red)':'var(--green)'} />
        <KPICard label="Warning Zone ≥75%" value={String(summary.warning||0)} sub="approaching limit" icon="⚠" accent={summary.warning>0?'var(--amber)':'var(--green)'} />
        <KPICard label="Total Overdue AR" value={fmtCurrency(summary.totalOverdue||0)} sub="across all customers" icon="↑" accent="var(--red)" />
      </div>
      {summary.breaching > 0 && (
        <div style={{background:'var(--red-dim)',border:'1px solid rgba(220,38,38,.3)',borderRadius:8,padding:'14px 18px',marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--red)',marginBottom:8}}>🚨 Credit Limit Breached — {summary.breaching} customer(s)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {rows.filter(c=>c.utilisation>=1&&c.limit>0).map(c=>(
              <span key={c._id} style={{padding:'5px 12px',background:'var(--red-dim)',border:'1px solid var(--red)',borderRadius:4,fontSize:11,fontWeight:700,color:'var(--red)'}}>
                {c.name} — {fmtPct(c.utilisation)} ({fmtCurrency(c.totalExposure)} / {fmtCurrency(c.limit)})
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg2)',fontSize:12,fontWeight:600}}>🛡 Credit Exposure — All Customers</div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr>
              <th>Customer</th><th style={{textAlign:'right'}}>Credit Limit</th><th style={{textAlign:'right'}}>Outstanding AR</th>
              <th style={{textAlign:'right'}}>Open Orders</th><th style={{textAlign:'right'}}>Total Exposure</th>
              <th style={{textAlign:'right'}}>Overdue AR</th><th>Utilisation</th><th>Status</th>
            </tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} style={{textAlign:'center',padding:30,color:'var(--text3)'}}>Loading…</td></tr> :
              rows.map(c=>{
                const u=c.utilisation
                const barColor=u>=1?'var(--red)':u>=0.75?'var(--amber)':'var(--green)'
                const statusLabel=!c.limit?'No Limit':u>=1?'OVER LIMIT':u>=0.75?'WARNING':'OK'
                const statusColor=!c.limit?'var(--text3)':u>=1?'var(--red)':u>=0.75?'var(--amber)':'var(--green)'
                return <tr key={c._id} style={{background:u>=1?'rgba(220,38,38,0.04)':u>=0.75?'rgba(217,119,6,0.04)':'transparent'}}>
                  <td><div style={{fontWeight:500}}>{c.name}</div><div style={{fontSize:10,color:'var(--text3)'}}>{c.type||'—'} · {c.payTerms||0}d terms</div></td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>{c.limit?fmtCurrency(c.limit):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>{fmtCurrency(c.outstanding)}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>{fmtCurrency(c.openOrders)}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:700,color:c.limit&&u>=1?'var(--red)':'var(--text0)'}}>{fmtCurrency(c.totalExposure)}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',color:c.overdue>0?'var(--red)':'var(--text3)'}}>{c.overdue?fmtCurrency(c.overdue):'—'}</td>
                  <td style={{minWidth:140}}>
                    {c.limit?<div style={{display:'flex',alignItems:'center',gap:6}}>
                      <ProgressBar value={Math.min(100,u*100)} color={barColor} height={7} />
                      <span style={{fontSize:11,fontWeight:700,color:barColor,whiteSpace:'nowrap'}}>{fmtPct(u)}</span>
                    </div>:<span style={{fontSize:11,color:'var(--text3)'}}>No limit</span>}
                  </td>
                  <td><span className={`badge ${u>=1?'badge-red':u>=0.75?'badge-amber':'badge-green'}`}>{statusLabel}</span></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
