import { useQuery } from '@tanstack/react-query'
import { cashFlowApi } from '../services/modules'
import { PageHeader, KPICard } from '../components/common/ui.jsx'
import { fmtCurrency } from '../utils/format'

export default function CashFlow() {
  const { data, isLoading } = useQuery({ queryKey:['cash-flow'], queryFn: cashFlowApi.getProjection })
  const weeks = data?.data || []
  const summary = data?.summary || {}
  const maxVal = weeks.length ? Math.max(...weeks.map(w=>Math.max(w.inflow,w.outflow)),1) : 1

  return (
    <div>
      <PageHeader title="90-Day Cash Flow Projection" icon="📊" subtitle="AR inflows vs AP outflows vs milestone receipts — next 13 weeks" />
      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Inflows (90d)" value={fmtCurrency(summary.totalInflows||0)} sub="AR + milestones due" icon="↑" accent="var(--green)" />
        <KPICard label="Total Outflows (90d)" value={fmtCurrency(summary.totalOutflows||0)} sub="AP payments due" icon="↓" accent="var(--red)" />
        <KPICard label="Net Cash Position" value={fmtCurrency(summary.netPosition||0)} sub="90-day outlook" icon="◎" accent={(summary.netPosition||0)>=0?'var(--green)':'var(--red)'} />
        <KPICard label="Negative Weeks" value={String(summary.negativeWeeks||0)} sub="need funding" icon="⚠" accent={summary.negativeWeeks>0?'var(--red)':'var(--green)'} />
      </div>
      <div className="card mb-16">
        <div className="card-head">
          <div style={{fontSize:12,fontWeight:600}}>📊 Weekly Cash Flow</div>
          <div style={{display:'flex',gap:12,fontSize:11}}><span style={{color:'var(--green)'}}>■ Inflow</span><span style={{color:'var(--red)'}}>■ Outflow</span></div>
        </div>
        <div className="card-body" style={{overflowX:'auto'}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:4,height:160,paddingBottom:28,minWidth:weeks.length*60}}>
            {weeks.map((w,i)=>{
              const ih=Math.max(2,w.inflow/maxVal*140)
              const oh=Math.max(2,w.outflow/maxVal*140)
              const nc=w.net<0?'var(--red)':'var(--green)'
              return <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,position:'relative'}}>
                <div style={{display:'flex',gap:2,alignItems:'flex-end',height:140}}>
                  <div style={{width:14,height:ih,background:'var(--green)',opacity:0.8,borderRadius:'2px 2px 0 0'}} title={fmtCurrency(w.inflow)} />
                  <div style={{width:14,height:oh,background:'var(--red)',opacity:0.8,borderRadius:'2px 2px 0 0'}} title={fmtCurrency(w.outflow)} />
                </div>
                <div style={{fontSize:9,color:'var(--text3)',whiteSpace:'nowrap',transform:'rotate(-40deg)',transformOrigin:'top left',marginTop:4,position:'absolute',bottom:-24,left:0}}>{w.label}</div>
                <div style={{position:'absolute',top:-16,fontSize:9,fontWeight:700,color:nc}}>{w.net!==0?(w.net>0?'+':'')+fmtCurrency(w.net).replace('₹',''):''}</div>
              </div>
            })}
          </div>
        </div>
      </div>
      <div className="card">
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg2)',fontSize:12,fontWeight:600}}>Weekly Cash Flow Detail</div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Week</th><th>Period</th><th style={{textAlign:'right'}}>Inflow</th><th style={{textAlign:'right'}}>Outflow</th><th style={{textAlign:'right'}}>Net</th><th style={{textAlign:'right'}}>Cumulative</th><th>Indicator</th></tr></thead>
            <tbody>
              {isLoading?<tr><td colSpan={7} style={{textAlign:'center',padding:30,color:'var(--text3)'}}>Loading…</td></tr>:
              weeks.map((w,i)=>{
                const nc=w.net<0?'var(--red)':'var(--green)'
                const cc=w.cumulative<0?'var(--red)':'var(--green)'
                return <tr key={i} style={{background:w.net<0?'rgba(220,38,38,0.04)':'transparent'}}>
                  <td style={{fontWeight:700,color:'var(--text2)'}}>W{i+1}</td>
                  <td style={{fontSize:11,color:'var(--text2)'}}>{new Date(w.start).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} – {new Date(w.end).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',color:'var(--green)'}}>{w.inflow>0?fmtCurrency(w.inflow):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',color:'var(--red)'}}>{w.outflow>0?fmtCurrency(w.outflow):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:700,color:nc}}>{w.net!==0?(w.net>0?'+':'')+fmtCurrency(w.net):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:700,color:cc}}>{fmtCurrency(w.cumulative)}</td>
                  <td><span className={`badge ${w.net<0?'badge-red':w.net>0?'badge-green':'badge-gray'}`}>{w.net<0?'⚠ Outflow':w.net>0?'✓ Surplus':'Neutral'}</span></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
