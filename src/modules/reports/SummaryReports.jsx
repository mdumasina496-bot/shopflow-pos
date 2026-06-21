import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, R, fmtDate, fmtDateTime, today } from '../../data'

const startOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const SUB = ['Activity', 'Suppliers', 'Customers', 'Attendance']

export default function SummaryReports({ user, onBack }) {
  const [active, setActive] = useState('Activity')
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)
  const [sales, setSales] = useState([])
  const [grvs, setGrvs] = useState([])
  const [wastage, setWastage] = useState([])
  const [customers, setCustomers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    setSales(load(KEYS.SALES))
    setGrvs(load(KEYS.GRV))
    setWastage(load(KEYS.WASTAGE))
    setCustomers(load(KEYS.CUSTOMERS))
    setAttendance(load(KEYS.ATTENDANCE))
    setUsers(load(KEYS.USERS))
  }, [])

  const inRange = (date) => date && date.slice(0,10) >= from && date.slice(0,10) <= to
  const inStore = (s) => storeFilter === 'all' || s.store === storeFilter

  const DateFilter = () => (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {[['FROM', from, setFrom], ['TO', to, setTo]].map(([label, val, setter]) => (
        <div key={label}>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>{label}</label>
          <input type="date" value={val} onChange={e => setter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none' }} />
        </div>
      ))}
      {user.store === 'both' && (
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>STORE</label>
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px' }}>
            <option value="all">All Stores</option>
            <option value="butchery">Butchery</option>
            <option value="bottle">Bottle Store</option>
          </select>
        </div>
      )}
    </div>
  )

  const filteredSales = sales.filter(s => inRange(s.date) && inStore(s))
  const filteredGrvs = grvs.filter(g => inRange(g.date) && inStore(g))
  const filteredWastage = wastage.filter(w => inRange(w.date) && inStore(w))

  return (
    <Shell title="Summary Reports" onBack={onBack}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {SUB.map(s => (
          <button key={s} onClick={() => setActive(s)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: active === s ? '#00C4A0' : '#1e293b', color: active === s ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <DateFilter />

      {active === 'Activity' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {[
              ['Sales', filteredSales.length, '#818cf8'],
              ['Revenue', R(filteredSales.reduce((s, x) => s + x.total, 0)), '#00C4A0'],
              ['GRVs', filteredGrvs.length, '#60a5fa'],
              ['Purchases', R(filteredGrvs.reduce((s, g) => s + g.totalCost, 0)), '#a78bfa'],
              ['Wastage', R(filteredWastage.reduce((s, w) => s + w.totalCost, 0)), '#dc2626'],
            ].map(([l, v, c]) => (
              <div key={l} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '13px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 3px', fontWeight: '800', color: c, fontSize: '17px' }}>{v}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{l}</p>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #0f172a' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Activity Timeline</h3>
            </div>
            {filteredSales.length === 0 && filteredGrvs.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No activity in this period</p>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {[
                  ...filteredSales.map(s => ({ type: 'sale', date: s.date, label: `Sale #${s.orderNumber}`, detail: `${s.cashier} — ${R(s.total)}`, color: '#00C4A0' })),
                  ...filteredGrvs.map(g => ({ type: 'grv', date: g.createdAt || g.date, label: `GRV: ${g.grvNumber}`, detail: `${g.supplier} — ${R(g.totalCost)}`, color: '#60a5fa' })),
                  ...filteredWastage.map(w => ({ type: 'wastage', date: w.createdAt || w.date, label: `Wastage: ${w.productName}`, detail: `${w.qty} ${w.unit} — ${R(w.totalCost)}`, color: '#dc2626' })),
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.detail}</p>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDateTime(item.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {active === 'Suppliers' && (
        <div>
          {(() => {
            const supplierMap = {}
            filteredGrvs.forEach(g => {
              if (!supplierMap[g.supplier]) supplierMap[g.supplier] = { name: g.supplier, orders: 0, total: 0, lastOrder: g.date }
              supplierMap[g.supplier].orders++
              supplierMap[g.supplier].total += g.totalCost
              if (g.date > supplierMap[g.supplier].lastOrder) supplierMap[g.supplier].lastOrder = g.date
            })
            const suppliers = Object.values(supplierMap).sort((a, b) => b.total - a.total)
            return (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                {suppliers.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No supplier activity in this period</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Supplier','Orders','Total Spend','Last Order'].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {suppliers.map((s, i) => (
                        <tr key={s.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                          <td style={{ padding: '11px 14px', fontWeight: '600' }}>{s.name}</td>
                          <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{s.orders}</td>
                          <td style={{ padding: '11px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(s.total)}</td>
                          <td style={{ padding: '11px 14px', color: '#64748b' }}>{fmtDate(s.lastOrder)}</td>
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

      {active === 'Customers' && (
        <div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            {customers.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No customers registered yet. Add customers in Admin Menu → Customers.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Name','Phone','Email','Orders','Member Since'].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {customers.map((c, i) => {
                    const cOrders = sales.filter(s => s.customerName === c.name)
                    return (
                      <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontWeight: '600' }}>{c.name}</td>
                        <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{c.phone || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>{c.email || '—'}</td>
                        <td style={{ padding: '11px 14px', color: '#00C4A0', fontWeight: '700' }}>{cOrders.length}</td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>{fmtDate(c.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {active === 'Attendance' && (
        <div>
          {(() => {
            const dateAttendance = attendance.filter(a => a.date >= from && a.date <= to)
            const userMap = {}
            users.forEach(u => { userMap[u.id] = { name: u.name, role: u.role, days: new Set(), totalHours: 0, clockIns: 0 } })
            dateAttendance.forEach(a => {
              if (!userMap[a.userId]) return
              if (a.type === 'in') { userMap[a.userId].clockIns++; userMap[a.userId].days.add(a.date) }
            })
            const summary = Object.values(userMap).filter(u => u.clockIns > 0)
            return (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                {summary.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No attendance records in this period</p> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Staff','Role','Days Present','Clock-ins'].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {summary.map((s, i) => (
                        <tr key={s.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                          <td style={{ padding: '11px 14px', fontWeight: '600' }}>{s.name}</td>
                          <td style={{ padding: '11px 14px', textTransform: 'capitalize', color: '#64748b' }}>{s.role}</td>
                          <td style={{ padding: '11px 14px', fontWeight: '700', color: '#00C4A0' }}>{s.days.size}</td>
                          <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{s.clockIns}</td>
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
    </Shell>
  )
}
