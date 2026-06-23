import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, fmtDateTime, today } from '../data'

const ACTION_LABELS = {
  LOGIN: { label: 'Login', color: '#00C4A0', icon: '🔑' },
  LOGOUT: { label: 'Logout', color: '#64748b', icon: '🚪' },
  ORDERS_ACCESS: { label: 'Opened Orders', color: '#0A6C6B', icon: '🛒' },
  ORDERS_ACCESS_OVERRIDE: { label: 'Orders Override', color: '#f59e0b', icon: '⚡' },
  SALE_COMPLETE: { label: 'Sale Completed', color: '#4ade80', icon: '✅' },
  VOID: { label: 'Item Voided', color: '#dc2626', icon: '❌' },
  GRV_SUBMIT: { label: 'GRV Submitted', color: '#818cf8', icon: '📋' },
  STOCK_COUNT_START: { label: 'Stock Count Started', color: '#0e7490', icon: '⚖️' },
  STOCK_COUNT_SUBMIT: { label: 'Stock Count Submitted', color: '#0e7490', icon: '⚖️' },
  STOCK_COUNT_APPLY: { label: 'Stock Count Applied', color: '#4ade80', icon: '✅' },
  STOCK_COUNT_DELETE: { label: 'Stock Count Deleted', color: '#dc2626', icon: '🗑️' },
  BUTCHERY_CUTS: { label: 'Butchery Processing', color: '#b91c1c', icon: '🥩' },
  CHARCOAL_RECEIVE: { label: 'Charcoal Received', color: '#f59e0b', icon: '🔥' },
  CHARCOAL_USE: { label: 'Charcoal Used', color: '#f59e0b', icon: '🔥' },
  MANUFACTURING: { label: 'Manufacturing', color: '#7c3aed', icon: '🏭' },
}

export default function ActivityMonitor({ user, onBack }) {
  const [log, setLog] = useState([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [users, setUsers] = useState([])

  useEffect(() => {
    setLog(load(KEYS.ACTIVITY_LOG))
    setUsers(load(KEYS.USERS))
  }, [])

  const refresh = () => setLog(load(KEYS.ACTIVITY_LOG))

  const filtered = [...log].reverse().filter(e => {
    const d = e.timestamp?.slice(0, 10)
    if (d < from || d > to) return false
    if (actionFilter !== 'all' && e.action !== actionFilter) return false
    if (userFilter !== 'all' && e.userId !== userFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return e.userName?.toLowerCase().includes(q) || e.action?.toLowerCase().includes(q) ||
        JSON.stringify(e.details || {}).toLowerCase().includes(q)
    }
    return true
  })

  const uniqueActions = [...new Set(log.map(e => e.action))]
  const salesToday = log.filter(e => e.action === 'SALE_COMPLETE' && e.timestamp?.startsWith(today())).length
  const voidsToday = log.filter(e => e.action === 'VOID' && e.timestamp?.startsWith(today())).length
  const overridesToday = log.filter(e => e.action === 'ORDERS_ACCESS_OVERRIDE' && e.timestamp?.startsWith(today())).length

  return (
    <Shell title="Activity Monitor" subtitle="Owner access only — all system events" onBack={onBack} actions={
      <button onClick={refresh} style={{ padding: '7px 14px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
        ↺ Refresh
      </button>
    }>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Events', value: log.length, color: '#94a3b8' },
          { label: 'Sales Today', value: salesToday, color: '#4ade80' },
          { label: 'Voids Today', value: voidsToday, color: '#dc2626' },
          { label: 'Overrides Today', value: overridesToday, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>FROM</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>TO</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>STAFF MEMBER</label>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px' }}>
            <option value="all">All Staff</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>ACTION TYPE</label>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px' }}>
            <option value="all">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>SEARCH</label>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, action, details..."
            style={{ width: '100%', padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
        </div>
      </div>

      <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px' }}>{filtered.length} events matching filters</p>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📋</p>
          <p style={{ margin: 0 }}>No activity events found for the selected filters.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Timestamp', 'Staff Member', 'Role', 'Action', 'Details'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const meta = ACTION_LABELS[e.action] || { label: e.action, color: '#94a3b8', icon: '•' }
                const details = e.details || {}
                return (
                  <tr key={e.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: e.action === 'VOID' || e.action === 'ORDERS_ACCESS_OVERRIDE' ? 'rgba(220,38,38,0.04)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fmtDateTime(e.timestamp)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{e.userName}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', backgroundColor: e.userRole === 'owner' ? '#818cf833' : e.userRole === 'manager' ? '#0A6C6B33' : '#33415533', color: e.userRole === 'owner' ? '#818cf8' : e.userRole === 'manager' ? '#00C4A0' : '#94a3b8', fontWeight: '600' }}>
                        {e.userRole}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ color: meta.color, fontWeight: '700' }}>{meta.icon} {meta.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>
                      {details.orderNumber && `Order: ${details.orderNumber} `}
                      {details.total !== undefined && `Total: R${details.total?.toFixed(2)} `}
                      {details.item && `Item: ${details.item} `}
                      {details.reason && `Reason: ${details.reason} `}
                      {details.approvedBy && `By: ${details.approvedBy} `}
                      {details.overriddenBy && `Override by: ${details.overriddenBy} `}
                      {details.store && `Store: ${details.store} `}
                      {details.supplier && `Supplier: ${details.supplier} `}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
