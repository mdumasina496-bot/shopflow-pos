import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, today } from '../data'

const REASONS = ['Expired', 'Damaged', 'Over-processed', 'Spilled', 'Theft', 'Customer return', 'Other']

export default function Wastage({ user, onBack }) {
  const [wastage, setWastage] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ productId: '', qty: '', reason: 'Expired', notes: '', date: today() })
  const [showForm, setShowForm] = useState(false)
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)
  const [dateFrom, setDateFrom] = useState('')

  useEffect(() => {
    setWastage(load(KEYS.WASTAGE))
    setProducts(load(KEYS.PRODUCTS).filter(p => p.active && (user.store === 'both' || p.store === user.store)))
  }, [])

  const storeProducts = user.store === 'both'
    ? (storeFilter === 'all' ? products : products.filter(p => p.store === storeFilter))
    : products

  const submit = () => {
    const prod = products.find(p => p.id === form.productId)
    if (!prod) { alert('Select a product'); return }
    const qty = parseFloat(form.qty)
    if (!qty || qty <= 0) { alert('Enter a valid quantity'); return }
    if (qty > prod.stock) { alert(`Only ${prod.stock} ${prod.unit} in stock`); return }

    const entry = {
      id: genId(),
      date: form.date,
      store: prod.store,
      productId: prod.id,
      productName: prod.name,
      qty,
      unit: prod.unit,
      reason: form.reason,
      notes: form.notes,
      costPerUnit: prod.costPrice,
      totalCost: qty * prod.costPrice,
      loggedBy: user.name,
      createdAt: new Date().toISOString(),
    }

    const allWaste = load(KEYS.WASTAGE)
    save(KEYS.WASTAGE, [...allWaste, entry])
    setWastage([...allWaste, entry])

    const allProds = load(KEYS.PRODUCTS)
    const updated = allProds.map(p => p.id === prod.id ? { ...p, stock: Math.max(0, p.stock - qty) } : p)
    save(KEYS.PRODUCTS, updated)
    setProducts(updated.filter(p => p.active && (user.store === 'both' || p.store === user.store)))

    setForm({ productId: '', qty: '', reason: 'Expired', notes: '', date: today() })
    setShowForm(false)
  }

  const visible = wastage.filter(w => {
    const matchStore = storeFilter === 'all' || w.store === storeFilter
    const matchDate = !dateFrom || w.date >= dateFrom
    return matchStore && matchDate
  })

  const totalCost = visible.reduce((s, w) => s + w.totalCost, 0)
  const byReason = REASONS.map(r => ({ reason: r, count: visible.filter(w => w.reason === r).length, cost: visible.filter(w => w.reason === r).reduce((s, w) => s + w.totalCost, 0) })).filter(r => r.count > 0)

  const selectedProd = products.find(p => p.id === form.productId)

  return (
    <Shell title="Wastage Log" onBack={onBack} actions={
      <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + Log Wastage
      </button>
    }>
      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Log Wastage</h3>

            {user.store === 'both' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Store</label>
                <select value={storeFilter} onChange={e => { setStoreFilter(e.target.value); setForm(f => ({ ...f, productId: '' })) }}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="all">All</option>
                  <option value="butchery">Butchery</option>
                  <option value="bottle">Bottle Store</option>
                </select>
              </div>
            )}

            {[
              { label: 'Product *', field: 'productId', type: 'select' },
              { label: 'Quantity *', field: 'qty', type: 'number' },
              { label: 'Reason', field: 'reason', type: 'reason' },
              { label: 'Date', field: 'date', type: 'date' },
              { label: 'Notes', field: 'notes', type: 'text' },
            ].map(f => (
              <div key={f.field} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.field]} onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">Select product...</option>
                    {storeProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit} in stock)</option>)}
                  </select>
                ) : f.type === 'reason' ? (
                  <select value={form[f.field]} onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.field]} onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                )}
              </div>
            ))}

            {selectedProd && form.qty && (
              <div style={{ backgroundColor: '#7f1d1d33', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <p style={{ margin: 0, color: '#fca5a5', fontSize: '14px', fontWeight: '700' }}>
                  Cost impact: {R((selectedProd.costPrice) * (parseFloat(form.qty) || 0))}
                </p>
                <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>New stock: {Math.max(0, selectedProd.stock - (parseFloat(form.qty) || 0))} {selectedProd.unit}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submit} style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Log Wastage</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Records', value: visible.length, color: '#94a3b8' },
          { label: 'Total Cost Loss', value: R(totalCost), color: '#dc2626' },
          { label: 'Avg Cost / Entry', value: visible.length ? R(totalCost / visible.length) : R(0), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
        {byReason.map(r => (
          <div key={r.reason} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#f87171' }}>{R(r.cost)}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{r.reason} ({r.count})</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {user.store === 'both' && (
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            style={{ padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px' }}>
            <option value="all">All Stores</option>
            <option value="butchery">Butchery</option>
            <option value="bottle">Bottle Store</option>
          </select>
        )}
        <div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From date"
            style={{ padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: dateFrom ? 'white' : '#64748b', fontSize: '14px', outline: 'none' }} />
        </div>
        {dateFrom && <button onClick={() => setDateFrom('')} style={{ padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>Clear Date</button>}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {visible.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No wastage records found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Date', 'Product', 'Store', 'Qty', 'Reason', 'Cost Loss', 'Logged By'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...visible].reverse().map((w, i) => (
                <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{fmtDate(w.date)}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '600' }}>{w.productName}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: w.store === 'butchery' ? '#7f1d1d33' : '#78350f33', color: w.store === 'butchery' ? '#fca5a5' : '#fcd34d', fontSize: '11px' }}>{w.store}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>{w.qty} {w.unit}</td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{w.reason}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: '#dc2626' }}>{R(w.totalCost)}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{w.loggedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {visible.length > 0 && (
          <div style={{ padding: '12px 14px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>{visible.length} records</span>
            <span style={{ fontWeight: '800', color: '#dc2626', fontSize: '15px' }}>Total loss: {R(totalCost)}</span>
          </div>
        )}
      </div>
    </Shell>
  )
}
