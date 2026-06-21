import { useState } from 'react'
import StockReports from './reports/StockReports'
import CashupReports from './reports/CashupReports'
import MenuSalesReports from './reports/MenuSalesReports'
import OrderReports from './reports/OrderReports'
import SummaryReports from './reports/SummaryReports'

const SUB = [
  { id: 'stock',    label: '📦 Stock',        color: '#1e40af', desc: 'Variance, GP/FC, GRV, stocktake, wastage & more' },
  { id: 'cashup',   label: '💰 Cashup',       color: '#166534', desc: 'Store cashup, till cashup, petty cash' },
  { id: 'menu',     label: '🥩 Menu Sales',   color: '#b91c1c', desc: 'Menu items, extras sold, discounts (butchery)' },
  { id: 'orders',   label: '🛒 Orders',       color: '#0A6C6B', desc: 'Daily sales, invoices, discounts, hourly, monthly' },
  { id: 'summary',  label: '📊 Summary',      color: '#7c3aed', desc: 'Activity, suppliers, customers, attendance' },
]

const MAP = { stock: StockReports, cashup: CashupReports, menu: MenuSalesReports, orders: OrderReports, summary: SummaryReports }

export default function Reports({ user, onBack }) {
  const [active, setActive] = useState(null)

  if (active) {
    const Module = MAP[active]
    return <Module user={user} onBack={() => setActive(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
      <div style={{ backgroundColor: '#0A6C6B', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '8px', color: 'white', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
          ← Back
        </button>
        <img src="/logo-main.png" alt="ShopFlow POS" style={{ height: '36px', objectFit: 'contain' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Reports</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#99f6e4' }}>Select a report category</p>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {SUB.map(m => (
            <div key={m.id} onClick={() => setActive(m.id)}
              style={{ backgroundColor: m.color, padding: '28px 20px', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.1s, filter 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}>
              <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800' }}>{m.label}</p>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.85 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
