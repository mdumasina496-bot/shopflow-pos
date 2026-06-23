import { useState, useEffect, useRef } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, genId, nowISO, fmtDateTime, getSettings } from '../data'

function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.18, 0.36].forEach(offset => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.15)
    })
  } catch { /* audio blocked */ }
}

const STATUS_STYLES = {
  new:        { label: 'NEW',        bg: '#dc2626', color: 'white' },
  processing: { label: 'Processing', bg: '#f59e0b', color: '#0f172a' },
  done:       { label: 'Done',       bg: '#16a34a', color: 'white' },
  cancelled:  { label: 'Cancelled',  bg: '#475569', color: 'white' },
}

export default function OnlineOrders({ user, onBack }) {
  const [orders, setOrders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('new')
  const [form, setForm] = useState({ customerName: '', customerPhone: '', items: '', notes: '', source: 'whatsapp' })
  const prevCount = useRef(0)
  const settings = getSettings()
  const waNumber = (settings.whatsappNumber || '').replace(/\D/g, '')

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

  const updateStatus = (id, status) => {
    const updated = load(KEYS.ONLINE_ORDERS).map(o => o.id === id ? { ...o, status } : o)
    save(KEYS.ONLINE_ORDERS, updated)
    setOrders(updated)
  }

  const submitOrder = () => {
    if (!form.customerName.trim() || !form.items.trim()) { alert('Customer name and items required'); return }
    const newOrder = { id: genId(), date: nowISO(), status: 'new', source: form.source, customerName: form.customerName.trim(), customerPhone: form.customerPhone.trim(), items: form.items.trim(), notes: form.notes.trim(), receivedBy: user.name }
    const all = load(KEYS.ONLINE_ORDERS)
    save(KEYS.ONLINE_ORDERS, [newOrder, ...all])
    setForm({ customerName: '', customerPhone: '', items: '', notes: '', source: 'whatsapp' })
    setShowForm(false)
    reload()
  }

  const openWhatsApp = (order) => {
    const msg = encodeURIComponent(`Hi ${order.customerName}, your order has been received:\n${order.items}\nWe'll have it ready soon!`)
    const url = waNumber ? `https://wa.me/${waNumber}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  const newCount = orders.filter(o => o.status === 'new').length
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <Shell title="Online Orders" onBack={onBack} actions={
      <button onClick={() => setShowForm(true)} style={{ padding: '8px 14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
        + Log Order
      </button>
    }>

      {/* New order modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ margin: '0 0 20px' }}>Log Incoming Order</h3>
            {[
              { key: 'customerName', label: 'Customer Name *', placeholder: 'e.g. Sipho Dlamini' },
              { key: 'customerPhone', label: 'Phone / WhatsApp', placeholder: 'e.g. 0821234567' },
              { key: 'items', label: 'Order Items *', placeholder: 'e.g. 2kg Beef Steak, 1x Rolls, Pap large' },
              { key: 'notes', label: 'Notes', placeholder: 'e.g. Deliver at 18:00, no onion' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
                {key === 'items' || key === 'notes' ? (
                  <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} rows={3}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
                ) : (
                  <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                )}
              </div>
            ))}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Order Source</label>
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

      {/* Alert banner when new orders exist */}
      {newCount > 0 && (
        <div style={{ backgroundColor: 'rgba(220,38,38,0.15)', border: '2px solid #dc2626', borderRadius: '12px', padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🔔</span>
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#fca5a5', fontSize: '15px' }}>{newCount} new order{newCount > 1 ? 's' : ''} waiting!</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Tap an order below to start processing</p>
          </div>
        </div>
      )}

      {/* WhatsApp info if no number set */}
      {!waNumber && (
        <div style={{ backgroundColor: 'rgba(0,196,160,0.08)', border: '1px solid #0A6C6B', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', fontSize: '12px', color: '#94a3b8' }}>
          💬 Set your WhatsApp number in <strong style={{ color: '#00C4A0' }}>Settings → Store Info</strong> to enable WhatsApp reply links.
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
        {[['new', `New${newCount > 0 ? ` (${newCount})` : ''}`], ['processing', 'Processing'], ['done', 'Done'], ['all', 'All']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', backgroundColor: filter === id ? (id === 'new' ? '#dc2626' : '#0A6C6B') : 'transparent', color: filter === id ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📭</p>
          <p style={{ margin: 0 }}>No {filter === 'all' ? '' : filter} orders</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(order => {
          const st = STATUS_STYLES[order.status] || STATUS_STYLES.new
          const sourceIcon = order.source === 'whatsapp' ? '💬' : order.source === 'call' ? '📞' : '🚶'
          return (
            <div key={order.id} style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px 18px', border: `1px solid ${order.status === 'new' ? '#dc2626' : '#334155'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px' }}>{order.customerName}</span>
                    <span style={{ backgroundColor: st.bg, color: st.color, fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>{st.label}</span>
                    <span style={{ fontSize: '14px' }} title={order.source}>{sourceIcon}</span>
                  </div>
                  {order.customerPhone && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{order.customerPhone}</p>}
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{fmtDateTime(order.date)}</p>
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Items ordered</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{order.items}</p>
                {order.notes && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f59e0b' }}>📝 {order.notes}</p>}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {order.status === 'new' && (
                  <button onClick={() => updateStatus(order.id, 'processing')}
                    style={{ padding: '8px 14px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    Start Processing
                  </button>
                )}
                {order.status === 'processing' && (
                  <button onClick={() => updateStatus(order.id, 'done')}
                    style={{ padding: '8px 14px', backgroundColor: '#16a34a', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    Mark Done
                  </button>
                )}
                {(order.status === 'new' || order.status === 'processing') && (
                  <button onClick={() => openWhatsApp(order)}
                    style={{ padding: '8px 14px', backgroundColor: '#25D366', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    💬 Reply on WhatsApp
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'done' && (
                  <button onClick={() => updateStatus(order.id, 'cancelled')}
                    style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
