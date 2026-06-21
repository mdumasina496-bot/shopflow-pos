import { useState, useEffect } from 'react'
import { KEYS, load, initData } from './data'
import AdminMenu from './modules/AdminMenu'
import Inventory from './modules/Inventory'
import GRV from './modules/GRV'
import ButcheryCuts from './modules/ButcheryCuts'
import BottleStore from './modules/BottleStore'
import Reports from './modules/Reports'
import StockCount from './modules/StockCount'
import Wastage from './modules/Wastage'
import FCReport from './modules/FCReport'
import Users from './modules/Users'

const MENU = [
  { label: '🏪 Admin Menu',     screen: 'admin',      color: '#0A6C6B', roles: ['owner','manager','cashier'], stores: ['both','butchery','bottle'] },
  { label: '📦 Inventory',      screen: 'inventory',  color: '#1e40af', roles: ['owner','manager'],           stores: ['both','butchery','bottle'] },
  { label: '📋 GRV',            screen: 'grv',        color: '#7c3aed', roles: ['owner','manager'],           stores: ['both','butchery','bottle'] },
  { label: '🥩 Butchery Cuts',  screen: 'butchery',   color: '#b91c1c', roles: ['owner','manager'],           stores: ['both','butchery'] },
  { label: '🍺 Bottle Store',   screen: 'bottle',     color: '#b45309', roles: ['owner','manager'],           stores: ['both','bottle'] },
  { label: '📊 Reports',        screen: 'reports',    color: '#065f46', roles: ['owner','manager'],           stores: ['both','butchery','bottle'] },
  { label: '⚖️ Stock Count',    screen: 'stockcount', color: '#0e7490', roles: ['owner','manager'],           stores: ['both','butchery','bottle'] },
  { label: '🗑️ Wastage Log',    screen: 'wastage',    color: '#9f1239', roles: ['owner','manager'],           stores: ['both','butchery','bottle'] },
  { label: '📈 FC Report',      screen: 'fcreport',   color: '#166534', roles: ['owner'],                     stores: ['both','butchery','bottle'] },
  { label: '👥 Users',          screen: 'users',      color: '#1e3a5f', roles: ['owner'],                     stores: ['both'] },
]

const MODULE_MAP = {
  admin: AdminMenu, inventory: Inventory, grv: GRV, butchery: ButcheryCuts,
  bottle: BottleStore, reports: Reports, stockcount: StockCount,
  wastage: Wastage, fcreport: FCReport, users: Users,
}

export default function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [screen, setScreen] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => { initData() }, [])

  const handleLogin = () => {
    const users = load(KEYS.USERS)
    const user = users.find(u => u.username === username.trim() && u.password === password && u.active !== false)
    if (user) {
      setCurrentUser(user)
      setScreen('dashboard')
    } else {
      alert('Invalid username or password.')
    }
  }

  const handleLogout = () => {
    setScreen('login')
    setUsername('')
    setPassword('')
    setCurrentUser(null)
  }

  const filteredMenu = currentUser
    ? MENU.filter(item =>
        item.roles.includes(currentUser.role) &&
        item.stores.some(s => s === currentUser.store || currentUser.store === 'both')
      )
    : []

  // Render active module
  if (screen !== 'login' && screen !== 'dashboard' && currentUser) {
    const Module = MODULE_MAP[screen]
    if (Module) return <Module user={currentUser} onBack={() => setScreen('dashboard')} />
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── LOGIN ── */}
      {screen === 'login' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>

          {/* Glossy logo — login only */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <img src="/logo-button.png" alt="ShopFlow POS" style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '24px' }} />
            <p style={{ color: '#00C4A0', fontSize: '12px', margin: '10px 0 0' }}>Zero Hustle • Powered by ZeHuWo Pty Ltd</p>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '36px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <h2 style={{ textAlign: 'center', marginTop: '0', marginBottom: '28px', fontSize: '20px', color: '#e2e8f0' }}>Staff Login</h2>

            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Username</label>
            <input type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px', marginBottom: '18px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />

            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '14px', marginBottom: '28px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />

            <button onClick={handleLogin}
              style={{ width: '100%', padding: '16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '12px', color: '#0f172a', fontWeight: '800', fontSize: '16px', cursor: 'pointer', letterSpacing: '0.5px' }}>
              LOG IN →
            </button>

            <p style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '20px', marginBottom: '0' }}>
              🔄 Works Offline • Auto Syncs When Online
            </p>
          </div>

          <div style={{ marginTop: '20px', backgroundColor: '#1e293b', padding: '16px 24px', borderRadius: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
            <strong style={{ color: '#94a3b8' }}>Test Logins (all password: 1234)</strong><br />
            owner • butchery_manager • bottle_manager<br />
            butchery_cashier • bottle_cashier
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {screen === 'dashboard' && currentUser && (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
          {/* Header with standard logo */}
          <div style={{ backgroundColor: '#0A6C6B', padding: '16px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 4px 20px rgba(10,108,107,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/logo-main.png" alt="ShopFlow POS" style={{ height: '48px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: '0', fontSize: '20px', fontWeight: '800' }}>ShopFlow POS</h1>
                <p style={{ margin: '0', color: '#00C4A0', fontSize: '12px' }}>ZeHuWo Pty Ltd</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0', fontSize: '12px', color: '#99f6e4' }}>Logged in as</p>
              <p style={{ margin: '0', fontWeight: '700', color: 'white', fontSize: '15px' }}>{currentUser.name}</p>
              <span style={{ backgroundColor: '#00C4A0', color: '#0f172a', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase' }}>
                {currentUser.role} • {currentUser.store === 'both' ? 'All Stores' : currentUser.store}
              </span>
            </div>
          </div>

          {/* Menu grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {filteredMenu.map(item => (
              <div key={item.screen} onClick={() => setScreen(item.screen)}
                style={{ backgroundColor: item.color, padding: '28px 16px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.1s, filter 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(1.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}>
                {item.label}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#475569', fontSize: '12px', margin: '0' }}>
              🟢 Online • {new Date().toLocaleDateString('en-ZA')}
            </p>
            <button onClick={handleLogout}
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
