import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, genId, fmtDate, fmtDateTime, today } from '../../data'

export default function Attendance({ user, onBack }) {
  const [attendance, setAttendance] = useState([])
  const [users, setUsers] = useState([])
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [message, setMessage] = useState(null)
  const [tab, setTab] = useState('clock')
  const [dateFilter, setDateFilter] = useState(today())

  useEffect(() => {
    setAttendance(load(KEYS.ATTENDANCE))
    setUsers(load(KEYS.USERS).filter(u => u.active !== false))
  }, [])

  const todayStr = today()

  const handleClock = () => {
    setErr('')
    const allUsers = load(KEYS.USERS)
    const matchUser = allUsers.find(u => u.password === pwd && u.active !== false)
    if (!matchUser) { setErr('Password not recognised. Please try again.'); setPwd(''); return }

    const allAttendance = load(KEYS.ATTENDANCE)
    const todayRecords = allAttendance.filter(a => a.date === todayStr && a.userId === matchUser.id)
    const lastRecord = todayRecords[todayRecords.length - 1]
    const isClockIn = !lastRecord || lastRecord.type === 'out'

    const entry = {
      id: genId(),
      date: todayStr,
      userId: matchUser.id,
      userName: matchUser.name,
      userRole: matchUser.role,
      type: isClockIn ? 'in' : 'out',
      timestamp: new Date().toISOString(),
    }

    const updated = [...allAttendance, entry]
    save(KEYS.ATTENDANCE, updated)
    setAttendance(updated)
    setMessage({ name: matchUser.name, action: isClockIn ? 'Clocked IN' : 'Clocked OUT', time: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) })
    setPwd('')
    setTimeout(() => setMessage(null), 4000)
  }

  const getHoursWorked = (userId, date) => {
    const records = attendance.filter(a => a.userId === userId && a.date === date).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    let total = 0
    for (let i = 0; i < records.length - 1; i += 2) {
      if (records[i].type === 'in' && records[i + 1]?.type === 'out') {
        total += (new Date(records[i + 1].timestamp) - new Date(records[i].timestamp)) / 3600000
      }
    }
    return total.toFixed(2)
  }

  const filteredRecords = attendance.filter(a => a.date === dateFilter).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const staffSummary = users.map(u => {
    const records = attendance.filter(a => a.userId === u.id && a.date === dateFilter)
    const lastRecord = records[records.length - 1]
    const hours = getHoursWorked(u.id, dateFilter)
    return { ...u, clocked: records.length > 0, status: lastRecord?.type, hours, recordCount: records.length }
  }).filter(u => u.clocked || dateFilter === todayStr)

  return (
    <Shell title="Attendance" subtitle="Staff clock in / clock out" onBack={onBack}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[['clock', 'Clock In/Out'], ['today', "Today's Log"], ['history', 'History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: tab === id ? '#0A6C6B' : 'transparent', color: tab === id ? 'white' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'clock' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '28px' }}>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '16px' }}>Staff Clock In / Out</h3>
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', margin: '0 0 24px' }}>Enter your password to clock in or out</p>

            {message && (
              <div style={{ backgroundColor: '#14532d33', border: '1px solid #166534', borderRadius: '10px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', color: '#4ade80', fontWeight: '800', fontSize: '18px' }}>{message.name}</p>
                <p style={{ margin: '0 0 4px', color: 'white', fontWeight: '700' }}>{message.action}</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{message.time}</p>
              </div>
            )}

            <input
              type="password"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleClock()}
              placeholder="Enter your password"
              autoFocus
              style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', border: `2px solid ${err ? '#dc2626' : '#334155'}`, borderRadius: '10px', color: 'white', fontSize: '20px', boxSizing: 'border-box', outline: 'none', textAlign: 'center', letterSpacing: '4px', marginBottom: '10px' }}
            />
            {err && <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', margin: '0 0 10px' }}>{err}</p>}
            <button onClick={handleClock} style={{ width: '100%', padding: '14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
              Clock In / Out
            </button>
          </div>

          {/* Today status */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Today's Status — {fmtDate(todayStr)}</h3>
            {staffSummary.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', margin: '40px 0' }}>No staff have clocked in today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {staffSummary.map(s => (
                  <div key={s.id} style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px' }}>{s.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{s.role} • {s.store}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: s.status === 'in' ? '#14532d33' : '#1e293b', color: s.status === 'in' ? '#4ade80' : '#64748b', fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        {s.status === 'in' ? '🟢 Clocked In' : '🔴 Clocked Out'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{s.hours > 0 ? `${s.hours}h worked` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'today' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Today's Records — {fmtDate(todayStr)}</h3>
            <span style={{ color: '#64748b', fontSize: '13px' }}>{filteredRecords.length} events</span>
          </div>
          {filteredRecords.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No attendance records for today.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Time', 'Staff', 'Role', 'Action'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredRecords.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>{new Date(r.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{r.userName}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', textTransform: 'capitalize' }}>{r.userRole}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: r.type === 'in' ? '#14532d33' : '#7f1d1d33', color: r.type === 'in' ? '#4ade80' : '#fca5a5', fontSize: '12px', fontWeight: '700' }}>
                        {r.type === 'in' ? '→ Clock IN' : '← Clock OUT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '9px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }} />
            <button onClick={() => setDateFilter(today())} style={{ padding: '9px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>Today</button>
          </div>

          {users.length > 0 && (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>Staff Summary — {fmtDate(dateFilter)}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Staff', 'Role', 'Clock In', 'Clock Out', 'Hours'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map((u, i) => {
                    const recs = attendance.filter(a => a.userId === u.id && a.date === dateFilter).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                    const firstIn = recs.find(r => r.type === 'in')
                    const lastOut = [...recs].reverse().find(r => r.type === 'out')
                    const hours = getHoursWorked(u.id, dateFilter)
                    if (recs.length === 0) return null
                    return (
                      <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{u.name}</td>
                        <td style={{ padding: '10px 14px', color: '#64748b', textTransform: 'capitalize' }}>{u.role}</td>
                        <td style={{ padding: '10px 14px', color: '#4ade80', fontFamily: 'monospace' }}>{firstIn ? new Date(firstIn.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#fca5a5', fontFamily: 'monospace' }}>{lastOut ? new Date(lastOut.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : lastIn ? <span style={{ color: '#f59e0b' }}>Still In</span> : '—'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>{hours}h</td>
                      </tr>
                    )
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Shell>
  )
}
