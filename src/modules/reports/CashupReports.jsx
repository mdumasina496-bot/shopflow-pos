import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, R, fmtDate, fmtDateTime, today } from '../../data'

const startOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const SUB = ['Store Cashup', 'Till Cashup Summary', 'Petty Cash']

export default function CashupReports({ user, onBack }) {
  const [active, setActive] = useState('Store Cashup')
  const [cashups, setCashups] = useState([])
  const [pettyCash, setPettyCash] = useState([])
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())

  useEffect(() => {
    setCashups(load(KEYS.CASHUP))
    setPettyCash(load(KEYS.PETTY_CASH))
  }, [])

  const filtered = cashups.filter(c => c.date >= from && c.date <= to)
  const filteredPetty = pettyCash.filter(p => p.date >= from && p.date <= to)

  const DateFilter = () => (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {[['FROM', from, setFrom], ['TO', to, setTo]].map(([label, val, setter]) => (
        <div key={label}>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>{label}</label>
          <input type="date" value={val} onChange={e => setter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none' }} />
        </div>
      ))}
    </div>
  )

  return (
    <Shell title="Cashup Reports" onBack={onBack}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {SUB.map(s => (
          <button key={s} onClick={() => setActive(s)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: active === s ? '#00C4A0' : '#1e293b', color: active === s ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <DateFilter />

      {active === 'Store Cashup' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No cashups in this period</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a' }}>
                  {['Date', 'Cashier', 'Till', 'Float', 'Cash', 'Card', 'Expected', 'Variance', 'Verified By'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{c.cashierName}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{c.tillName}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{R(c.float)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>{R(c.cashTotal)}</td>
                    <td style={{ padding: '10px 12px' }}>{R(c.cardTotal)}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{R(c.expectedCash)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: c.variance === 0 ? '#4ade80' : c.variance > 0 ? '#60a5fa' : '#dc2626' }}>
                      {c.variance > 0 ? `+${R(c.variance)}` : R(c.variance)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{c.verifiedBy}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}>
                  <td colSpan={4} style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>TOTALS</td>
                  <td style={{ padding: '10px 12px', fontWeight: '800' }}>{R(filtered.reduce((s, c) => s + c.cashTotal, 0))}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '800' }}>{R(filtered.reduce((s, c) => s + c.cardTotal, 0))}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '800' }}>{R(filtered.reduce((s, c) => s + c.expectedCash, 0))}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '800', color: filtered.reduce((s,c) => s + c.variance, 0) >= 0 ? '#4ade80' : '#dc2626' }}>
                    {R(filtered.reduce((s, c) => s + c.variance, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {active === 'Till Cashup Summary' && (
        <div>
          {(() => {
            const tillMap = {}
            filtered.forEach(c => {
              const key = c.tillName || 'Unknown'
              if (!tillMap[key]) tillMap[key] = { till: key, count: 0, cash: 0, card: 0, variance: 0 }
              tillMap[key].count++
              tillMap[key].cash += c.cashTotal
              tillMap[key].card += c.cardTotal
              tillMap[key].variance += c.variance
            })
            const tills = Object.values(tillMap)
            return (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                {tills.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No cashup data in this period</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Till', 'Cashups', 'Total Cash', 'Total Card', 'Net Variance'].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {tills.map((t, i) => (
                        <tr key={t.till} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                          <td style={{ padding: '11px 14px', fontWeight: '600' }}>{t.till}</td>
                          <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{t.count}</td>
                          <td style={{ padding: '11px 14px', fontWeight: '700' }}>{R(t.cash)}</td>
                          <td style={{ padding: '11px 14px' }}>{R(t.card)}</td>
                          <td style={{ padding: '11px 14px', fontWeight: '700', color: t.variance === 0 ? '#4ade80' : t.variance > 0 ? '#60a5fa' : '#dc2626' }}>
                            {t.variance > 0 ? '+' : ''}{R(t.variance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {active === 'Petty Cash' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Petty cash entries are recorded during Store Cashup</p>
            <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '15px' }}>
              Total petty cash: {R(filtered.reduce((s, c) => s + (c.pettyCash || 0), 0))}
            </span>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Date', 'Cashier', 'Till', 'Petty Cash', 'Notes', 'Verified By'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.filter(c => c.pettyCash > 0).length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No petty cash entries in this period</td></tr>
                ) : filtered.filter(c => c.pettyCash > 0).map((c, i) => (
                  <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{c.cashierName}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.tillName}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#f59e0b' }}>{R(c.pettyCash)}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.notes || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{c.verifiedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  )
}
