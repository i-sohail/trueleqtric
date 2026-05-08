// client/src/pages/Analytics.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../services/modules'
import { PageHeader, KPICard } from '../components/common/ui.jsx'
import { fmtCurrency, fmtPct } from '../utils/format'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

const COLORS = ['#2563eb','#0891b2','#d97706','#ea580c','#16a34a','#dc2626','#7c3aed']

export default function Analytics() {
  const [chartType, setChartType] = useState('bar')
  const [activePanel, setActivePanel] = useState(null)

  const { data: overview } = useQuery({ queryKey:['analytics-overview'], queryFn: analyticsApi.getOverview })
  const { data: trend } = useQuery({ queryKey:['analytics-trend'], queryFn: () => analyticsApi.getMonthlyTrend(new Date().getFullYear()) })
  const { data: aging } = useQuery({ queryKey:['analytics-aging'], queryFn: analyticsApi.getARAging })
  const { data: catRev } = useQuery({ queryKey:['analytics-category'], queryFn: analyticsApi.getCategoryRevenue })
  const { data: repBoard } = useQuery({ queryKey:['analytics-reps'], queryFn: analyticsApi.getSalesRepScoreboard })
  const { data: forecast } = useQuery({ queryKey:['analytics-forecast'], queryFn: analyticsApi.getForecast })
  const { data: funnel } = useQuery({ queryKey:['analytics-funnel'], queryFn: analyticsApi.getLeadFunnel })
  const { data: waterfall } = useQuery({ queryKey:['analytics-waterfall'], queryFn: analyticsApi.getMarginWaterfall })

  const agingData = aging?.data ? Object.entries(aging.data).map(([k, v]) => ({ name: k, value: v })) : []
  const trendData = trend?.data || []

  return (
    <div>
      <PageHeader title="Analytics & Insights" icon="◎" subtitle="Advanced business intelligence"
        actions={
          <div style={{display:'flex',gap:6}}>
            {['bar','line'].map(t=>(
              <button key={t} className={`btn btn-sm ${chartType===t?'btn-primary':'btn-secondary'}`} onClick={()=>setChartType(t)}>
                {t==='bar'?'▊ Bar':'⁄⁄ Line'}
              </button>
            ))}
          </div>
        }
      />

      <div className="kpi-grid" style={{marginBottom:16}}>
        <KPICard label="Total Revenue" value={fmtCurrency(overview?.totalRev)} sub="all sales" icon="₹" accent="var(--green)" />
        <KPICard label="Gross Margin" value={fmtCurrency(overview?.totalGM)} sub={fmtPct(overview?.avgMargin)+' avg'} icon="%" accent="var(--blue)" />
        <KPICard label="Lead Pipeline" value={fmtCurrency(overview?.pipeline)} sub="estimated" icon="◇" accent="var(--amber)" />
        <KPICard label="Overdue AR" value={fmtCurrency(overview?.overdueAR)} sub="past due" icon="⚠" accent={overview?.overdueAR>0?'var(--red)':'var(--green)'} />
      </div>

      <div className="analytics-grid">
        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><div style={{fontSize:12,fontWeight:600}}>◎ Monthly Revenue & Margin Trend</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              {chartType==='bar' ? (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{fontSize:10,fill:'var(--text3)'}} />
                  <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickFormatter={v=>v>=100000?`${(v/100000).toFixed(0)}L`:v} />
                  <Tooltip formatter={v=>fmtCurrency(v)} />
                  <Bar dataKey="rev" name="Revenue" fill="var(--blue)" radius={[3,3,0,0]} opacity={0.85} />
                  <Bar dataKey="margin" name="Margin" fill="var(--green)" radius={[3,3,0,0]} opacity={0.85} />
                </BarChart>
              ) : (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{fontSize:10,fill:'var(--text3)'}} />
                  <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickFormatter={v=>v>=100000?`${(v/100000).toFixed(0)}L`:v} />
                  <Tooltip formatter={v=>fmtCurrency(v)} />
                  <Line type="monotone" dataKey="rev" name="Revenue" stroke="var(--blue)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="margin" name="Margin" stroke="var(--green)" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><div style={{fontSize:12,fontWeight:600,color:'var(--amber)'}}>↑ AR Aging Buckets</div></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fontSize:10,fill:'var(--text3)'}} />
                <YAxis tick={{fontSize:10,fill:'var(--text3)'}} tickFormatter={v=>v>=100000?`${(v/100000).toFixed(0)}L`:v} />
                <Tooltip formatter={v=>fmtCurrency(v)} />
                <Bar dataKey="value" name="Outstanding" radius={[3,3,0,0]}>
                  {agingData.map((_,i)=><Cell key={i} fill={i===0?'var(--green)':i===1?'var(--amber)':i===2?'var(--orange)':'var(--red)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><div style={{fontSize:12,fontWeight:600}}>▤ Revenue by Product Category</div></div>
          <div className="card-body">
            {catRev?.data?.slice(0,8).map((cat,i)=>{
              const max=catRev.data[0]?.rev||1
              return (
                <div key={cat.category} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:130,fontSize:11,flexShrink:0,color:'var(--text2)'}}>{cat.category.slice(0,18)}</div>
                  <div style={{flex:1,background:'var(--bg3)',borderRadius:2,height:5}}>
                    <div style={{width:`${(cat.rev/max)*100}%`,height:'100%',borderRadius:2,background:COLORS[i%COLORS.length]}} />
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:11,fontWeight:600,width:75,textAlign:'right'}}>{fmtCurrency(cat.rev)}</div>
                  <div style={{fontSize:10,color:cat.marginPct>=0.2?'var(--green)':cat.marginPct>=0.1?'var(--amber)':'var(--red)',width:40,textAlign:'right'}}>{fmtPct(cat.marginPct)}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><div style={{fontSize:12,fontWeight:600}}>◉ Sales Rep Scoreboard</div></div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>Rep</th><th>Leads</th><th>Pipeline</th><th>Revenue</th><th>Win%</th></tr></thead>
              <tbody>
                {repBoard?.data?.map(r=>(
                  <tr key={r.rep}>
                    <td style={{fontWeight:500}}>{r.rep}</td>
                    <td style={{textAlign:'center',fontFamily:'var(--font-mono)'}}>{r.leads}</td>
                    <td style={{textAlign:'right',fontFamily:'var(--font-mono)'}}>{fmtCurrency(r.pipeline)}</td>
                    <td style={{textAlign:'right',fontFamily:'var(--font-mono)',fontWeight:600}}>{fmtCurrency(r.revenue)}</td>
                    <td style={{textAlign:'center',color:r.winRate>=0.3?'var(--green)':r.winRate>=0.15?'var(--amber)':'var(--red)',fontWeight:700}}>{fmtPct(r.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14,padding:'12px 16px',background:'var(--bg2)',borderRadius:8,border:'1px solid var(--border)'}}>
        <span style={{fontSize:11,fontWeight:700,color:'var(--text3)',alignSelf:'center',marginRight:4}}>Advanced Analytics:</span>
        {[['forecast','📈 Revenue Forecast'],['waterfall','📉 Margin Waterfall'],['funnel','◇ Lead Funnel']].map(([key,label])=>(
          <button key={key} className="btn btn-secondary btn-sm" onClick={()=>setActivePanel(activePanel===key?null:key)}>{label}</button>
        ))}
      </div>

      {activePanel==='forecast'&&forecast&&(
        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><div style={{fontSize:12,fontWeight:600}}>📈 Revenue Forecast (3-Month Moving Average)</div></div>
          <div className="card-body"><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {forecast.forecast?.map(f=>(
              <div key={f.label} style={{background:'var(--bg3)',borderRadius:6,padding:14,textAlign:'center',borderTop:'3px solid var(--blue)'}}>
                <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>{f.label}</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:'var(--font-mono)',color:'var(--blue)'}}>{fmtCurrency(f.value)}</div>
                <div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>Forecast</div>
              </div>
            ))}
          </div></div>
        </div>
      )}
    </div>
  )
}
