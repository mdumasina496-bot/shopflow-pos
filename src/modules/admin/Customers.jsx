import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, R, genId, fmtDate } from '../../data'

export default function Customers({ user, onBack }) {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [selected, setSelected] = useState(null)

  useEffect(() => { setCustomers(load(KEYS.CUSTOMERS)) }, [])

  const persist = (updated) => { save(KEYS.CUSTOMERS, updated); setCustomers(updated) }

  const openAdd = () => { setForm({ name: '', phone: '', email: '', address: '', notes: '', active: true }); setModal('add') }
  const openEdit = (c) => { setForm({ ...c }); setModal('edit') }

  const saveCustomer = () => {
    if (!form.name.trim()) { alert('Customer name is required'); return }
    const all = load(KEYS.CUSTOMERS)
    if (modal === 'add') persist([...all, { ...form, id: genId(), createdAt: new Date().toISOString(), orderCount: 0, totalSpend: 0 }])
    else persist(all.map(c => c.id === form.id ? { ...form } : c))
    setModal(null)
  }

  const getOrders = (customerId) => {
    return load(KEYS.SALES).filter(s => s.customerName && customers.find(c => c.id === customerId)?.name === s.customerName)
  }

  const visible = customers.filter(c => {
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
  })

  const F = (field, label, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
      {type === 'textarea' ? (
        <textarea value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} rows={3}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
      ) : (
        <input type={type} value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
      )}
    </div>
  )

  if (selected) {
    const orders = getOrders(selected.id)
    const totalSpend = orders.reduce((s, o) => s + o.total, 0)
    return (
      <Shell title={selected.name} subtitle={selected.phone || 'No phone'} onBack={() => setSelected(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Profile</h3>
            {[['Name', selected.name], ['Phone', selected.phone || '—'], ['Email', selected.email || '—'], ['Address', selected.address || '—'], ['Member since', fmtDate(selected.createdAt)], ['Total orders', orders.length], ['Total spend', R(totalSpend)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{l}</span>
                <span style={{ fontWeight: '600', textAlign: 'right', maxWidth: '180px' }}>{v}</span>
              </div>
            ))}
            {selected.notes && <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#94a3b8' }}>Notes: {selected.notes}</p>}
            <button onClick={() => { openEdit(selected); setSelected(null) }} style={{ width: '100%', marginTop: '16px', padding: '10px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
              Edit Customer
            </button>
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #0f172a' }}>
              <h3 style={{ margin: 0, fontSize: '14px' }}>Order History ({orders.length})</h3>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No orders found for this customer.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Date', 'Order #', 'Type', 'Items', 'Total'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...orders].reverse().map((o, i) => (
                    <tr key={o.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{fmtDate(o.date)}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#00C4A0' }}>{o.orderNumber}</td>
                      <td style={{ padding: '10px 14px', textTransform: 'capitalize', color: '#64748b' }}>{o.orderType}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{(o.items?.length || 0) + (o.extras?.length || 0)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Customers" subtitle="Regular & call order customers" onBack={onBack} actions={
      <button onClick={openAdd} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + Add Customer
      </button>
    }>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px' }}>{modal === 'add' ? 'Add Customer' : 'Edit Customer'}</h3>
            {F('name', 'Full Name *', 'text', 'Customer name')}
            {F('phone', 'Phone Number', 'tel', '0XX XXX XXXX')}
            {F('email', 'Email', 'email', 'email@example.com')}
            {F('address', 'Delivery Address', 'text', 'Street, suburb, city')}
            {F('notes', 'Notes', 'textarea', 'Preferences, special requests...')}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveCustomer} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <input type="text" placeholder="Search by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '11px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>👥</p>
          <p>{search ? 'No customers match your search.' : 'No customers yet. Add your first regular customer.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {visible.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '16px', cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#00C4A0'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{c.name}</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{fmtDate(c.createdAt)}</span>
              </div>
              {c.phone && <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>📞 {c.phone}</p>}
              {c.email && <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}>✉️ {c.email}</p>}
              {c.address && <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b' }}>📍 {c.address}</p>}
              {c.notes && <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>{c.notes}</p>}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #0f172a', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={e => { e.stopPropagation(); openEdit(c) }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>View orders →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}
