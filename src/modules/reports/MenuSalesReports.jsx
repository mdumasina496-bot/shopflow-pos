import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, R, fmtDate, today } from '../../data'

const startOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const SUB = ['Menu Sales', 'Menu Items Sold', 'Extras Sold', 'Discounted Extras']

export default function MenuSalesReports({ user, onBack }) {
  const [active, setActive] = useState('Menu Sales')
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())
  const [sales, setSales] = useState([])

  useEffect(() => { setSales(load(KEYS.SALES)) }, [])

  const filtered = sales.filter(s => s.date?.slice(0,10) >= from && s.date?.slice(0,10) <= to && s.store === 'butchery')

  const allItems = filtered.flatMap(s => s.items || [])
  const allExtras = filtered.flatMap(s => s.extras || []).filter(e => !e.voided)

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

  const itemMap = {}
  allItems.filter(i => !i.voided).forEach(i => {
    if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0, count: 0 }
    itemMap[i.name].qty += i.qty
    itemMap[i.name].revenue += i.total
    itemMap[i.name].count++
  })
  const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue)

  const extraMap = {}
  allExtras.forEach(e => {
    if (!extraMap[e.name]) extraMap[e.name] = { name: e.name, qty: 0, revenue: 0, count: 0 }
    extraMap[e.name].qty += e.qty
    extraMap[e.name].revenue += e.total
    extraMap[e.name].count++
  })
  const topExtras = Object.values(extraMap).sort((a, b) => b.revenue - a.revenue)

  const discountedSales = filtered.filter(s => s.discountAmt > 0)
  const discountedExtras = discountedSales.flatMap(s => (s.extras || []).filter(e => !e.voided).map(e => ({ ...e, discountPct: s.discountPct, orderNumber: s.orderNumber, cashier: s.cashier, date: s.date })))

  const totalItemRevenue = allItems.filter(i => !i.voided).reduce((s, i) => s + i.total, 0)
  const totalExtraRevenue = allExtras.reduce((s, e) => s + e.total, 0)

  return (
    <Shell title="Menu Sales Reports" subtitle="Butchery only" onBack={onBack}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {SUB.map(s => (
          <button key={s} onClick={() => setActive(s)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: active === s ? '#b91c1c' : '#1e293b', color: active === s ? 'white' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <DateFilter />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {[['Sales', filtered.length, '#818cf8'], ['Menu Revenue', R(totalItemRevenue), '#00C4A0'], ['Extras Revenue', R(totalExtraRevenue), '#f59e0b'], ['Total', R(totalItemRevenue + totalExtraRevenue), '#4ade80']].map(([l, v, c]) => (
          <div key={l} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '13px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 3px', fontWeight: '800', color: c, fontSize: '17px' }}>{v}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{l}</p>
          </div>
        ))}
      </div>

      {active === 'Menu Sales' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Date','Order #','Order Type','Customer','Items','Extras','Total'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No butchery sales in this period</td></tr>
              : [...filtered].reverse().map((s, i) => (
                <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{fmtDate(s.date)}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#00C4A0', fontSize: '11px' }}>{s.orderNumber}</td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: s.orderType === 'braai' ? '#f59e0b' : '#94a3b8' }}>{s.orderType || 'takeaway'}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{s.customerName || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{s.items?.length || 0}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b' }}>{s.extras?.length || 0}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#00C4A0' }}>{R(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === 'Menu Items Sold' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['#','Item','Qty Sold','Transactions','Revenue'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {topItems.length === 0 ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No items sold in this period</td></tr>
              : topItems.map((item, i) => (
                <tr key={item.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 14px', color: i < 3 ? '#f59e0b' : '#64748b', fontWeight: '700' }}>#{i+1}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{item.qty.toFixed(2)}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.count}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
            {topItems.length > 0 && <tfoot><tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}><td colSpan={4} style={{ padding: '10px 14px', fontWeight: '800', color: '#00C4A0' }}>TOTAL</td><td style={{ padding: '10px 14px', fontWeight: '800', color: '#00C4A0' }}>{R(totalItemRevenue)}</td></tr></tfoot>}
          </table>
        </div>
      )}

      {active === 'Extras Sold' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['#','Extra Item','Qty','Transactions','Revenue'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {topExtras.length === 0 ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No extras sold in this period</td></tr>
              : topExtras.map((e, i) => (
                <tr key={e.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 14px', color: '#f59e0b', fontWeight: '700' }}>#{i+1}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{e.name}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{e.qty}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{e.count}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#f59e0b' }}>{R(e.revenue)}</td>
                </tr>
              ))}
            </tbody>
            {topExtras.length > 0 && <tfoot><tr style={{ backgroundColor: '#78350f22', borderTop: '2px solid #92400e' }}><td colSpan={4} style={{ padding: '10px 14px', fontWeight: '800', color: '#fcd34d' }}>TOTAL EXTRAS</td><td style={{ padding: '10px 14px', fontWeight: '800', color: '#f59e0b' }}>{R(totalExtraRevenue)}</td></tr></tfoot>}
          </table>
        </div>
      )}

      {active === 'Discounted Extras' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Date','Order #','Extra','Qty','Original','Disc%','Cashier'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {discountedExtras.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No discounted extras in this period</td></tr>
              : discountedExtras.map((e, i) => (
                <tr key={i} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{fmtDate(e.date)}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#00C4A0', fontSize: '11px' }}>{e.orderNumber}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>{e.name}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{e.qty}</td>
                  <td style={{ padding: '10px 12px' }}>{R(e.total)}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: '700' }}>{e.discountPct}%</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{e.cashier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
