// client/src/components/common/Topbar.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../services/modules'
import { fmtCurrency, fmtPct } from '../../utils/format'

const VIEW_LABELS = {
  '/': 'Dashboard', '/analytics': 'Analytics', '/leads': 'Leads & CRM',
  '/quotations': 'Quotations', '/salespo': 'Sales Orders', '/procurement': 'Procurement',
  '/inventory': 'Inventory', '/delivery': 'Delivery Log', '/ar': 'Accounts Receivable',
  '/ap': 'Accounts Payable', '/customers': 'Customers', '/vendors': 'Vendors',
  '/catalog': 'Product Catalog', '/pricing': 'Pricing Master', '/bglc': 'BG & LC Tracker',
  '/tenders': 'Tender Management', '/documents': 'Documents (DMS)',
  '/payment-schedules': 'Payment Schedules', '/prod-tracking': 'Production Tracking',
  '/commissions': 'Commissions', '/vendor-scores': 'Vendor Scorecards',
  '/credit-monitor': 'Credit Monitor', '/cash-flow': 'Cash Flow',
  '/lists': 'Dropdown Lists', '/sellers': 'Seller Recommendations', '/trash': 'Recycle Bin',
}

const ADD_LABELS = {
  '/': 'Quick Add', '/leads': '+ New Lead', '/quotations': '+ New Quote',
  '/salespo': '+ New Sales PO', '/procurement': '+ New Purchase PO',
  '/inventory': '+ Stock Item', '/delivery': '+ New Dispatch',
  '/ar': '+ AR Entry', '/ap': '+ AP Entry', '/customers': '+ New Customer',
  '/vendors': '+ New Vendor', '/catalog': '+ New SKU', '/bglc': '+ New BG / LC',
  '/tenders': '+ New Tender', '/documents': '+ Upload Doc',
  '/payment-schedules': '+ New Schedule', '/prod-tracking': '+ Track Order',
  '/commissions': '+ New Commission', '/vendor-scores': '+ Rate Vendor',
  '/lists': '+ New List', '/sellers': '🔍 Search Sellers',
}

export default function Topbar({ onAddClick }) {
  const { toggle } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const label = VIEW_LABELS[location.pathname] || 'Trueleqtric'
  const addLabel = ADD_LABELS[location.pathname] || '+ Add New'

  const { data: ticker } = useQuery({
    queryKey: ['ticker'],
    queryFn: dashboardApi.getTicker,
    refetchInterval: 30000,
  })

  const tickerItems = ticker ? [
    { label: 'PIPELINE', val: fmtCurrency(ticker.pipeline), cls: 'tup' },
    { label: 'REVENUE', val: fmtCurrency(ticker.revenue), cls: '' },
    { label: 'AVG MARGIN', val: fmtPct(ticker.avgMargin), cls: ticker.avgMargin > 0.15 ? 'tup' : 'tdown' },
    { label: 'OVERDUE AR', val: fmtCurrency(ticker.overdue), cls: ticker.overdue > 0 ? 'tdown' : 'tup' },
    { label: 'ACTIVE LEADS', val: ticker.activeLeads, cls: '' },
    { label: 'ACTIVE POs', val: ticker.activePOs, cls: '' },
  ] : []

  return (
    <header className="topbar">
      {/* Left */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={toggle} style={{ display:'flex', flexDirection:'column', gap:4, padding:7, background:'none', border:'none', cursor:'pointer', borderRadius:4 }}>
          {[0,1,2].map(i => <span key={i} style={{ display:'block', width:17, height:2, background:'var(--text3)', borderRadius:1 }} />)}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text3)' }}>
          <span>Trueleqtric</span>
          <span style={{ color:'var(--text4)' }}>›</span>
          <span style={{ color:'var(--text1)', fontWeight:600 }}>{label}</span>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center', margin:'0 16px' }}>
        {tickerItems.length > 0 && (
          <div className="ticker-inner">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text3)' }}>
                <span style={{ color:'var(--text4)', fontSize:10 }}>{item.label}</span>
                <span style={{ fontWeight:600, color: item.cls === 'tup' ? 'var(--green)' : item.cls === 'tdown' ? 'var(--red)' : 'var(--text1)' }}>{item.val}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
        <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
        </span>
        {addLabel && (
          <button
            className="btn btn-primary"
            onClick={onAddClick}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px' }}
          >
            {addLabel}
          </button>
        )}
      </div>
    </header>
  )
}
