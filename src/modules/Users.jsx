import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, genId, fmtDate } from '../data'

const ROLES = ['owner', 'manager', 'cashier']
const STORES = ['both', 'butchery', 'bottle']

const ALL_MODULES = [
  { id: 'admin', label: '🏪 Admin Menu' },
  { id: 'onlineorders', label: '💬 Online Orders' },
  { id: 'inventory', label: '📦 Inventory' },
  { id: 'grv', label: '📋 GRV' },
  { id: 'butchery', label: '🥩 Butchery Cuts' },
  { id: 'bottle', label: '🍺 Bottle Store' },
  { id: 'reports', label: '📊 Reports' },
  { id: 'stockcount', label: '⚖️ Stock Count' },
  { id: 'manufacturing', label: '🏭 Manufacturing' },
  { id: 'wastage', label: '🗑️ Wastage Log' },
  { id: 'fcreport', label: '📈 FC Report' },
  { id: 'users', label: '👥 Users' },
]

export default function Users({ user, onBack }) {
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => { setUsers(load(KEYS.USERS)) }, [])

  const persist = (updated) => { save(KEYS.USERS, updated); setUsers(updated) }

  const openAdd = () => {
    setForm({ username: '', password: '', name: '', role: 'cashier', store: 'butchery', active: true, allowedModules: [] })
    setShowPwd(true)
    setModal('add')
  }

  const openEdit = (u) => {
    setForm({ ...u, password: '', allowedModules: u.allowedModules || [] })
    setShowPwd(false)
    setModal('edit')
  }

  const saveUser = () => {
    if (!form.name.trim()) { alert('Full name is required'); return }
    if (!form.username.trim()) { alert('Username is required'); return }
    if (modal === 'add' && !form.password) { alert('Password is required for new users'); return }

    const all = load(KEYS.USERS)

    if (modal === 'add') {
      const dup = all.find(u => u.username === form.username.trim())
      if (dup) { alert('Username already exists'); return }
      persist([...all, { ...form, id: genId(), username: form.username.trim(), name: form.name.trim(), createdAt: new Date().toISOString() }])
    } else {
      const dup = all.find(u => u.username === form.username.trim() && u.id !== form.id)
      if (dup) { alert('Username already taken'); return }
      persist(all.map(u => u.id === form.id ? {
        ...u,
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        store: form.store,
        allowedModules: form.allowedModules || [],
        ...(form.password ? { password: form.password } : {}),
      } : u))
    }
    setModal(null)
  }

  const toggleActive = (id) => {
    if (id === user.id) { alert("You can't deactivate your own account"); return }
    const all = load(KEYS.USERS)
    persist(all.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  const roleColor = { owner: '#818cf8', manager: '#00C4A0', cashier: '#94a3b8' }
  const storeColor = { both: '#60a5fa', butchery: '#fca5a5', bottle: '#fcd34d' }
  const storeBg = { both: '#1e3a8a33', butchery: '#7f1d1d33', bottle: '#78350f33' }

  const F = (field, label, type = 'text', opts = {}) => (
    <div key={field} style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
      {opts.options ? (
        <select value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
          {opts.options.map(o => <option key={o} value={o} style={{ textTransform: 'capitalize' }}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} autoComplete="off"
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
      )}
    </div>
  )

  return (
    <Shell title="User Management" subtitle="Owner access only" onBack={onBack} actions={
      <button onClick={openAdd} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + Add User
      </button>
    }>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>{modal === 'add' ? 'Add User' : 'Edit User'}</h3>
            {F('name', 'Full Name *')}
            {F('username', 'Username *')}

            {modal === 'add' ? (
              F('password', 'Password *', 'password')
            ) : (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  New Password <span style={{ color: '#64748b' }}>(leave blank to keep current)</span>
                </label>
                <input type={showPwd ? 'text' : 'password'} value={form.password ?? ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter new password..." autoComplete="new-password"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                <button onClick={() => setShowPwd(v => !v)} style={{ marginTop: '6px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}>
                  {showPwd ? 'Hide' : 'Show'} password
                </button>
              </div>
            )}

            {F('role', 'Role', 'text', { options: ROLES })}
            {F('store', 'Store Access', 'text', { options: STORES })}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Module Access <span style={{ color: '#64748b' }}>(leave all unchecked = access all allowed by role)</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {ALL_MODULES.map(m => {
                  const checked = (form.allowedModules || []).includes(m.id)
                  return (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', backgroundColor: checked ? 'rgba(0,196,160,0.1)' : '#0f172a', border: `1px solid ${checked ? '#00C4A0' : '#334155'}` }}>
                      <input type="checkbox" checked={checked} onChange={e => {
                        const current = form.allowedModules || []
                        setForm(f => ({ ...f, allowedModules: e.target.checked ? [...current, m.id] : current.filter(x => x !== m.id) }))
                      }} style={{ accentColor: '#00C4A0' }} />
                      <span style={{ fontSize: '12px', color: checked ? '#00C4A0' : '#94a3b8' }}>{m.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={saveUser} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Users', value: users.length, color: '#94a3b8' },
          { label: 'Active', value: users.filter(u => u.active !== false).length, color: '#4ade80' },
          { label: 'Owners', value: users.filter(u => u.role === 'owner').length, color: '#818cf8' },
          { label: 'Managers', value: users.filter(u => u.role === 'manager').length, color: '#00C4A0' },
          { label: 'Cashiers', value: users.filter(u => u.role === 'cashier').length, color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a' }}>
              {['Name', 'Username', 'Role', 'Store Access', 'Created', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', opacity: u.active === false ? 0.5 : 1 }}>
                <td style={{ padding: '12px 14px', fontWeight: '600' }}>
                  {u.name}
                  {u.id === user.id && <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#0A6C6B', color: '#00C4A0', padding: '1px 6px', borderRadius: '10px' }}>YOU</span>}
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace' }}>{u.username}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: `${roleColor[u.role]}22`, color: roleColor[u.role], fontSize: '11px', fontWeight: '700', border: `1px solid ${roleColor[u.role]}44`, textTransform: 'capitalize' }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: storeBg[u.store] || '#1e293b', color: storeColor[u.store] || '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {u.store === 'both' ? 'All Stores' : u.store}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12px' }}>{fmtDate(u.createdAt)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: u.active !== false ? '#14532d33' : '#1e293b', color: u.active !== false ? '#4ade80' : '#64748b', fontSize: '11px', border: `1px solid ${u.active !== false ? '#166534' : '#334155'}` }}>
                    {u.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(u)} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                    {u.id !== user.id && (
                      <button onClick={() => toggleActive(u.id)} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: u.active !== false ? '#dc2626' : '#16a34a', cursor: 'pointer', fontSize: '11px' }}>
                        {u.active !== false ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', fontSize: '12px', color: '#64748b' }}>
        <strong style={{ color: '#94a3b8' }}>Note:</strong> Passwords are stored locally. For production use, implement server-side authentication.
      </div>
    </Shell>
  )
}
