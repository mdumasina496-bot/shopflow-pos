import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, fmtDateTime, today, logActivity } from '../data'

function CharcoalTab({ user }) {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ type: 'receive', date: today(), qty: '', unit: 'bag', costPrice: '', supplier: '', notes: '' })
  const [filter, setFilter] = useState('all')

  useEffect(() => { setRecords(load(KEYS.CHARCOAL)) }, [])

  const submit = () => {
    if (!form.qty || parseFloat(form.qty) <= 0) { alert('Enter a valid quantity'); return }
    if (form.type === 'receive' && (!form.costPrice || parseFloat(form.costPrice) <= 0)) { alert('Enter a cost price for received stock'); return }
    const entry = { id: genId(), ...form, qty: parseFloat(form.qty), costPrice: parseFloat(form.costPrice) || 0, recordedBy: user.name, createdAt: new Date().toISOString() }
    const updated = [...load(KEYS.CHARCOAL), entry]
    save(KEYS.CHARCOAL, updated)
    setRecords(updated)
    logActivity(user, 'CHARCOAL_' + form.type.toUpperCase(), { qty: form.qty, unit: form.unit })
    setForm({ type: form.type, date: today(), qty: '', unit: 'bag', costPrice: '', supplier: '', notes: '' })
  }

  const received = records.filter(r => r.type === 'receive').reduce((s, r) => s + r.qty, 0)
  const used = records.filter(r => r.type === 'use').reduce((s, r) => s + r.qty, 0)
  const balance = received - used
  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Received', value: `${received} bags`, color: '#00C4A0' },
          { label: 'Total Used', value: `${used} bags`, color: '#f59e0b' },
          { label: 'Balance', value: `${balance} bags`, color: balance < 5 ? '#dc2626' : '#4ade80' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '22px', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {balance < 5 && balance >= 0 && (
        <div style={{ backgroundColor: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#fca5a5', fontWeight: '600' }}>
          ⚠️ Low charcoal stock! Only {balance} bags remaining. Place an order soon.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Log Entry</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ id: 'receive', label: '📥 Receive', color: '#00C4A0' }, { id: 'use', label: '🔥 Used', color: '#f59e0b' }].map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
                  style={{ flex: 1, padding: '9px', borderRadius: '8px', border: `2px solid ${form.type === t.id ? t.color : '#334155'}`, backgroundColor: form.type === t.id ? `${t.color}22` : '#0f172a', color: form.type === t.id ? t.color : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '9px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qty *</label>
              <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0"
                style={{ width: '100%', padding: '9px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unit</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              style={{ width: '100%', padding: '9px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box' }}>
              {['bag', 'kg', 'box'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {form.type === 'receive' && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cost Price per {form.unit} (R) *</label>
                <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="0.00"
                  style={{ width: '100%', padding: '9px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Supplier</label>
                <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name"
                  style={{ width: '100%', padding: '9px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </>
          )}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notes</label>
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..."
              style={{ width: '100%', padding: '9px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button onClick={submit} style={{ width: '100%', padding: '11px', backgroundColor: form.type === 'receive' ? '#00C4A0' : '#f59e0b', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '800', cursor: 'pointer' }}>
            {form.type === 'receive' ? '📥 Record Receipt' : '🔥 Record Usage'}
          </button>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {[['all', 'All'], ['receive', 'Received'], ['use', 'Used']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', backgroundColor: filter === id ? '#0A6C6B' : '#0f172a', color: filter === id ? 'white' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>{label}</button>
            ))}
          </div>
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', margin: '40px 0' }}>No records</p>
            ) : (
              [...filtered].reverse().map(rec => (
                <div key={rec.id} style={{ padding: '10px 0', borderBottom: '1px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '13px', color: rec.type === 'receive' ? '#00C4A0' : '#f59e0b' }}>
                      {rec.type === 'receive' ? '📥' : '🔥'} {rec.qty} {rec.unit}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{fmtDate(rec.date)} • {rec.recordedBy}</p>
                    {rec.supplier && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>From: {rec.supplier}</p>}
                    {rec.notes && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>{rec.notes}</p>}
                  </div>
                  {rec.costPrice > 0 && <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>{R(rec.qty * rec.costPrice)}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GRV({ user, onBack }) {
  const [grvs, setGrvs] = useState([])
  const [products, setProducts] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ supplier: '', date: today(), store: user.store === 'both' ? 'butchery' : user.store, notes: '' })
  const [items, setItems] = useState([])
  const [itemForm, setItemForm] = useState({ productId: '', qty: '', costPrice: '' })
  const [activeTab, setActiveTab] = useState('grv')

  useEffect(() => {
    setGrvs(load(KEYS.GRV))
    const allProds = load(KEYS.PRODUCTS).filter(p => p.active && (user.store === 'both' || p.store === user.store))
    setProducts(allProds)
  }, [])

  const storeProducts = products.filter(p => form.store === 'both' ? true : p.store === form.store)

  const addItem = () => {
    const prod = products.find(p => p.id === itemForm.productId)
    if (!prod) { alert('Select a product'); return }
    if (!itemForm.qty || parseFloat(itemForm.qty) <= 0) { alert('Enter a valid quantity'); return }
    if (!itemForm.costPrice || parseFloat(itemForm.costPrice) <= 0) { alert('Enter a valid cost price'); return }
    const qty = parseFloat(itemForm.qty)
    const cost = parseFloat(itemForm.costPrice)
    setItems(prev => [...prev, { productId: prod.id, name: prod.name, unit: prod.unit, qty, costPrice: cost, total: qty * cost }])
    setItemForm({ productId: '', qty: '', costPrice: '' })
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))
  const grvTotal = items.reduce((s, i) => s + i.total, 0)

  const submitGRV = () => {
    if (!form.supplier.trim()) { alert('Enter supplier name'); return }
    if (items.length === 0) { alert('Add at least one item'); return }

    const allGrvs = load(KEYS.GRV)
    const num = `GRV-${form.date.replace(/-/g, '')}-${String(allGrvs.length + 1).padStart(3, '0')}`
    const grv = { id: genId(), grvNumber: num, ...form, items, totalCost: grvTotal, receivedBy: user.name, createdAt: new Date().toISOString() }

    save(KEYS.GRV, [...allGrvs, grv])
    setGrvs([...allGrvs, grv])

    const allProds = load(KEYS.PRODUCTS)
    save(KEYS.PRODUCTS, allProds.map(p => {
      const item = items.find(i => i.productId === p.id)
      return item ? { ...p, stock: p.stock + item.qty, costPrice: item.costPrice } : p
    }))
    setProducts(load(KEYS.PRODUCTS).filter(p => p.active && (user.store === 'both' || p.store === user.store)))

    logActivity(user, 'GRV_SUBMIT', { grvNumber: num, supplier: form.supplier, totalCost: grvTotal, items: items.length })
    setView('list')
    setForm({ supplier: '', date: today(), store: user.store === 'both' ? 'butchery' : user.store, notes: '' })
    setItems([])
  }

  if (view === 'detail' && selected) {
    return (
      <Shell title={selected.grvNumber} subtitle={`${selected.supplier} — ${fmtDate(selected.date)}`} onBack={() => setSelected(null) || setView('list')}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '14px' }}>
            <div><span style={{ color: '#64748b' }}>Supplier: </span><strong>{selected.supplier}</strong></div>
            <div><span style={{ color: '#64748b' }}>Date: </span><strong>{fmtDate(selected.date)}</strong></div>
            <div><span style={{ color: '#64748b' }}>Store: </span><strong style={{ textTransform: 'capitalize' }}>{selected.store}</strong></div>
            <div><span style={{ color: '#64748b' }}>Received by: </span><strong>{selected.receivedBy}</strong></div>
            {selected.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#64748b' }}>Notes: </span>{selected.notes}</div>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Product', 'Qty', 'Unit', 'Cost/Unit', 'Total'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {selected.items.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid #0f172a' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px' }}>{item.qty}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.unit}</td>
                  <td style={{ padding: '10px 14px' }}>{R(item.costPrice)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: '800', color: '#00C4A0', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #334155' }}>
            Total Cost: {R(selected.totalCost)}
          </div>
        </div>
      </Shell>
    )
  }

  if (view === 'new') {
    const prod = products.find(p => p.id === itemForm.productId)
    return (
      <Shell title="New GRV" onBack={() => setView('list')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GRV Details</h3>
              {[
                { key: 'supplier', label: 'Supplier Name *', type: 'text' },
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'notes', label: 'Notes', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              {user.store === 'both' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Store</label>
                  <select value={form.store} onChange={e => setForm(x => ({ ...x, store: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="butchery">Butchery</option>
                    <option value="bottle">Bottle Store</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Item</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product</label>
                <select value={itemForm.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value)
                  setItemForm(f => ({ ...f, productId: e.target.value, costPrice: p ? String(p.costPrice) : '' }))
                }}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="">Select product...</option>
                  {storeProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              {prod && <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8' }}>Current stock: {prod.stock} {prod.unit}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qty Received</label>
                  <input type="number" value={itemForm.qty} onChange={e => setItemForm(f => ({ ...f, qty: e.target.value }))} placeholder="0"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cost Price (R)</label>
                  <input type="number" value={itemForm.costPrice} onChange={e => setItemForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="0.00"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              {itemForm.qty && itemForm.costPrice && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#00C4A0', fontWeight: '700' }}>Line total: {R(parseFloat(itemForm.qty) * parseFloat(itemForm.costPrice))}</p>}
              <button onClick={addItem} style={{ width: '100%', padding: '10px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>+ Add to GRV</button>
            </div>
          </div>

          <div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items ({items.length})</h3>
              {items.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', margin: '40px 0' }}>No items added yet</p>
              ) : (
                <>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #0f172a' }}>
                      <div>
                        <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px' }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.qty} {item.unit} × {R(item.costPrice)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700', color: '#00C4A0' }}>{R(item.total)}</span>
                        <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155', fontSize: '18px', fontWeight: '800', color: '#00C4A0' }}>
                    <span>Total</span><span>{R(grvTotal)}</span>
                  </div>
                  <button onClick={submitGRV} style={{ width: '100%', marginTop: '16px', padding: '14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                    Submit GRV & Update Stock
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Stock Receiving" onBack={onBack} actions={
      activeTab === 'grv' && (
        <button onClick={() => setView('new')} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
          + New GRV
        </button>
      )
    }>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {[['grv', '📋 Products GRV'], ['charcoal', '🔥 Charcoal / Coal']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === id ? '#0A6C6B' : 'transparent', color: activeTab === id ? 'white' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'charcoal' && <CharcoalTab user={user} />}

      {activeTab === 'grv' && (
        grvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📋</p>
            <p>No GRVs recorded yet. Click "New GRV" to receive goods.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a' }}>
                  {['GRV #', 'Date', 'Supplier', 'Store', 'Items', 'Total Cost', 'Received By', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...grvs].reverse().map((grv, i) => (
                  <tr key={grv.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#00C4A0', fontFamily: 'monospace' }}>{grv.grvNumber}</td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{fmtDate(grv.date)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: '600' }}>{grv.supplier}</td>
                    <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: grv.store === 'butchery' ? '#7f1d1d33' : '#78350f33', color: grv.store === 'butchery' ? '#fca5a5' : '#fcd34d', fontSize: '11px', fontWeight: '600' }}>{grv.store}</span></td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{grv.items.length} items</td>
                    <td style={{ padding: '12px 14px', fontWeight: '700' }}>{R(grv.totalCost)}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{grv.receivedBy}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => { setSelected(grv); setView('detail') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Shell>
  )
}
