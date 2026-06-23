import { useState, useEffect, useRef } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, genId, nowISO, fmtDateTime, getSettings, saveSettings } from '../data'

function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.18, 0.36].forEach(offset => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15)
      osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.15)
    })
  } catch { }
}

const STATUS_STYLES = {
  new:        { label: 'NEW',        bg: '#dc2626', color: 'white' },
  processing: { label: 'Processing', bg: '#f59e0b', color: '#0f172a' },
  done:       { label: 'Done',       bg: '#16a34a', color: 'white' },
  cancelled:  { label: 'Cancelled',  bg: '#475569', color: 'white' },
}

const WAIT_TIMES = [10, 15, 20, 30, 45, 60, 90]

export default function OnlineOrders({ user, onBack }) {
  const [orders, setOrders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('new')
  const [activeTab, setActiveTab] = useState('orders')
  const [form, setForm] = useState({ customerName: '', customerPhone: '', items: '', notes: '', source: 'whatsapp' })
  const [speedResult, setSpeedResult] = useState(null)
  const [testingSpeed, setTestingSpeed] = useState(false)
  const prevCount = useRef(0)

  const settings = getSettings()
  const waNumber = (settings.whatsappNumber || '').replace(/\D/g, '')
  const isOnline = settings.storeOnlineStatus !== false
  const waitTime = settings.onlineWaitTime || 20

  const reload = () => {
    const all = load(KEYS.ONLINE_ORDERS)
    setOrders(all)
    const newCount = all.filter(o => o.status === 'new').length
    if (newCount > prevCount.current) playAlert()
    prevCount.current = newCount
  }

  useEffect(() => {
    reload()
    const interval = setInterval(reload, 5000)
    return () => clearInterval(interval)
  }, [])

  const setSetting = (key, val) => saveSettings({ ...getSettings(), [key]: val })

  const toggleOnline = () => {
    setSetting('storeOnlineStatus', !isOnline)
    reload()
  }

  const setWaitTime = (t) => {
    setSetting('onlineWaitTime', t)
  }

  const testSpeed = async () => {
    setTestingSpeed(true)
    setSpeedResult(null)
    const start = Date.now()
    try {
      await fetch('https://www.google.com/favicon.ico?t=' + Date.now(), { mode: 'no-cors', cache: 'no-store' })
      const ms = Date.now() - start
      setSpeedResult({ ms, label: ms < 300 ? 'Fast' : ms < 1000 ? 'Moderate' : 'Slow', color: ms < 300 ? '#4ade80' : ms < 1000 ? '#f59e0b' : '#dc2626' })
    } catch {
      setSpeedResult({ ms: null, label: 'No connection', color: '#dc2626' })
    }
    setTestingSpeed(false)
  }

  const updateStatus = (id, status) => {
    const updated = load(KEYS.ONLINE_ORDERS).map(o => o.id === id ? { ...o, status } : o)
    save(KEYS.ONLINE_ORDERS, updated)
    setOrders(updated)
  }

  const submitOrder = () => {
    if (!form.customerName.trim() || !form.items.trim()) { alert('Customer name and items required'); return }
    const newOrder = { id: genId(), date: nowISO(), status: 'new', source: form.source, customerName: form.customerName.trim(), customerPhone: form.customerPhone.trim(), items: form.items.trim(), notes: form.notes.trim(), receivedBy: user.name, estimatedWait: waitTime }
    save(KEYS.ONLINE_ORDERS, [newOrder, ...load(KEYS.ONLINE_ORDERS)])
    setForm({ customerName: '', customerPhone: '', items: '', notes: '', source: 'whatsapp' })
    setShowForm(false)
    reload()
  }

  const openWhatsApp = (order) => {
    const msg = encodeURIComponent(`Hi ${order.customerName}, your order has been received! ✅\n\nOrder: ${order.items}\n\nEstimated wait: ${waitTime} minutes.\n\nThank you for ordering with us!`)
    window.open(waNumber ? `https://wa.me/${waNumber}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank')
  }

  const newCount = orders.filter(o => o.status === 'new').length
  const processingCount = orders.filter(o => o.status === 'processing').length
  const todayDone = orders.filter(o => o.status === 'done' && o.date?.startsWith(new Date().toISOString().slice(0,10))).length
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <Shell title="Online Orders" onBack={onBack} actions={
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div onClick={toggleOnline} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 14px', borderRadius: '20px', border: `2px solid ${isOnline ? '#16a34a' : '#dc2626'}`, backgroundColor: isOnline ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline ? '#4ade80' : '#dc2626', boxShadow: isOnline ? '0 0 6px #4ade80' : '0 0 6px #dc2626' }} />
          <span style={{ fontSize: '12px', fontWeight: '800', color: isOnline ? '#4ade80' : '#dc2626' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        <button onClick={reload} style={{ padding: '7px 12px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>↺</button>
        <button onClick={() => setShowForm(true)} style={{ padding: '7px 14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>+ Log Order</button>
      </div>
    }>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 20px' }}>Log Incoming Order</h3>
            {[
              { key: 'customerName', label: 'Customer Name *', placeholder: 'e.g. Sipho Dlamini' },
              { key: 'customerPhone', label: 'Phone / WhatsApp', placeholder: 'e.g. 0821234567' },
              { key: 'items', label: 'Order Items *', placeholder: 'e.g. 2kg Beef Steak, Pap large' },
              { key: 'notes', label: 'Notes', placeholder: 'e.g. Deliver at 18:00' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
                {key === 'items' || key === 'notes' ? (
                  <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} rows={2}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
                ) : (
                  <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                )}
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Source</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ id: 'whatsapp', icon: '💬 WhatsApp' }, { id: 'call', icon: '📞 Call' }, { id: 'walk-in', icon: '🚶 Walk-in' }].map(s => (
                  <button key={s.id} onClick={() => setForm(f => ({ ...f, source: s.id }))}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `2px solid ${form.source === s.id ? '#00C4A0' : '#334155'}`, backgroundColor: form.source === s.id ? 'rgba(0,196,160,0.1)' : '#0f172a', color: form.source === s.id ? '#00C4A0' : '#94a3b8', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitOrder} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '800', cursor: 'pointer' }}>Save Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[['orders', '📦 Orders'], ['dashboard', '📊 Dashboard'], ['settings', '⚙️ Settings']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', backgroundColor: activeTab === id ? '#0A6C6B' : 'transparent', color: activeTab === id ? 'white' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'New Orders', value: newCount, color: newCount > 0 ? '#dc2626' : '#64748b' },
              { label: 'Processing', value: processingCount, color: '#f59e0b' },
              { label: 'Done Today', value: todayDone, color: '#4ade80' },
              { label: 'Wait Time', value: `${waitTime} min`, color: '#00C4A0' },
              { label: 'Status', value: isOnline ? 'ONLINE' : 'OFFLINE', color: isOnline ? '#4ade80' : '#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '900', color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {newCount > 0 && (
            <div style={{ backgroundColor: 'rgba(220,38,38,0.12)', border: '2px solid #dc2626', borderRadius: '12px', padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🔔</span>
              <div>
                <p style={{ margin: 0, fontWeight: '800', color: '#fca5a5', fontSize: '16px' }}>{newCount} new order{newCount > 1 ? 's' : ''} waiting!</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Switch to Orders tab to process them.</p>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order Queue by Status</p>
            {['new', 'processing', 'done', 'cancelled'].map(st => {
              const count = orders.filter(o => o.status === st).length
              const st_style = STATUS_STYLES[st]
              return count > 0 ? (
                <div key={st} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a', fontSize: '14px' }}>
                  <span style={{ backgroundColor: st_style.bg, color: st_style.color, padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{st_style.label}</span>
                  <strong>{count} order{count > 1 ? 's' : ''}</strong>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '560px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Online Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: '600' }}>Store is {isOnline ? 'accepting' : 'not accepting'} online orders</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Customers can see this status from the order link</p>
              </div>
              <div onClick={toggleOnline} style={{ width: '52px', height: '28px', borderRadius: '14px', backgroundColor: isOnline ? '#16a34a' : '#334155', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: isOnline ? '27px' : '3px', transition: 'left 0.2s' }} />
              </div>
            </div>

            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Waiting Time</h3>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8' }}>Adjust based on how busy the shop is</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {WAIT_TIMES.map(t => (
                <button key={t} onClick={() => setWaitTime(t)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: `2px solid ${waitTime === t ? '#00C4A0' : '#334155'}`, backgroundColor: waitTime === t ? 'rgba(0,196,160,0.12)' : '#0f172a', color: waitTime === t ? '#00C4A0' : '#94a3b8', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                  {t} min
                </button>
              ))}
            </div>
            <div style={{ backgroundColor: waitTime >= 45 ? 'rgba(220,38,38,0.1)' : waitTime >= 30 ? 'rgba(245,158,11,0.1)' : 'rgba(0,196,160,0.1)', border: `1px solid ${waitTime >= 45 ? '#dc2626' : waitTime >= 30 ? '#f59e0b' : '#00C4A0'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: waitTime >= 45 ? '#fca5a5' : waitTime >= 30 ? '#fcd34d' : '#99f6e4' }}>
              {waitTime >= 45 ? '🔴 Very busy — customers will see a long wait warning' : waitTime >= 30 ? '🟡 Moderately busy' : '🟢 Fast service — customers will be happy'}
            </div>

            <h3 style={{ margin: '20px 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>WhatsApp Number</h3>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8' }}>Format: 27821234567 (country code + number, no spaces or +)</p>
            <input type="text" value={settings.whatsappNumber || ''} onChange={e => setSetting('whatsappNumber', e.target.value)} placeholder="e.g. 27821234567"
              style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />

            <h3 style={{ margin: '20px 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Customer Order Link</h3>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8' }}>Share this WhatsApp link with customers to place orders:</p>
            {waNumber ? (
              <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8', wordBreak: 'break-all' }}>https://wa.me/{waNumber}?text={encodeURIComponent(`Hi! I'd like to place an order from ${settings.storeName || 'the shop'}. Here's what I'd like:\n\n`)}</span>
                <button onClick={() => { navigator.clipboard?.writeText(`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi! I'd like to place an order from ${settings.storeName || 'the shop'}. Here's what I'd like:\n\n`)}`); alert('Link copied!') }} style={{ padding: '6px 12px', backgroundColor: '#25D366', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Copy Link</button>
              </div>
            ) : <p style={{ color: '#f59e0b', fontSize: '13px', margin: 0 }}>Set WhatsApp number above to generate the customer link.</p>}
          </div>

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Internet Speed Test</h3>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>Test your connection speed to ensure smooth online order processing.</p>
            <button onClick={testSpeed} disabled={testingSpeed}
              style={{ padding: '10px 20px', backgroundColor: testingSpeed ? '#334155' : '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: testingSpeed ? 'not-allowed' : 'pointer', fontSize: '14px', marginBottom: '12px' }}>
              {testingSpeed ? '⏳ Testing...' : '🌐 Test Speed'}
            </button>
            {speedResult && (
              <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: speedResult.color }} />
                <div>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '16px', color: speedResult.color }}>{speedResult.label}</p>
                  {speedResult.ms && <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Response time: {speedResult.ms}ms</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <>
          {newCount > 0 && (
            <div style={{ backgroundColor: 'rgba(220,38,38,0.12)', border: '2px solid #dc2626', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>🔔</span>
              <p style={{ margin: 0, fontWeight: '800', color: '#fca5a5' }}>{newCount} new order{newCount > 1 ? 's' : ''} waiting! Estimated wait: {waitTime} min.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
            {[['new', `New${newCount > 0 ? ` (${newCount})` : ''}`], ['processing', 'Processing'], ['done', 'Done'], ['all', 'All']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', backgroundColor: filter === id ? (id === 'new' ? '#dc2626' : '#0A6C6B') : 'transparent', color: filter === id ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📭</p>
              <p style={{ margin: 0 }}>No {filter === 'all' ? '' : filter} orders</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(order => {
              const st = STATUS_STYLES[order.status] || STATUS_STYLES.new
              const srcIcon = order.source === 'whatsapp' ? '💬' : order.source === 'call' ? '📞' : '🚶'
              return (
                <div key={order.id} style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px 18px', border: `1px solid ${order.status === 'new' ? '#dc2626' : '#334155'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px' }}>{order.customerName}</span>
                        <span style={{ backgroundColor: st.bg, color: st.color, fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>{st.label}</span>
                        <span style={{ fontSize: '14px' }}>{srcIcon}</span>
                      </div>
                      {order.customerPhone && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{order.customerPhone}</p>}
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{fmtDateTime(order.date)}{order.estimatedWait ? ` • Est. wait: ${order.estimatedWait} min` : ''}</p>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Items ordered</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{order.items}</p>
                    {order.notes && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f59e0b' }}>📝 {order.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {order.status === 'new' && <button onClick={() => updateStatus(order.id, 'processing')} style={{ padding: '8px 14px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Start Processing</button>}
                    {order.status === 'processing' && <button onClick={() => updateStatus(order.id, 'done')} style={{ padding: '8px 14px', backgroundColor: '#16a34a', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Mark Done</button>}
                    {(order.status === 'new' || order.status === 'processing') && (
                      <button onClick={() => openWhatsApp(order)} style={{ padding: '8px 14px', backgroundColor: '#25D366', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>💬 Reply on WhatsApp</button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'done' && (
                      <button onClick={() => updateStatus(order.id, 'cancelled')} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Shell>
  )
}
