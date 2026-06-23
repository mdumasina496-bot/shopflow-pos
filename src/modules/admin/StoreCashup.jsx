import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, fmtDateTime, today, logActivity } from '../../data'

const NOTES = [200, 100, 50, 20, 10]
const COINS = [5, 2, 1, 0.50, 0.20, 0.10, 0.05]
const DENOM = [...NOTES, ...COINS]

function denomTotal(denoms) {
  return DENOM.reduce((s, d) => s + (parseFloat(denoms[d] || 0) || 0) * d, 0)
}

function DenomGrid({ denoms, onChange, readOnly }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      {DENOM.map(d => (
        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', borderRadius: '7px', padding: '7px 10px' }}>
          <span style={{ minWidth: '52px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>R{d}</span>
          {readOnly ? (
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{denoms[d] || 0}</span>
          ) : (
            <input type="number" min="0" value={denoms[d] || ''} onChange={e => onChange(d, e.target.value)} placeholder="0"
              style={{ flex: 1, padding: '5px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '14px', outline: 'none' }} />
          )}
          <span style={{ fontSize: '11px', color: '#64748b', minWidth: '55px', textAlign: 'right' }}>
            = {R((parseFloat(denoms[d] || 0) || 0) * d)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function StoreCashup({ user, onBack }) {
  const [cashups, setCashups] = useState([])
  const [assignments, setAssignments] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)

  // form state
  const [assignmentId, setAssignmentId] = useState('')
  const [denoms, setDenoms] = useState({})
  const [cardTotal, setCardTotal] = useState('')
  const [pettyCash, setPettyCash] = useState('')
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState('blind') // blind | verify | done
  const [mgrPwd, setMgrPwd] = useState('')
  const [mgrErr, setMgrErr] = useState('')

  useEffect(() => {
    setCashups(load(KEYS.CASHUP))
    const todayStr = today()
    setAssignments(load(KEYS.ASSIGNMENTS).filter(a => a.date === todayStr))
  }, [])

  const updateDenom = (d, val) => setDenoms(prev => ({ ...prev, [d]: val }))
  const cashTotal = denomTotal(denoms)
  const selectedAssignment = assignments.find(a => a.id === assignmentId)

  const getSalesForAssignment = (aId) => {
    const a = assignments.find(x => x.id === aId)
    if (!a) return { total: 0, cash: 0, card: 0, count: 0 }
    const sales = load(KEYS.SALES).filter(s => s.cashierId === a.cashierId && s.date?.startsWith(today()))
    return {
      total: sales.reduce((s, x) => s + x.total, 0),
      cash: sales.filter(s => s.paymentMethod === 'cash').reduce((s, x) => s + x.total, 0),
      card: sales.filter(s => s.paymentMethod === 'card').reduce((s, x) => s + x.total, 0),
      count: sales.length,
    }
  }

  const getAbandonedForCashier = (cashierId) => {
    return load(KEYS.ABANDONED, []).filter(a => a.cashierId === cashierId && a.date?.startsWith(today()))
  }

  const submitBlind = () => {
    if (!assignmentId) { alert('Select a cashier/till assignment'); return }
    const assignment = assignments.find(a => a.id === assignmentId)
    if (assignment) {
      const openAbandoned = getAbandonedForCashier(assignment.cashierId)
      if (openAbandoned.length > 0) {
        const totalUnpaid = openAbandoned.reduce((s, a) => s + a.total, 0)
        const confirmed = window.confirm(
          `⚠️ UNPAID ORDERS DETECTED\n\n` +
          `${openAbandoned.length} abandoned order(s) totalling ${R(totalUnpaid)} were found for ${assignment.cashierName} today.\n\n` +
          `These are orders that were started but never completed.\n\n` +
          `A manager MUST investigate and account for these before cashup.\n\n` +
          `Click OK to acknowledge and proceed to cashup, or Cancel to review abandoned orders first.`
        )
        if (!confirmed) return
      }
    }
    setStep('verify')
  }

  const verifyAndSubmit = () => {
    const allUsers = load(KEYS.USERS)
    const mgr = allUsers.find(u => u.password === mgrPwd && (u.role === 'manager' || u.role === 'owner') && u.active !== false)
    if (!mgr) { setMgrErr('Incorrect manager password'); setMgrPwd(''); return }

    const salesInfo = getSalesForAssignment(assignmentId)
    const expectedCash = salesInfo.cash + (selectedAssignment?.float || 0) - (parseFloat(pettyCash) || 0)
    const variance = cashTotal - expectedCash

    const entry = {
      id: genId(),
      date: today(),
      assignmentId,
      cashierName: selectedAssignment?.cashierName,
      tillName: selectedAssignment?.tillName,
      float: selectedAssignment?.float || 0,
      denominations: { ...denoms },
      cashTotal,
      cardTotal: parseFloat(cardTotal) || 0,
      pettyCash: parseFloat(pettyCash) || 0,
      salesCash: salesInfo.cash,
      salesCard: salesInfo.card,
      salesTotal: salesInfo.total,
      salesCount: salesInfo.count,
      expectedCash,
      variance,
      notes,
      verifiedBy: mgr.name,
      createdAt: new Date().toISOString(),
    }

    const all = load(KEYS.CASHUP)
    save(KEYS.CASHUP, [...all, entry])
    setCashups([...all, entry])
    logActivity(user, 'CASHUP', { cashier: entry.cashierName, till: entry.tillName, variance: entry.variance, verifiedBy: entry.verifiedBy })
    setStep('done')
    setSelected(entry)
  }

  if (view === 'detail' && selected) {
    const v = selected.variance
    return (
      <Shell title="Cashup Details" subtitle={`${selected.cashierName} — ${fmtDate(selected.date)}`} onBack={() => { setSelected(null); setView('list') }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Summary</h3>
              {[
                ['Cashier', selected.cashierName],
                ['Till', selected.tillName],
                ['Float', R(selected.float)],
                ['Sales (cash)', R(selected.salesCash)],
                ['Sales (card)', R(selected.salesCard)],
                ['Total Sales', R(selected.salesTotal)],
                ['Petty Cash', R(selected.pettyCash)],
                ['Expected Cash', R(selected.expectedCash)],
                ['Actual Cash', R(selected.cashTotal)],
                ['Card Declared', R(selected.cardTotal)],
                ['Verified By', selected.verifiedBy],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f172a', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <strong>{val}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: '800' }}>
                <span style={{ color: '#94a3b8' }}>Variance</span>
                <span style={{ color: v === 0 ? '#4ade80' : v > 0 ? '#60a5fa' : '#dc2626' }}>
                  {v > 0 ? `+${R(v)}` : R(v)}
                </span>
              </div>
              {selected.notes && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>Notes: {selected.notes}</p>}
            </div>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Denominations</h3>
            <DenomGrid denoms={selected.denominations} onChange={() => {}} readOnly />
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Store Cashup" subtitle="Blind cashup & reconciliation" onBack={onBack} actions={
      view === 'list' && <button onClick={() => { setView('new'); setStep('blind'); setDenoms({}); setCardTotal(''); setPettyCash(''); setNotes(''); setAssignmentId('') }} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + New Cashup
      </button>
    }>
      {view === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                {step === 'blind' ? '🙈 Blind Count' : step === 'verify' ? '🔑 Manager Verify' : '✅ Complete'}
              </h3>

              {step === 'blind' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Select Cashier / Assignment *</label>
                    <select value={assignmentId} onChange={e => setAssignmentId(e.target.value)}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                      <option value="">Select...</option>
                      {assignments.map(a => <option key={a.id} value={a.id}>{a.cashierName} — {a.tillName}</option>)}
                    </select>
                  </div>
                  {selectedAssignment && <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b' }}>Float: {R(selectedAssignment.float)}</p>}
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Card Total (R)</label>
                    <input type="number" value={cardTotal} onChange={e => setCardTotal(e.target.value)} placeholder="0.00"
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Petty Cash Used (R)</label>
                    <input type="number" value={pettyCash} onChange={e => setPettyCash(e.target.value)} placeholder="0.00"
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notes</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional..."
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Cash Total</span>
                    <span style={{ fontWeight: '800', color: '#00C4A0', fontSize: '18px' }}>{R(cashTotal)}</span>
                  </div>
                  <button onClick={submitBlind} style={{ width: '100%', padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>
                    Submit for Verification →
                  </button>
                </>
              )}

              {step === 'verify' && (
                <>
                  <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}><span style={{ color: '#94a3b8' }}>Cashier counted (cash)</span><strong style={{ color: '#00C4A0' }}>{R(cashTotal)}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#94a3b8' }}>Card declared</span><strong>{R(parseFloat(cardTotal) || 0)}</strong></div>
                  </div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Manager Password</label>
                  <input type="password" value={mgrPwd} onChange={e => { setMgrPwd(e.target.value); setMgrErr('') }} autoFocus
                    onKeyDown={e => e.key === 'Enter' && verifyAndSubmit()}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: `1px solid ${mgrErr ? '#dc2626' : '#334155'}`, borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }} />
                  {mgrErr && <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 10px' }}>{mgrErr}</p>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setStep('blind')} style={{ flex: 1, padding: '11px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Back</button>
                    <button onClick={verifyAndSubmit} style={{ flex: 1, padding: '11px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Verify & Save</button>
                  </div>
                </>
              )}

              {step === 'done' && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', margin: '0 0 10px' }}>✅</p>
                  <p style={{ color: '#4ade80', fontWeight: '700', margin: '0 0 6px', fontSize: '16px' }}>Cashup Complete</p>
                  {selected && <p style={{ color: selected.variance === 0 ? '#4ade80' : selected.variance > 0 ? '#60a5fa' : '#dc2626', fontWeight: '700', fontSize: '18px', margin: '0 0 20px' }}>
                    Variance: {selected.variance > 0 ? '+' : ''}{R(selected.variance)}
                  </p>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setView('list'); setStep('blind') }} style={{ flex: 1, padding: '11px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>History</button>
                    <button onClick={() => { setStep('blind'); setDenoms({}); setCardTotal(''); setAssignmentId(''); setSelected(null) }} style={{ flex: 1, padding: '11px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>New</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Count Denominations</h3>
            <DenomGrid denoms={denoms} onChange={updateDenom} readOnly={step !== 'blind'} />
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px' }}>
              <span style={{ color: '#94a3b8' }}>Total Cash</span>
              <span style={{ color: '#00C4A0' }}>{R(cashTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {view === 'list' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {cashups.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No cashups recorded yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a' }}>
                  {['Date', 'Cashier', 'Till', 'Cash', 'Card', 'Expected', 'Variance', 'Verified By', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...cashups].reverse().map((c, i) => (
                  <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: '11px 14px', fontWeight: '600' }}>{c.cashierName}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{c.tillName}</td>
                    <td style={{ padding: '11px 14px' }}>{R(c.cashTotal)}</td>
                    <td style={{ padding: '11px 14px' }}>{R(c.cardTotal)}</td>
                    <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{R(c.expectedCash)}</td>
                    <td style={{ padding: '11px 14px', fontWeight: '700', color: c.variance === 0 ? '#4ade80' : c.variance > 0 ? '#60a5fa' : '#dc2626' }}>
                      {c.variance > 0 ? `+${R(c.variance)}` : R(c.variance)}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{c.verifiedBy}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => { setSelected(c); setView('detail') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Shell>
  )
}
