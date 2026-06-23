import { useState } from 'react'
import Orders from './admin/Orders'
import Assign from './admin/Assign'
import StoreCashup from './admin/StoreCashup'
import Shifts from './admin/Shifts'
import Customers from './admin/Customers'
import Settings from './admin/Settings'
import Attendance from './admin/Attendance'
import ActivityMonitor from './ActivityMonitor'

const SUB_MODULES = [
  { id: 'orders',     label: '🛒 Orders',           color: '#0A6C6B', roles: ['owner','manager','cashier'], desc: 'Sales, discounts & payments' },
  { id: 'assign',     label: '👤 Assign',            color: '#1e40af', roles: ['owner','manager'],           desc: 'Assign cashiers & till floats' },
  { id: 'cashup',     label: '💰 Store Cashup',      color: '#166534', roles: ['owner','manager'],           desc: 'Blind cashup & reconciliation' },
  { id: 'shifts',     label: '🕐 Shifts',            color: '#7c3aed', roles: ['owner','manager'],           desc: 'Manage work shifts' },
  { id: 'customers',  label: '👥 Customers',         color: '#b45309', roles: ['owner','manager','cashier'], desc: 'Customer profiles & call orders' },
  { id: 'settings',   label: '⚙️ Settings',          color: '#374151', roles: ['owner','manager'],           desc: 'System configuration' },
  { id: 'attendance', label: '📋 Attendance',        color: '#0e7490', roles: ['owner','manager','cashier'], desc: 'Staff clock in / clock out' },
  { id: 'activity',   label: '🔍 Activity Monitor',  color: '#1e1b4b', roles: ['owner'],                    desc: 'All system events with timestamps' },
]

const COMPONENT_MAP = { orders: Orders, assign: Assign, cashup: StoreCashup, shifts: Shifts, customers: Customers, settings: Settings, attendance: Attendance, activity: ActivityMonitor }

export default function AdminMenu({ user, onBack }) {
  const [active, setActive] = useState(null)

  if (active) {
    const Module = COMPONENT_MAP[active]
    return <Module user={user} onBack={() => setActive(null)} />
  }

  const visible = SUB_MODULES.filter(m => m.roles.includes(user.role))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0A6C6B', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '8px', color: 'white', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
          ← Back
        </button>
        <img src="/logo-main.png" alt="ShopFlow POS" style={{ height: '36px', objectFit: 'contain' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Admin Menu</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#99f6e4' }}>Front of house operations</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#99f6e4' }}>{user.name}</p>
          <span style={{ backgroundColor: '#00C4A0', color: '#0f172a', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase' }}>
            {user.role} • {user.store === 'both' ? 'All Stores' : user.store}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
          {visible.map(m => (
            <div
              key={m.id}
              onClick={() => setActive(m.id)}
              style={{ backgroundColor: m.color, padding: '28px 20px', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.1s, filter 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}
            >
              <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800' }}>{m.label}</p>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.85 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
