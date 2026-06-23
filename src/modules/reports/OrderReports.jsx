import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, R, fmtDate, fmtDateTime, today } from '../../data'

const startOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

const SUB = ['Daily Sales', 'Hourly Sales', 'Monthly Sales', 'Invoices', 'Discounts', 'Voids / Overrings', 'Payment Breakdown', '⭐ Best Sellers', '📦 Restock Suggestions']

export default function OrderReports({ user, onBack }) {
  const [active, setActive] = useState('Daily Sales')
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)
  const [sales, setSales] = useState([])
  const [voids, setVoids] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    setSales(load(KEYS.SALES))
    setVoids(load(KEYS.VOIDS))
    setProducts(load(KEYS.PRODUCTS))
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

  // Best sellers — aggregate all line items across filtered sales
  const itemMap = {}
  filtered.forEach(s => {
    ;[...(s.items || []), ...(s.extras || [])].filter(i => !i.voided).forEach(item => {
      const key = item.name
      if (!itemMap[key]) itemMap[key] = { name: key, qtySold: 0, revenue: 0, transactions: 0, store: s.store }
      itemMap[key].qtySold += item.qty || 0
      itemMap[key].revenue += item.total || 0
      itemMap[key].transactions++
    })
  })
  const bestSellers = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue)
  const maxBS = bestSellers[0]?.revenue || 1

  // Restock suggestions — cross-reference best sellers with current stock
  const restockSuggestions = bestSellers.map(bs => {
    const prod = products.find(p => p.name === bs.name && p.active)
    if (!prod) return null
    const daysInPeriod = Math.max(1, (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24))
    const dailyVelocity = bs.qtySold / daysInPeriod
    const daysOfStock = dailyVelocity > 0 ? prod.stock / dailyVelocity : 999
    const urgency = daysOfStock < 3 ? 'critical' : daysOfStock < 7 ? 'low' : daysOfStock < 14 ? 'medium' : 'ok'
    return { ...bs, prod, dailyVelocity, daysOfStock, urgency, currentStock: prod.stock, minStock: prod.minStock }
  }).filter(Boolean).sort((a, b) => a.daysOfStock - b.daysOfStock)

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

      {active === '⭐ Best Sellers' && (
        <div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#64748b' }}>
            Showing top items sold in the selected period, ranked by revenue. Use date filter above to adjust the period.
          </div>
          {bestSellers.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>No sales data for this period</p>
          ) : (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    {['#', 'Product', 'Qty Sold', 'Transactions', 'Revenue', 'Share'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((item, i) => (
                    <tr key={item.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: i === 0 ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '800', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#475569', fontSize: i < 3 ? '15px' : '13px' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>
                        {item.name}
                        <div style={{ height: '4px', backgroundColor: '#0f172a', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(item.revenue / maxBS) * 100}%`, backgroundColor: i === 0 ? '#f59e0b' : '#00C4A0', borderRadius: '2px' }} />
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{item.qtySold.toFixed(1)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.transactions}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(item.revenue)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>{totalRevenue > 0 ? `${((item.revenue / totalRevenue) * 100).toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#0f172a33', borderTop: '2px solid #334155' }}>
                    <td colSpan={4} style={{ padding: '10px 14px', fontWeight: '700', fontSize: '12px', color: '#94a3b8' }}>TOTAL ({bestSellers.length} products)</td>
                    <td style={{ padding: '10px 14px', fontWeight: '800', color: '#00C4A0' }}>{R(totalRevenue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {active === '📦 Restock Suggestions' && (
        <div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#64748b' }}>
            Based on your best sellers vs current stock levels. Products are ranked by how many days of stock remain at the current sales velocity.
          </div>

          {restockSuggestions.filter(s => s.urgency !== 'ok').length === 0 && (
            <div style={{ backgroundColor: 'rgba(22,163,74,0.1)', border: '1px solid #16a34a', borderRadius: '10px', padding: '14px 18px', marginBottom: '14px', fontSize: '13px', color: '#4ade80' }}>
              ✅ All popular products have sufficient stock for 14+ days at current sales velocity.
            </div>
          )}

          {restockSuggestions.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '60px 0' }}>No sales data to generate suggestions. Run some sales first.</p>
          ) : (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    {['Urgency', 'Product', 'Current Stock', 'Daily Sales', 'Days Left', 'Revenue (period)', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {restockSuggestions.map((item, i) => {
                    const urgencyStyle = {
                      critical: { bg: '#dc262633', color: '#fca5a5', label: '🔴 Critical' },
                      low:      { bg: '#f59e0b22', color: '#fcd34d', label: '🟡 Low' },
                      medium:   { bg: '#0e749022', color: '#67e8f9', label: '🔵 Medium' },
                      ok:       { bg: '#16a34a22', color: '#4ade80', label: '🟢 OK' },
                    }[item.urgency]
                    return (
                      <tr key={item.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: item.urgency === 'critical' ? 'rgba(220,38,38,0.04)' : 'transparent' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: urgencyStyle.bg, color: urgencyStyle.color, fontSize: '11px', fontWeight: '700' }}>
                            {urgencyStyle.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.name}</td>
                        <td style={{ padding: '10px 14px', color: item.currentStock <= item.minStock ? '#dc2626' : '#94a3b8', fontWeight: item.currentStock <= item.minStock ? '700' : '400' }}>
                          {item.currentStock.toFixed(1)} {item.prod?.unit}
                          {item.currentStock <= item.minStock && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#dc2626' }}>⚠️ BELOW MIN</span>}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.dailyVelocity.toFixed(2)}/day</td>
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: item.daysOfStock < 3 ? '#dc2626' : item.daysOfStock < 7 ? '#f59e0b' : '#4ade80' }}>
                          {item.daysOfStock > 99 ? '99+' : item.daysOfStock.toFixed(1)} days
                        </td>
                        <td style={{ padding: '10px 14px', color: '#00C4A0' }}>{R(item.revenue)}</td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', color: '#94a3b8' }}>
                          {item.urgency === 'critical' ? '🚨 Order immediately' : item.urgency === 'low' ? '⚡ Order this week' : item.urgency === 'medium' ? '📋 Plan reorder' : '✅ Sufficient'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: '12px 14px', backgroundColor: '#0f172a33', borderTop: '1px solid #334155', fontSize: '12px', color: '#64748b' }}>
                💡 Tip: Products marked 🔴 Critical have less than 3 days of stock remaining. Order urgently.
              </div>
            </div>
          )}
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
