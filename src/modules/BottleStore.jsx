import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, today } from '../data'

const REASONS = ['Breakage', 'Returned to supplier', 'Customer return', 'Expired', 'Theft', 'Other']

export default function BottleStore({ user, onBack }) {
  const [products, setProducts] = useState([])
  const [breakages, setBreakages] = useState([])
  const [tab, setTab] = useState('stock')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ productId: '', qty: '', reason: 'Breakage', notes: '', date: today() })

  useEffect(() => {
    const prods = load(KEYS.PRODUCTS).filter(p => p.active && p.store === 'bottle')
    setProducts(prods)
    const waste = load(KEYS.WASTAGE).filter(w => w.store === 'bottle' && ['Breakage', 'Returned to supplier', 'Customer return', 'Expired', 'Theft', 'Other'].includes(w.reason))
    setBreakages(waste)
  }, [])

  const categories = [...new Set(products.map(p => p.category))]

  const submitBreakage = () => {
    const prod = products.find(p => p.id === form.productId)
    if (!prod) { alert('Select a product'); return }
    const qty = parseFloat(form.qty)
    if (!qty || qty <= 0) { alert('Enter a valid quantity'); return }
    if (qty > prod.stock) { alert(`Only ${prod.stock} in stock`); return }

    const entry = {
      id: genId(),
      date: form.date,
      store: 'bottle',
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
    setBreakages(prev => [...prev, entry])

    const allProds = load(KEYS.PRODUCTS)
    const updated = allProds.map(p => p.id === prod.id ? { ...p, stock: Math.max(0, p.stock - qty) } : p)
    save(KEYS.PRODUCTS, updated)
    setProducts(updated.filter(p => p.active && p.store === 'bottle'))

    setModal(false)
    setForm({ productId: '', qty: '', reason: 'Breakage', notes: '', date: today() })
  }

  const totalBreakageCost = breakages.reduce((s, b) => s + b.totalCost, 0)
  const lowStock = products.filter(p => p.stock <= p.minStock)

  return (
    <Shell title="Bottle Store" subtitle="Stock & breakage management" onBack={onBack} actions={
      <button onClick={() => setModal(true)} style={{ padding: '8px 16px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + Log Breakage
      </button>
    }>
      {/* Breakage Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Log Breakage / Loss</h3>

            {[
              { label: 'Product', field: 'productId', type: 'select', options: products.map(p => ({ value: p.id, label: `${p.name} (${p.stock} in stock)` })) },
              { label: 'Quantity', field: 'qty', type: 'number' },
              { label: 'Reason', field: 'reason', type: 'select', options: REASONS.map(r => ({ value: r, label: r })) },
              { label: 'Date', field: 'date', type: 'date' },
              { label: 'Notes', field: 'notes', type: 'text' },
            ].map(f => (
              <div key={f.field} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select value={form[f.field]} onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                    {f.field === 'productId' && <option value="">Select product...</option>}
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.field]} onChange={e => setForm(x => ({ ...x, [f.field]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                )}
              </div>
            ))}

            {form.productId && form.qty && (
              <p style={{ color: '#f59e0b', fontWeight: '700', margin: '0 0 14px', fontSize: '14px' }}>
                Cost impact: {R((products.find(p => p.id === form.productId)?.costPrice || 0) * (parseFloat(form.qty) || 0))}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitBreakage} style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Log Loss</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[['stock', 'Stock Overview'], ['reorder', `Reorder (${lowStock.length})`], ['breakages', 'Breakage Log']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: tab === id ? '#0A6C6B' : 'transparent', color: tab === id ? 'white' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Stock Overview */}
      {tab === 'stock' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Total Products', value: products.length, color: '#00C4A0' },
              { label: 'Low Stock', value: lowStock.length, color: '#f59e0b' },
              { label: 'Stock Value', value: R(products.reduce((s, p) => s + p.stock * p.costPrice, 0)), color: '#818cf8' },
              { label: 'Breakage Cost (All)', value: R(totalBreakageCost), color: '#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {categories.map(cat => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</h3>
              <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
                {products.filter(p => p.category === cat).map((p, i, arr) => {
                  const stockPct = p.minStock > 0 ? Math.min(100, (p.stock / (p.minStock * 3)) * 100) : 50
                  const barColor = p.stock <= 0 ? '#dc2626' : p.stock <= p.minStock ? '#f59e0b' : '#00C4A0'
                  return (
                    <div key={p.id} style={{ padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid #0f172a' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{p.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{p.sku} &nbsp;|&nbsp; Sell: {R(p.price)} &nbsp;|&nbsp; Cost: {R(p.costPrice)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: '800', color: barColor, fontSize: '16px' }}>{p.stock} <span style={{ fontSize: '11px', fontWeight: '400', color: '#64748b' }}>{p.unit}</span></p>
                          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Min: {p.minStock}</p>
                        </div>
                      </div>
                      <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${stockPct}%`, backgroundColor: barColor, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Reorder List */}
      {tab === 'reorder' && (
        <div>
          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>✅</p>
              <p>All products are sufficiently stocked!</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', backgroundColor: '#78350f33', borderBottom: '1px solid #92400e' }}>
                <p style={{ margin: 0, color: '#fcd34d', fontWeight: '700', fontSize: '14px' }}>⚠️ {lowStock.length} products need reordering</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    {['Product', 'Category', 'Current Stock', 'Min Level', 'Suggested Order', 'Cost Est.'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p, i) => {
                    const suggested = (p.minStock * 3) - p.stock
                    return (
                      <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                        <td style={{ padding: '11px 14px', fontWeight: '600' }}>{p.name}</td>
                        <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{p.category}</td>
                        <td style={{ padding: '11px 14px', color: p.stock <= 0 ? '#dc2626' : '#f59e0b', fontWeight: '700' }}>{p.stock} {p.unit}</td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>{p.minStock} {p.unit}</td>
                        <td style={{ padding: '11px 14px', color: '#00C4A0', fontWeight: '700' }}>{suggested} {p.unit}</td>
                        <td style={{ padding: '11px 14px', fontWeight: '700' }}>{R(suggested * p.costPrice)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: '14px 16px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', textAlign: 'right', fontWeight: '800', color: '#00C4A0' }}>
                Total estimated reorder cost: {R(lowStock.reduce((s, p) => s + ((p.minStock * 3) - p.stock) * p.costPrice, 0))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breakage Log */}
      {tab === 'breakages' && (
        <div>
          {breakages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📋</p>
              <p>No breakages or losses recorded yet.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a' }}>
                    {['Date', 'Product', 'Qty', 'Reason', 'Cost Impact', 'Logged By'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...breakages].reverse().map((b, i) => (
                    <tr key={b.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                      <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{fmtDate(b.date)}</td>
                      <td style={{ padding: '11px 14px', fontWeight: '600' }}>{b.productName}</td>
                      <td style={{ padding: '11px 14px' }}>{b.qty} {b.unit}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: '#7f1d1d33', color: '#fca5a5', fontSize: '11px' }}>{b.reason}</span>
                      </td>
                      <td style={{ padding: '11px 14px', color: '#dc2626', fontWeight: '700' }}>{R(b.totalCost)}</td>
                      <td style={{ padding: '11px 14px', color: '#64748b' }}>{b.loggedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '14px 16px', borderTop: '1px solid #334155', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>{breakages.length} records</span>
                <span style={{ fontWeight: '800', color: '#dc2626' }}>Total loss: {R(totalBreakageCost)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  )
}
