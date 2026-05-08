// client/src/pages/AccessManagement.jsx
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accessApi } from '../services/modules'
import { useAuth } from '../context/AuthContext'
import { PageHeader, ConfirmDialog } from '../components/common/ui.jsx'
import toast from 'react-hot-toast'

// ── Module labels for permissions table ─────────────
const MODULE_META = [
  { key:'dashboard',      label:'Dashboard',            group:'Overview' },
  { key:'analytics',      label:'Analytics & Insights', group:'Overview' },
  { key:'leads',          label:'Leads & CRM',          group:'Commercial' },
  { key:'quotations',     label:'Quotations',           group:'Commercial' },
  { key:'salespo',        label:'Sales Orders',         group:'Commercial' },
  { key:'procurement',    label:'Procurement',          group:'Operations' },
  { key:'inventory',      label:'Inventory',            group:'Operations' },
  { key:'delivery',       label:'Delivery Log',         group:'Operations' },
  { key:'ar',             label:'Receivables (AR)',      group:'Finance' },
  { key:'ap',             label:'Payables (AP)',         group:'Finance' },
  { key:'creditmonitor',  label:'Credit Monitor',       group:'Finance' },
  { key:'cashflow',       label:'Cash Flow',            group:'Finance' },
  { key:'customers',      label:'Customers',            group:'Master Data' },
  { key:'vendors',        label:'Vendors',              group:'Master Data' },
  { key:'catalog',        label:'Product Catalog',      group:'Master Data' },
  { key:'pricing',        label:'Pricing Master',       group:'Master Data' },
  { key:'bglc',           label:'BG & LC Tracker',      group:'Contracts' },
  { key:'tenders',        label:'Tender Management',    group:'Contracts' },
  { key:'documents',      label:'Documents (DMS)',       group:'Contracts' },
  { key:'commissions',    label:'Commissions',          group:'Commercial Intel' },
  { key:'vendorscores',   label:'Vendor Scorecards',    group:'Commercial Intel' },
  { key:'paymentschedule',label:'Payment Schedules',    group:'Tracking' },
  { key:'prodtracking',   label:'Production Tracking',  group:'Tracking' },
  { key:'lists',          label:'Dropdown Lists',       group:'Settings' },
  { key:'sellers',        label:'Seller Recommendations',group:'Intelligence' },
  { key:'trash',          label:'Recycle Bin',          group:'System' },
  { key:'access',         label:'Access Management',    group:'System' },
]

const COUNTRIES = ['India','UAE','USA','UK','Singapore','Germany','Australia']
const GROUPS = [...new Set(MODULE_META.map(m => m.group))]

// ────────────────────────────────────────────────────
// USERS TAB
// ────────────────────────────────────────────────────
function UsersTab() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuth()
  const [filters, setFilters] = useState({ search:'', country:'', city:'', region:'' })
  const [modal, setModal] = useState({ open:false, mode:'create', data:null })
  const [pwModal, setPwModal] = useState(null) // userId
  const [deleteId, setDeleteId] = useState(null)
  const [newPw, setNewPw] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['access-users', filters],
    queryFn: () => accessApi.getUsers(filters),
  })

  const { data: rolesData } = useQuery({ queryKey:['access-roles'], queryFn: accessApi.getRoles })
  const roles = rolesData?.data || []

  const createMut = useMutation({ mutationFn: accessApi.createUser, onSuccess: (r) => { qc.invalidateQueries(['access-users']); closeModal(); toast.success(r.message) } })
  const updateMut = useMutation({ mutationFn: ({id,data}) => accessApi.updateUser(id,data), onSuccess: (r) => { qc.invalidateQueries(['access-users']); closeModal(); toast.success(r.message) } })
  const deleteMut = useMutation({ mutationFn: accessApi.deleteUser, onSuccess: () => { qc.invalidateQueries(['access-users']); toast.success('User deleted') } })
  const toggleMut = useMutation({ mutationFn: accessApi.toggleStatus, onSuccess: (r) => { qc.invalidateQueries(['access-users']); toast.success(r.message) } })
  const resetMut  = useMutation({ mutationFn: ({id,data}) => accessApi.resetPassword(id,data), onSuccess: (r) => { setPwModal(null); setNewPw(''); toast.success(r.message) } })

  const [form, setForm] = useState({ name:'', surname:'', username:'', email:'', password:'', mobile:'', country:'India', city:'', region:'', role:'viewer', roleRef:'' })
  const setF = (k,v) => setForm(f=>({...f,[k]:v}))

  const openCreate = () => { setForm({ name:'', surname:'', username:'', email:'', password:'', mobile:'', country:'India', city:'', region:'', role:'viewer', roleRef:'' }); setModal({ open:true, mode:'create', data:null }) }
  const openEdit = (u) => { setForm({ name:u.name||'', surname:u.surname||'', username:u.username||'', email:u.email||'', password:'', mobile:u.mobile||'', country:u.country||'India', city:u.city||'', region:u.region||'', role:u.role||'viewer', roleRef:u.roleRef?._id||u.roleRef||'' }); setModal({ open:true, mode:'edit', data:u }) }
  const closeModal = () => setModal({ open:false, mode:'create', data:null })

  const handleSave = () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return }
    if (modal.mode === 'create') {
      if (!form.username) { toast.error('Username is required'); return }
      if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
      createMut.mutate(form)
    } else {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      updateMut.mutate({ id: modal.data._id, data: payload })
    }
  }

  const users = data?.data || []

  const getRoleBadge = (u) => {
    const roleColors = { admin:'badge-red', sales:'badge-blue', finance:'badge-green', operations:'badge-purple', viewer:'badge-gray' }
    const roleName = u.roleRef?.name || u.role || 'viewer'
    const cls = roleColors[u.role] || 'badge-gray'
    return <span className={`badge ${cls}`}>{roleName}</span>
  }

  return (
    <div>
      {/* Search + filters bar */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'14px 16px', marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:'1 1 220px' }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:12, pointerEvents:'none' }}>⌕</span>
          <input className="form-input" style={{ paddingLeft:28 }} placeholder="Search by name, username, email, mobile..." value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} />
        </div>
        {[['country','Country'],['city','City'],['region','Region']].map(([k,l]) => (
          <input key={k} className="form-input" style={{ flex:'1 1 120px', maxWidth:150 }} placeholder={l} value={filters[k]} onChange={e=>setFilters(f=>({...f,[k]:e.target.value}))} />
        ))}
        <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ flexShrink:0 }}>+ New User</button>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { label:'Total Users', val: users.length, color:'var(--blue)' },
          { label:'Active', val: users.filter(u=>u.isActive).length, color:'var(--green)' },
          { label:'Inactive', val: users.filter(u=>!u.isActive).length, color:'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'12px 18px', flex:'1 1 120px', borderTop:`3px solid ${s.color}`, boxShadow:'var(--shadow-sm)' }}>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:700, fontFamily:'var(--font-mono)', color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:600 }}>👥 All Users <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', background:'var(--bg3)', padding:'1px 6px', borderRadius:10 }}>{users.length}</span></span>
        </div>
        <div style={{ overflowX:'auto' }}>
          {isLoading ? <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>Loading users...</div> :
           users.length === 0 ? <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No users found</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th><th>Name</th><th>Username</th><th>Email</th>
                  <th>Mobile</th><th>Location</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--blue)', fontWeight:600 }}>{u.userId}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700, flexShrink:0 }}>
                          {(u.name?.[0]||'?').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:12 }}>{u.name} {u.surname}</div>
                          <div style={{ fontSize:10, color:'var(--text3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>@{u.username}</td>
                    <td style={{ fontSize:11 }}>{u.email}</td>
                    <td style={{ fontSize:11 }}>{u.mobile||'—'}</td>
                    <td><div style={{ fontSize:11 }}>{u.city||'—'}{u.country?`, ${u.country}`:''}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{u.region||''}</div></td>
                    <td>{getRoleBadge(u)}</td>
                    <td>
                      <span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Inactive'}</span>
                    </td>
                    <td style={{ fontSize:11, color:'var(--text3)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : 'Never'}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:4}}>
                        <button className="btn-row-action" onClick={() => openEdit(u)} title="Edit">✎</button>
                        <button className={`btn-row-action ${u.isActive?'':'go'}`} onClick={() => toggleMut.mutate(u._id)} title={u.isActive?'Deactivate':'Activate'}>{u.isActive?'⏸':'▶'}</button>
                        <button className="btn-row-action" onClick={() => { setPwModal(u._id); setNewPw('') }} title="Reset password">🔑</button>
                        {u._id !== currentUser?._id && u.role !== 'admin' && (
                          <button className="btn-row-action del" onClick={() => setDeleteId(u._id)} title="Delete">🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {modal.open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
          <div style={{ background:'var(--bg1)', border:'1px solid var(--border2)', borderRadius:12, width:'min(680px,100%)', maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{modal.mode==='create'?'👤 New User':'✎ Edit User'}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{modal.mode==='create'?'Create a new user account':'Update user details and permissions'}</div>
              </div>
              <button onClick={closeModal} style={{ background:'none', border:'1px solid var(--border2)', width:30, height:30, borderRadius:6, cursor:'pointer', fontSize:14, color:'var(--text3)' }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
              <div className="form-section"><div className="form-section-title">Personal Information</div>
                <div className="form-grid">
                  <div className="form-field"><label className="form-label">First Name <span className="req">*</span></label><input className="form-input" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="First name" /></div>
                  <div className="form-field"><label className="form-label">Surname</label><input className="form-input" value={form.surname} onChange={e=>setF('surname',e.target.value)} placeholder="Last name" /></div>
                  <div className="form-field"><label className="form-label">Mobile Number</label><input className="form-input" value={form.mobile} onChange={e=>setF('mobile',e.target.value)} placeholder="+91-9999999999" /></div>
                </div>
              </div>
              <div className="form-section"><div className="form-section-title">Account Details</div>
                <div className="form-grid">
                  <div className="form-field"><label className="form-label">Username <span className="req">*</span></label><input className="form-input" value={form.username} onChange={e=>setF('username',e.target.value.toLowerCase().replace(/\s+/g,'.'))} placeholder="john.doe" /></div>
                  <div className="form-field"><label className="form-label">Email Address <span className="req">*</span></label><input className="form-input" type="email" value={form.email} onChange={e=>setF('email',e.target.value)} placeholder="user@company.com" /></div>
                  {modal.mode==='create' && <div className="form-field form-full"><label className="form-label">Password <span className="req">*</span></label><input className="form-input" type="password" value={form.password} onChange={e=>setF('password',e.target.value)} placeholder="Minimum 6 characters" /></div>}
                </div>
              </div>
              <div className="form-section"><div className="form-section-title">Location</div>
                <div className="form-grid">
                  <div className="form-field"><label className="form-label">Country</label>
                    <select className="form-select" value={form.country} onChange={e=>setF('country',e.target.value)}>
                      {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-field"><label className="form-label">City</label><input className="form-input" value={form.city} onChange={e=>setF('city',e.target.value)} placeholder="City" /></div>
                  <div className="form-field"><label className="form-label">Region</label><input className="form-input" value={form.region} onChange={e=>setF('region',e.target.value)} placeholder="Region / State" /></div>
                </div>
              </div>
              <div className="form-section"><div className="form-section-title">Role & Permissions</div>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">System Role</label>
                    <select className="form-select" value={form.role} onChange={e=>setF('role',e.target.value)}>
                      {['admin','sales','finance','operations','viewer'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Custom Role (overrides system role)</label>
                    <select className="form-select" value={form.roleRef} onChange={e=>setF('roleRef',e.target.value)}>
                      <option value="">— No custom role —</option>
                      {roles.map(r=><option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop:10, padding:10, background:'var(--blue-light)', border:'1px solid var(--blue-border)', borderRadius:6, fontSize:11, color:'var(--blue)' }}>
                  ℹ If a Custom Role is assigned, it overrides the System Role for module-level access control.
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', background:'var(--bg2)', display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={createMut.isPending||updateMut.isPending}>
                {createMut.isPending||updateMut.isPending ? 'Saving...' : modal.mode==='create'?'Create User':'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget){setPwModal(null);setNewPw('')}}}>
          <div style={{ background:'var(--bg1)', border:'1px solid var(--border2)', borderRadius:12, width:'min(420px,96vw)', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:15, fontWeight:700 }}>🔑 Reset Password</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>Set a new password for this user</div>
            </div>
            <div style={{ padding:22 }}>
              <div className="form-field"><label className="form-label">New Password <span className="req">*</span></label>
                <input className="form-input" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Minimum 6 characters" autoFocus />
              </div>
              {newPw && newPw.length < 6 && <div style={{ fontSize:11, color:'var(--red)', marginTop:4 }}>Password must be at least 6 characters</div>}
            </div>
            <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', background:'var(--bg2)', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn btn-ghost" onClick={()=>{setPwModal(null);setNewPw('')}}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>resetMut.mutate({id:pwModal,data:{newPassword:newPw}})} disabled={!newPw||newPw.length<6}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>deleteMut.mutate(deleteId)} title="Delete User" message="Permanently delete this user account? This cannot be undone." danger />
    </div>
  )
}

// ────────────────────────────────────────────────────
// ROLES TAB
// ────────────────────────────────────────────────────
function RolesTab() {
  const qc = useQueryClient()
  const [modal, setModal] = useState({ open:false, mode:'create', data:null })
  const [deleteId, setDeleteId] = useState(null)
  const [perms, setPerms] = useState({})

  const { data, isLoading } = useQuery({ queryKey:['access-roles'], queryFn: accessApi.getRoles })
  const roles = data?.data || []

  const createMut = useMutation({ mutationFn: accessApi.createRole, onSuccess: (r)=>{ qc.invalidateQueries(['access-roles']); closeModal(); toast.success(r.message) } })
  const updateMut = useMutation({ mutationFn: ({id,data})=>accessApi.updateRole(id,data), onSuccess: (r)=>{ qc.invalidateQueries(['access-roles']); closeModal(); toast.success(r.message) } })
  const deleteMut = useMutation({ mutationFn: accessApi.deleteRole, onSuccess: ()=>{ qc.invalidateQueries(['access-roles']); toast.success('Role deleted') } })

  const [form, setForm] = useState({ name:'', description:'' })

  const openCreate = () => {
    const initPerms = {}
    MODULE_META.forEach(m => { initPerms[m.key] = { read:false, write:false, delete:false } })
    setPerms(initPerms)
    setForm({ name:'', description:'' })
    setModal({ open:true, mode:'create', data:null })
  }

  const openEdit = (role) => {
    const initPerms = {}
    MODULE_META.forEach(m => { initPerms[m.key] = { read:false, write:false, delete:false } })
    ;(role.permissions||[]).forEach(p => { initPerms[p.module] = { read:!!p.read, write:!!p.write, delete:!!p.delete } })
    setPerms(initPerms)
    setForm({ name:role.name, description:role.description||'' })
    setModal({ open:true, mode:'edit', data:role })
  }

  const closeModal = () => setModal({ open:false, mode:'create', data:null })

  const setPermission = (module, action, val) => {
    setPerms(p => ({
      ...p,
      [module]: {
        ...p[module],
        [action]: val,
        // If setting write=true, also enable read; if removing read, also remove write+delete
        ...(action==='write'&&val ? { read:true } : {}),
        ...(action==='delete'&&val ? { read:true, write:true } : {}),
        ...(action==='read'&&!val ? { write:false, delete:false } : {}),
      }
    }))
  }

  const setGroupAll = (group, action, val) => {
    const groupModules = MODULE_META.filter(m=>m.group===group).map(m=>m.key)
    setPerms(p => {
      const next = { ...p }
      groupModules.forEach(mod => {
        next[mod] = { ...next[mod], [action]: val }
        if (action==='write'&&val) next[mod].read = true
        if (action==='delete'&&val) { next[mod].read = true; next[mod].write = true }
        if (action==='read'&&!val) { next[mod].write = false; next[mod].delete = false }
      })
      return next
    })
  }

  const setAllModules = (action, val) => {
    setPerms(p => {
      const next = {}
      MODULE_META.forEach(m => {
        next[m.key] = { ...p[m.key], [action]: val }
        if (action==='write'&&val) next[m.key].read = true
        if (action==='delete'&&val) { next[m.key].read = true; next[m.key].write = true }
        if (action==='read'&&!val) { next[m.key].write = false; next[m.key].delete = false }
      })
      return next
    })
  }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Role name is required'); return }
    const permissions = Object.entries(perms).map(([module, p]) => ({ module, ...p }))
    if (modal.mode==='create') createMut.mutate({ ...form, permissions })
    else updateMut.mutate({ id: modal.data._id, data: { ...form, permissions } })
  }

  const getPermSummary = (role) => {
    const perms = role.permissions || []
    const readCount = perms.filter(p=>p.read).length
    const writeCount = perms.filter(p=>p.write).length
    const deleteCount = perms.filter(p=>p.delete).length
    return { readCount, writeCount, deleteCount, total: perms.length }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'var(--text3)' }}>Define roles with granular read, write, and delete permissions per module</div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New Role</button>
      </div>

      {isLoading ? <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>Loading roles...</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
          {roles.map(role => {
            const summary = getPermSummary(role)
            return (
              <div key={role._id} className="card" style={{ padding:'18px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{role.name}</span>
                      {role.isSystem && <span className="badge badge-blue" style={{ fontSize:9 }}>SYSTEM</span>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{role.description||'No description'}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="btn-row-action" onClick={()=>openEdit(role)}>✎ Edit</button>
                    {!role.isSystem && <button className="btn-row-action del" onClick={()=>setDeleteId(role._id)}>🗑</button>}
                  </div>
                </div>

                {/* Permission summary bars */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  {[
                    { label:'Read', count:summary.readCount, color:'var(--blue)', bg:'var(--blue-dim)' },
                    { label:'Write', count:summary.writeCount, color:'var(--green)', bg:'var(--green-dim)' },
                    { label:'Delete', count:summary.deleteCount, color:'var(--red)', bg:'var(--red-dim)' },
                  ].map(s => (
                    <div key={s.label} style={{ background:s.bg, borderRadius:6, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:700, color:s.color, fontFamily:'var(--font-mono)' }}>{s.count}</div>
                      <div style={{ fontSize:9, color:s.color, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'var(--text3)' }}>
                  <span>👤 {role.userCount||0} user{role.userCount!==1?'s':''}</span>
                  <span>{summary.readCount}/{summary.total} modules accessible</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Role Form Modal */}
      {modal.open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
          <div style={{ background:'var(--bg1)', border:'1px solid var(--border2)', borderRadius:12, width:'min(900px,100%)', maxHeight:'94vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
            {/* Modal header */}
            <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{modal.mode==='create'?'🔐 New Role':'✎ Edit Role'}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Configure module-level read, write, and delete permissions</div>
              </div>
              <button onClick={closeModal} style={{ background:'none', border:'1px solid var(--border2)', width:30, height:30, borderRadius:6, cursor:'pointer', fontSize:14, color:'var(--text3)' }}>✕</button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
              {/* Role info */}
              <div className="form-grid" style={{ marginBottom:20 }}>
                <div className="form-field"><label className="form-label">Role Name <span className="req">*</span></label><input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Sales Manager" /></div>
                <div className="form-field"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description of this role's responsibilities" /></div>
              </div>

              {/* Bulk toggles */}
              <div style={{ display:'flex', gap:8, marginBottom:16, padding:'10px 14px', background:'var(--bg2)', borderRadius:8, border:'1px solid var(--border)', flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginRight:4 }}>Quick Set All:</span>
                {[['read','Read All','var(--blue)'],['write','Write All','var(--green)'],['delete','Delete All','var(--red)']].map(([a,l,c])=>(
                  <div key={a} style={{ display:'flex', gap:4 }}>
                    <button className="btn btn-secondary btn-xs" style={{ borderColor:c, color:c }} onClick={()=>setAllModules(a,true)}>✓ {l}</button>
                    <button className="btn btn-ghost btn-xs" onClick={()=>setAllModules(a,false)}>✕</button>
                  </div>
                ))}
              </div>

              {/* Permissions table grouped */}
              {GROUPS.map(group => {
                const groupMods = MODULE_META.filter(m=>m.group===group)
                return (
                  <div key={group} style={{ marginBottom:16 }}>
                    {/* Group header */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg3)', borderRadius:'6px 6px 0 0', border:'1px solid var(--border)', borderBottom:'none' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:1, flex:1 }}>{group}</span>
                      <div style={{ display:'flex', gap:6}}>
                        {['read','write','delete'].map(a=>(
                          <label key={a} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'var(--text3)', cursor:'pointer' }}>
                            <input type="checkbox"
                              checked={groupMods.every(m=>perms[m.key]?.[a])}
                              onChange={e=>setGroupAll(group,a,e.target.checked)}
                              style={{ accentColor:'var(--blue)', width:13, height:13 }}
                            />
                            All {a}
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Module rows */}
                    <div style={{ border:'1px solid var(--border)', borderRadius:'0 0 6px 6px', overflow:'hidden' }}>
                      {groupMods.map((m, idx) => (
                        <div key={m.key} style={{ display:'flex', alignItems:'center', padding:'10px 12px', borderBottom: idx<groupMods.length-1?'1px solid var(--border)':'none', background: idx%2===0?'var(--bg1)':'var(--bg2)', transition:'background 0.1s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='var(--blue-light)'}
                          onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?'var(--bg1)':'var(--bg2)'}
                        >
                          <span style={{ flex:1, fontSize:12, fontWeight:500, color:'var(--text1)' }}>{m.label}</span>
                          <div style={{ display:'flex', gap:20 }}>
                            {['read','write','delete'].map(action => (
                              <label key={action} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', minWidth:64, justifyContent:'center' }}>
                                <input
                                  type="checkbox"
                                  checked={!!perms[m.key]?.[action]}
                                  onChange={e=>setPermission(m.key, action, e.target.checked)}
                                  style={{ accentColor: action==='read'?'var(--blue)':action==='write'?'var(--green)':'var(--red)', width:15, height:15, cursor:'pointer' }}
                                />
                                <span style={{ fontSize:10, color: action==='read'?'var(--blue)':action==='write'?'var(--green)':'var(--red)', fontWeight:600 }}>
                                  {action.charAt(0).toUpperCase()+action.slice(1)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', background:'var(--bg2)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                Read: {Object.values(perms).filter(p=>p.read).length} | Write: {Object.values(perms).filter(p=>p.write).length} | Delete: {Object.values(perms).filter(p=>p.delete).length} modules
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={createMut.isPending||updateMut.isPending}>
                  {createMut.isPending||updateMut.isPending?'Saving...':modal.mode==='create'?'Create Role':'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>deleteMut.mutate(deleteId)} title="Delete Role" message="Delete this role? Users assigned this role will lose custom permissions." danger />
    </div>
  )
}

// ────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────
export default function AccessManagement() {
  const [tab, setTab] = useState('users')
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Access Management" icon="🔐" subtitle="User and role management" />
        <div style={{ padding:60, textAlign:'center', background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:10 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--text1)', marginBottom:6 }}>Access Denied</div>
          <div style={{ fontSize:13, color:'var(--text3)' }}>Only administrators can manage users and roles.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Access Management" icon="🔐" subtitle="Manage users, roles, and module-level permissions" />

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:4, width:'fit-content' }}>
        {[['users','👥 Users'],['roles','🔐 Roles']].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'9px 24px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:13, fontWeight:tab===key?600:400, background:tab===key?'var(--blue)':'transparent', color:tab===key?'white':'var(--text2)', transition:'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UsersTab /> : <RolesTab />}
    </div>
  )
}
