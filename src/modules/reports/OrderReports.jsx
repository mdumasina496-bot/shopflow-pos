import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, R, fmtDate, fmtDateTime, today } from '../../data'

const startOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

const SUB = ['Daily Sales', 'Hourly Sales', 'Monthly Sales', 'Invoices', 'Discounts', 'Voids / Overrings', 'Payment Breakdown']

export default function OrderReports({ user, onBack }) {
  const [active, setActive] = useState('Daily Sales')
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)
  const [sales, setSales] = useState([])
  const [voids, setVoids] = useState([])

  useEffect(() => {
    setSales(load(KEYS.SALES))
    setVoids(load(KEYS.VOIDS))
  }, [])

  const filtered = sales.filter(s => {
    const d = s.date?.slice(0, 10)
    return d >= from && d <= to && (storeFilter === 'all' || s.store === storeFilter)
  })

  const showStore = user.store === 'both'

  const DateFilter = () => (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {[['FROM', from, setFrom], ['TO', to, setTo]].map(([label, val, setter]) => (
        <div key={label}>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>{label}</label>
          <input type="date" value={val} onChange={e => setter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none' }} />
        </div>
      ))}
      {showStore && (
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>STORE</label>
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px' }}>
            <option value="all">All Stores</option>
            <option value="butchery">Butchery</option>
            <option value="bottle">Bottle Store</option>
          </select>
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[['Today', today(), today()], ['Week', (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0,10) })(), today()], ['Month', startOfMonth(), today()]].map(([l, f, t]) => (
          <button key={l} onClick={() => { setFrom(f); setTo(t) }} style={{ padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>{l}</button>
        ))}
      </div>
    </div>
  )

  const totalRevenue = filtered.reduce((s, x) => s + x.total, 0)
  const totalDiscount = filtered.reduce((s, x) => s + (x.discountAmt || 0), 0)

  // Daily Sales
  const dayMap = {}
  filtered.forEach(s => {
    const d = s.date.slice(0, 10)
    if (!dayMap[d]) dayMap[d] = { date: d, sales: 0, revenue: 0, cash: 0, card: 0 }
    dayMap[d].sales++
    dayMap[d].revenue += s.total
    if (s.paymentMethod === 'cash') dayMap[d].cash += s.total
    else dayMap[d].card += s.total
  })
  const byDay = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))
  const maxRev = byDay.length ? Math.max(...byDay.map(d => d.revenue)) : 1

  // Hourly
  const hourMap = {}
  filtered.forEach(s => {
    const h = new Date(s.date).getHours()
    const label = `${String(h).padStart(2,'0')}:00`
    if (!hourMap[label]) hourMap[label] = { hour: label, sales: 0, revenue: 0 }
    hourMap[label].sales++
    hourMap[label].revenue += s.total
  })
  const byHour = Object.values(hourMap).sort((a, b) => a.hour.localeCompare(b.hour))
  const maxHour = byHour.length ? Math.max(...byHour.map(h => h.revenue)) : 1

  // Monthly
  const monthMap = {}
  sales.forEach(s => {
    const m = s.date?.slice(0, 7)
    if (!m) return
    if (storeFilter !== 'all' && s.store !== storeFilter) return
    if (!monthMap[m]) monthMap[m] = { month: m, sales: 0, revenue: 0 }
    monthMap[m].sales++
    monthMap[m].revenue += s.total
  })
  const byMonth = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))

  // Discounts
  const discounted = filtered.filter(s => s.discountAmt > 0)
  // Voids
  const filteredVoids = voids.filter(v => v.date?.slice(0,10) >= from && v.date?.slice(0,10) <= to)

  return (
    <Shell title="Order Reports" onBack={onBack}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {SUB.map(s => (
          <button key={s} onClick={() => setActive(s)} style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: active === s ? '#00C4A0' : '#1e293b', color: active === s ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <DateFilter />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[['Revenue', R(totalRevenue), '#00C4A0'], ['Transactions', filtered.length, '#818cf8'], ['Avg Sale', R(filtered.length ? totalRevenue / filtered.length : 0), '#34d399'], ['Discounts', R(totalDiscount), '#f59e0b']].map(([l, v, c]) => (
          <div key={l} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '13px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 3px', fontWeight: '800', color: c, fontSize: '17px' }}>{v}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{l}</p>
          </div>
        ))}
      </div>

      {active === 'Daily Sales' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Daily Revenue</h3>
          {byDay.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: '30px 0' }}>No sales in this period</p> : (
            byDay.map(day => (
              <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', minWidth: '85px' }}>{fmtDate(day.date)}</span>
                <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(day.revenue / maxRev) * 100}%`, backgroundColor: '#00C4A0', borderRadius: '4px', minWidth: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#00C4A0', minWidth: '80px', textAlign: 'right' }}>{R(day.revenue)}</span>
                <span style={{ fontSize: '11px', color: '#64748b', minWidth: '55px' }}>{day.sales} sale{day.sales !== 1 ? 's' : ''}</span>
              </div>
            ))
          )}
        </div>
      )}

      {active === 'Hourly Sales' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Sales by Hour</h3>
          {byHour.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', padding: '30px 0' }}>No data</p> : (
            byHour.map(h => (
              <div key={h.hour} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', minWidth: '50px', fontFamily: 'monospace' }}>{h.hour}</span>
                <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(h.revenue / maxHour) * 100}%`, backgroundColor: '#818cf8', borderRadius: '4px', minWidth: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', minWidth: '80px', textAlign: 'right' }}>{R(h.revenue)}</span>
                <span style={{ fontSize: '11px', color: '#64748b', minWidth: '55px' }}>{h.sales}</span>
              </div>
            ))
          )}
        </div>
      )}

      {active === 'Monthly Sales' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Month','Transactions','Revenue'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {byMonth.length === 0 ? <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No data</td></tr>
              : byMonth.map((m, i) => (
                <tr key={m.month} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{m.month}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{m.sales}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'Invoices' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Order #','Date','Cashier','Store','Type','Customer','Items','Total','Payment'].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No invoices in this period</td></tr>
              : [...filtered].reverse().map((s, i) => (
                <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#00C4A0', fontSize: '11px' }}>{s.orderNumber}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8', fontSize: '11px' }}>{fmtDateTime(s.date)}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{s.cashier}</td>
                  <td style={{ padding: '9px 12px', textTransform: 'capitalize', color: '#64748b' }}>{s.store}</td>
                  <td style={{ padding: '9px 12px', textTransform: 'capitalize', color: '#94a3b8' }}>{s.orderType || 'takeaway'}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{s.customerName || '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{(s.items?.length || 0) + (s.extras?.length || 0)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: '#00C4A0' }}>{R(s.total)}</td>
                  <td style={{ padding: '9px 12px' }}><span style={{ padding: '1px 7px', borderRadius: '20px', backgroundColor: s.paymentMethod === 'cash' ? '#14532d33' : '#1e3a8a33', color: s.paymentMethod === 'cash' ? '#4ade80' : '#60a5fa', fontSize: '10px' }}>{s.paymentMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'Discounts' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', backgroundColor: '#78350f22', borderBottom: '1px solid #92400e' }}>
            <p style={{ margin: 0, color: '#fcd34d', fontSize: '13px', fontWeight: '700' }}>
              Total discounted: {discounted.length} sales | Total discount given: {R(totalDiscount)}
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Order #','Date','Cashier','Subtotal','Discount %','Discount (R)','Total'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {discounted.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No discounts in this period</td></tr>
              : discounted.map((s, i) => (
                <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#00C4A0', fontSize: '11px' }}>{s.orderNumber}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{fmtDateTime(s.date)}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{s.cashier}</td>
                  <td style={{ padding: '10px 12px' }}>{R(s.subtotal)}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: '700' }}>{s.discountPct}%</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: '700' }}>{R(s.discountAmt)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#00C4A0' }}>{R(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'Voids / Overrings' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Date','Item','Amount','Cashier','Approved By'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredVoids.length === 0 ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No voids in this period</td></tr>
              : filteredVoids.map((v, i) => (
                <tr key={v.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{fmtDateTime(v.date)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{v.itemName}</td>
                  <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: '700' }}>{R(v.itemTotal)}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{v.cashier}</td>
                  <td style={{ padding: '10px 14px', color: '#f59e0b' }}>{v.approvedBy}</td>
                </tr>
              ))}
            </tbody>
            {filteredVoids.length > 0 && <tfoot><tr style={{ backgroundColor: '#7f1d1d22', borderTop: '2px solid #7f1d1d' }}><td colSpan={2} style={{ padding: '10px 14px', fontWeight: '800', color: '#fca5a5' }}>TOTAL VOIDED</td><td style={{ padding: '10px 14px', fontWeight: '800', color: '#dc2626' }}>{R(filteredVoids.reduce((s, v) => s + v.itemTotal, 0))}</td><td /><td /></tr></tfoot>}
          </table>
        </div>
      )}

      {active === 'Payment Breakdown' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { method: 'cash', label: '💵 Cash', color: '#4ade80' },
              { method: 'card', label: '💳 Card', color: '#60a5fa' },
              { method: 'split', label: '✂️ Split', color: '#f59e0b' },
            ].map(m => {
              const methodSales = filtered.filter(s => s.paymentMethod === m.method)
              return (
                <div key={m.method} style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '22px' }}>{m.label}</p>
                  <p style={{ margin: '0 0 4px', fontWeight: '800', color: m.color, fontSize: '22px' }}>{R(methodSales.reduce((s, x) => s + x.total, 0))}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{methodSales.length} transactions</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Shell>
  )
}
