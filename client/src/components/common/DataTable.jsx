// client/src/components/common/DataTable.jsx
import { useState, useMemo } from 'react'

export default function DataTable({
  title, icon, columns, data = [], filters = [], actions,
  onRowClick, searchPlaceholder = 'Search…', loading, emptyText = 'No records found',
  rowKey = '_id',
}) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    let rows = [...data]
    // Filter chips
    if (activeFilter !== 'All') {
      rows = rows.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(activeFilter.toLowerCase()))
      )
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        Object.values(r).some(v => String(v).toLowerCase().includes(q))
      )
    }
    // Sort
    if (sortCol) {
      rows.sort((a, b) => {
        const av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return rows
  }, [data, search, activeFilter, sortCol, sortDir])

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('asc') }
  }

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', background:'var(--bg2)' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text1)', display:'flex', alignItems:'center', gap:7 }}>
          {icon && <span style={{ color:'var(--blue)' }}>{icon}</span>}
          {title}
          <span style={{ fontSize:10, color:'var(--text3)', background:'var(--bg3)', padding:'1px 6px', borderRadius:10, fontFamily:'var(--font-mono)' }}>
            {filtered.length}
          </span>
        </div>
        {actions && <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>{actions}</div>}
        <div style={{ position:'relative', marginLeft: actions ? 0 : 'auto' }}>
          <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:12, pointerEvents:'none' }}>⌕</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background:'var(--bg1)', border:'1px solid var(--border2)', color:'var(--text1)', fontSize:12, padding:'5px 10px 5px 27px', borderRadius:'var(--radius)', outline:'none', width:180, transition:'all 0.15s' }}
            onFocus={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.width = '220px' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.width = '180px' }}
          />
        </div>
      </div>

      {/* Filter chips */}
      {filters.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', padding:'8px 14px', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
          {['All', ...filters].map(f => (
            <button key={f} className={`filter-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text3)', fontSize:12 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize:36, marginBottom:10, opacity:0.2 }}>📭</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>{emptyText}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>No records match your current filters</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    style={{ textAlign: col.align || 'left', ...col.thStyle }}
                    className={sortCol === col.key ? `sort-${sortDir}` : ''}
                  >
                    {col.label}
                    {sortCol === col.key && <span style={{ color:'var(--blue)' }}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row[rowKey] || row._id} onClick={() => onRowClick?.(row)}>
                  {columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align || 'left', ...col.tdStyle }}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
