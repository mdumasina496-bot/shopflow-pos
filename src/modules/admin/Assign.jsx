import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, R, genId, fmtDateTime, today } from '../../data'

export default function Assign({ user, onBack }) {
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [tills, setTills] = useState([])
  const [shifts, setShifts] = useState([])
  const [form, setForm] = useState({ cashierId: '', tillId: '', shiftId: '', float: '' })
  const [mgrPwd, setMgrPwd] = useState('')
  const [cashierPwd, setCashierPwd] = useState('')
  const [step, setStep] = useState('form') // form | mgr-verify | cashier-verify | done
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('active')

  useEffect(() => {
    const allAssignments = load(KEYS.ASSIGNMENTS)
    setAssignments(allAssignments)
    const allUsers = load(KEYS.USERS).filter(u => u.role === 'cashier' && u.active !== false)
    setUsers(allUsers)
    setTills(load(KEYS.TILLS).filter(t => t.active))
    setShifts(load(KEYS.SHIFTS).filter(s => s.active))
  }, [])

  const todayStr = today()
  const activeToday = assignments.filter(a => a.date === todayStr && a.status === 'open')
  const closedToday = assignments.filter(a => a.date === todayStr && a.status === 'closed')

  const assignedCashierIds = activeToday.map(a => a.cashierId)
  const assignedTillIds = activeToday.map(a => a.tillId)

  const verifyManager = () => {
    const allUsers = load(KEYS.USERS)
    const mgr = allUsers.find(u => u.password === mgrPwd && (u.role === 'manager' || u.role === 'owner') && u.active !== false)
    if (!mgr) { setErr('Incorrect manager password'); setMgrPwd(''); return }
    setErr('')
    setStep('cashier-verify')
    setMgrPwd('')
  }

  const verifyCashier = () => {
    const allUsers = load(KEYS.USERS)
    const cashierUser = allUsers.find(u => u.id === form.cashierId)
    if (!cashierUser || cashierUser.password !== cashierPwd) { setErr('Incorrect cashier password'); setCashierPwd(''); return }
    setErr('')

    const till = tills.find(t => t.id === form.tillId)
    const shift = shifts.find(s => s.id === form.shiftId)
    const newAssignment = {
      id: genId(),
      date: todayStr,
      cashierId: cashierUser.id,
      cashierName: cashierUser.name,
      tillId: till?.id || null,
      tillName: till?.name || 'No Till',
      tillNumber: till?.number || null,
      shiftId: shift?.id || null,
      shiftName: shift?.name || null,
      float: parseFloat(form.float) || 0,
      status: 'open',
      assignedBy: user.name,
      assignedAt: new Date().toISOString(),
    }

    const allAssignments = load(KEYS.ASSIGNMENTS)
    save(KEYS.ASSIGNMENTS, [...allAssignments, newAssignment])
    setAssignments([...allAssignments, newAssignment])
    setStep('done')
    setForm({ cashierId: '', tillId: '', shiftId: '', float: '' })
    setCashierPwd('')
  }

  const closeAssignment = (id) => {
    const all = load(KEYS.ASSIGNMENTS)
    const updated = all.map(a => a.id === id ? { ...a, status: 'closed', closedAt: new Date().toISOString() } : a)
    save(KEYS.ASSIGNMENTS, updated)
    setAssignments(updated)
  }

  const selectedCashier = users.find(u => u.id === form.cashierId)
  const selectedTill = tills.find(t => t.id === form.tillId)
  const selectedShift = shifts.find(s => s.id === form.shiftId)

  return (
    <Shell title="Assign" subtitle="Cashier & till assignment" onBack={onBack}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px' }}>
        {/* Assignment form */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Assignment</h3>

          {step === 'done' && (
            <div style={{ backgroundColor: '#14532d33', border: '1px solid #166534', borderRadius: '8px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ color: '#4ade80', fontWeight: '700', margin: 0, fontSize: '15px' }}>✅ Cashier Assigned!</p>
              <p style={{ color: '#94a3b8', margin: '4px 0 12px', fontSize: '12px' }}>They can now process orders.</p>
              <button onClick={() => setStep('form')} style={{ padding: '8px 20px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '7px', color: '#0f172a', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                New Assignment
              </button>
            </div>
          )}

          {step === 'form' && (
            <>
              {[
                { label: 'Cashier *', field: 'cashierId', options: users.map(u => ({ value: u.id, label: `${u.name}${assignedCashierIds.includes(u.id) ? ' (already assigned)' : ''}` })) },
                { label: 'Till', field: 'tillId', options: tills.map(t => ({ value: t.id, label: `${t.name}${assignedTillIds.includes(t.id) ? ' (in use)' : ''}` })) },
                { label: 'Shift', field: 'shiftId', options: shifts.map(s => ({ value: s.id, label: `${s.name} (${s.startTime}–${s.endTime})` })) },
              ].map(f => (
                <div key={f.field} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <select value={form[f.field]} onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Till Float (R) *</label>
                <input type="number" value={form.float} onChange={e => setForm(x => ({ ...x, float: e.target.value }))} placeholder="0.00"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>

              {form.cashierId && (
                <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 4px', color: '#94a3b8' }}>Summary:</p>
                  <p style={{ margin: '2px 0', color: 'white' }}>👤 {selectedCashier?.name}</p>
                  <p style={{ margin: '2px 0', color: 'white' }}>🖥️ {selectedTill?.name || 'No Till'}</p>
                  <p style={{ margin: '2px 0', color: 'white' }}>🕐 {selectedShift?.name || 'No Shift'}</p>
                  <p style={{ margin: '2px 0', color: '#00C4A0' }}>💰 Float: {R(parseFloat(form.float) || 0)}</p>
                </div>
              )}

              <button onClick={() => { if (!form.cashierId || !form.float) { setErr('Select cashier and enter float'); return } setErr(''); setStep('mgr-verify') }}
                style={{ width: '100%', padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>
                Assign Cashier →
              </button>
              {err && <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0', textAlign: 'center' }}>{err}</p>}
            </>
          )}

          {step === 'mgr-verify' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Step 1 of 2</p>
                <h3 style={{ margin: '4px 0', color: '#f59e0b' }}>Manager Approval</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Assigning {selectedCashier?.name} to {selectedTill?.name || 'no till'} with {R(parseFloat(form.float) || 0)} float</p>
              </div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Manager Password</label>
              <input type="password" value={mgrPwd} onChange={e => { setMgrPwd(e.target.value); setErr('') }} autoFocus
                onKeyDown={e => e.key === 'Enter' && verifyManager()}
                style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: `1px solid ${err ? '#dc2626' : '#334155'}`, borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }} />
              {err && <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 10px' }}>{err}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setStep('form'); setErr('') }} style={{ flex: 1, padding: '11px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Back</button>
                <button onClick={verifyManager} style={{ flex: 1, padding: '11px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Verify →</button>
              </div>
            </>
          )}

          {step === 'cashier-verify' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Step 2 of 2</p>
                <h3 style={{ margin: '4px 0', color: '#00C4A0' }}>Cashier Acknowledgement</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{selectedCashier?.name}: enter your password to accept</p>
              </div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cashier Password</label>
              <input type="password" value={cashierPwd} onChange={e => { setCashierPwd(e.target.value); setErr('') }} autoFocus
                onKeyDown={e => e.key === 'Enter' && verifyCashier()}
                style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: `1px solid ${err ? '#dc2626' : '#334155'}`, borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }} />
              {err && <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 10px' }}>{err}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setStep('form'); setErr('') }} style={{ flex: 1, padding: '11px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={verifyCashier} style={{ flex: 1, padding: '11px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Accept →</button>
              </div>
            </>
          )}
        </div>

        {/* Active assignments */}
        <div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            {[['active', `Active (${activeToday.length})`], ['closed', `Closed (${closedToday.length})`]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', backgroundColor: tab === id ? '#0A6C6B' : 'transparent', color: tab === id ? 'white' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            {(tab === 'active' ? activeToday : closedToday).length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
                {tab === 'active' ? 'No active assignments today.' : 'No closed assignments today.'}
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    {['Cashier', 'Till', 'Shift', 'Float', 'Assigned', tab === 'active' ? 'Action' : 'Closed'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tab === 'active' ? activeToday : closedToday).map((a, i) => (
                    <tr key={a.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                      <td style={{ padding: '11px 14px', fontWeight: '600' }}>{a.cashierName}</td>
                      <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{a.tillName}</td>
                      <td style={{ padding: '11px 14px', color: '#64748b' }}>{a.shiftName || '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#00C4A0', fontWeight: '700' }}>{R(a.float)}</td>
                      <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '12px' }}>{fmtDateTime(a.assignedAt)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {tab === 'active' ? (
                          <button onClick={() => closeAssignment(a.id)} style={{ padding: '4px 10px', backgroundColor: '#7f1d1d33', border: '1px solid #7f1d1d', borderRadius: '6px', color: '#fca5a5', cursor: 'pointer', fontSize: '11px' }}>
                            Close
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{fmtDateTime(a.closedAt)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
