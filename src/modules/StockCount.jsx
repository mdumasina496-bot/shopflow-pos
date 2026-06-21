import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, today } from '../data'

export default function StockCount({ user, onBack }) {
  const [counts, setCounts] = useState([])
  const [products, setProducts] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [countStore, setCountStore] = useState(user.store === 'both' ? 'butchery' : user.store)
  const [date, setDate] = useState(today())
  const [items, setItems] = useState([])
  const [applyConfirm, setApplyConfirm] = useState(false)

  useEffect(() => {
    setCounts(load(KEYS.STOCK_COUNTS))
    setProducts(load(KEYS.PRODUCTS))
  }, [])

  const startCount = () => {
    const storeProds = products.filter(p => p.active && (countStore === 'both' || p.store === countStore))
    setItems(storeProds.map(p => ({ productId: p.id, name: p.name, unit: p.unit, systemQty: p.stock, countedQty: '' })))
    setView('count')
  }

  const updateCounted = (productId, val) => {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, countedQty: val } : i))
  }

  const submitCount = (apply = false) => {
    const filledItems = items.map(i => ({
      ...i,
      countedQty: i.countedQty === '' ? i.systemQty : parseFloat(i.countedQty),
      variance: (i.countedQty === '' ? 0 : parseFloat(i.countedQty)) - i.systemQty,
    }))

    const record = {
      id: genId(),
      date,
      store: countStore,
      items: filledItems,
      countedBy: user.name,
      applied: apply,
      createdAt: new Date().toISOString(),
    }

    const allCounts = load(KEYS.STOCK_COUNTS)
    save(KEYS.STOCK_COUNTS, [...allCounts, record])
    setCounts([...allCounts, record])

    if (apply) {
      const allProds = load(KEYS.PRODUCTS)
      const updated = allProds.map(p => {
        const item = filledItems.find(i => i.productId === p.id)
        return item ? { ...p, stock: item.countedQty } : p
      })
      save(KEYS.PRODUCTS, updated)
      setProducts(updated)
    }

    setView('list')
    setItems([])
    setApplyConfirm(false)
  }

  const variantItems = items.filter(i => i.countedQty !== '' && parseFloat(i.countedQty) !== i.systemQty)
  const totalVariance = items.reduce((s, i) => {
    if (i.countedQty === '') return s
    return s + (parseFloat(i.countedQty) - i.systemQty)
  }, 0)

  if (view === 'detail' && selected) {
    const varItems = selected.items.filter(i => i.variance !== 0)
    return (
      <Shell title="Stock Count Details" subtitle={`${fmtDate(selected.date)} — ${selected.store}`} onBack={() => { setSelected(null); setView('list') }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'Date', value: fmtDate(selected.date) },
            { label: 'Store', value: selected.store, capitalize: true },
            { label: 'Counted by', value: selected.countedBy },
            { label: 'Stock applied', value: selected.applied ? '✅ Yes' : '❌ No' },
            { label: 'Items with variance', value: varItems.length },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>{s.label}</p>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', textTransform: s.capitalize ? 'capitalize' : 'none' }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Product', 'Unit', 'System Qty', 'Counted', 'Variance'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.items.map((item, i) => (
                <tr key={item.productId} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: item.variance !== 0 ? 'rgba(220,38,38,0.05)' : 'transparent' }}>
                  <td style={{ padding: '11px 14px', fontWeight: item.variance !== 0 ? '700' : '400' }}>{item.name}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{item.unit}</td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{item.systemQty}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700' }}>{item.countedQty}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: item.variance > 0 ? '#4ade80' : item.variance < 0 ? '#dc2626' : '#64748b' }}>
                    {item.variance > 0 ? `+${item.variance}` : item.variance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Shell>
    )
  }

  if (view === 'count') {
    return (
      <Shell title="Stock Count" subtitle={`${countStore} — ${fmtDate(date)}`} onBack={() => setView('list')}>
        {applyConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>Apply Stock Adjustments?</h3>
              <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '14px' }}>
                This will update {variantItems.length} product stock levels to the counted quantities.
              </p>
              <p style={{ color: '#f59e0b', margin: '0 0 24px', fontSize: '13px' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => submitCount(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Save Only</button>
                <button onClick={() => submitCount(true)} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Apply & Save</button>
              </div>
              <button onClick={() => setApplyConfirm(false)} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Date:</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
          <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '8px' }}>{items.length} products &nbsp;|&nbsp; {variantItems.length} with variance</span>
          {totalVariance !== 0 && <span style={{ color: totalVariance > 0 ? '#4ade80' : '#dc2626', fontWeight: '700', fontSize: '13px' }}>Net variance: {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(2)}</span>}
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Product', 'Unit', 'System Qty', 'Counted Qty', 'Variance'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const counted = item.countedQty === '' ? null : parseFloat(item.countedQty)
                const variance = counted !== null ? counted - item.systemQty : null
                return (
                  <tr key={item.productId} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: variance !== null && variance !== 0 ? 'rgba(220,38,38,0.05)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.name}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.unit}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{item.systemQty}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="number"
                        step="0.1"
                        value={item.countedQty}
                        onChange={e => updateCounted(item.productId, e.target.value)}
                        placeholder={String(item.systemQty)}
                        style={{ width: '90px', padding: '6px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '14px', outline: 'none' }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: variance === null ? '#64748b' : variance > 0 ? '#4ade80' : variance < 0 ? '#dc2626' : '#64748b' }}>
                      {variance === null ? '—' : variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('list')} style={{ flex: 1, padding: '13px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
          <button onClick={() => submitCount(false)} style={{ flex: 1, padding: '13px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: '700' }}>Save Count</button>
          <button onClick={() => setApplyConfirm(true)} style={{ flex: 1, padding: '13px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', cursor: 'pointer', fontWeight: '800' }}>Save & Apply</button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Stock Count" onBack={onBack}>
      {/* Start count form */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }} />
        </div>
        {user.store === 'both' && (
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Store</label>
            <select value={countStore} onChange={e => setCountStore(e.target.value)} style={{ padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px' }}>
              <option value="butchery">Butchery</option>
              <option value="bottle">Bottle Store</option>
              <option value="both">Both Stores</option>
            </select>
          </div>
        )}
        <button onClick={startCount} style={{ padding: '10px 20px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
          Start New Count
        </button>
      </div>

      {/* History */}
      {counts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>⚖️</p>
          <p>No stock counts yet. Start a new count above.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Date', 'Store', 'Products', 'Variances', 'Counted By', 'Applied', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...counts].reverse().map((c, i) => {
                const varCount = c.items.filter(it => it.variance !== 0).length
                return (
                  <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{fmtDate(c.date)}</td>
                    <td style={{ padding: '11px 14px', textTransform: 'capitalize' }}>{c.store}</td>
                    <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{c.items.length}</td>
                    <td style={{ padding: '11px 14px', color: varCount > 0 ? '#f59e0b' : '#4ade80', fontWeight: '700' }}>{varCount}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{c.countedBy}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: c.applied ? '#14532d33' : '#1e293b', color: c.applied ? '#4ade80' : '#64748b', fontSize: '11px' }}>
                        {c.applied ? 'Applied' : 'Saved only'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={() => { setSelected(c); setView('detail') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
