import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, fmtDateTime, today, logActivity } from '../data'

export default function StockCount({ user, onBack }) {
  const [counts, setCounts] = useState([])
  const [products, setProducts] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [countStore, setCountStore] = useState(user.store === 'both' ? 'butchery' : user.store)
  const [date, setDate] = useState(today())
  const [items, setItems] = useState([])
  const [applyConfirm, setApplyConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [ownerPwd, setOwnerPwd] = useState('')
  const [ownerPwdErr, setOwnerPwdErr] = useState('')
  const isOwner = user.role === 'owner'

  useEffect(() => {
    setCounts(load(KEYS.STOCK_COUNTS))
    setProducts(load(KEYS.PRODUCTS))
  }, [])

  const startCount = () => {
    const storeProds = products.filter(p => p.active && (countStore === 'both' || p.store === countStore))
    setItems(storeProds.map(p => ({ productId: p.id, name: p.name, unit: p.unit, systemQty: p.stock, countedQty: '' })))
    setView('count')
    logActivity(user, 'STOCK_COUNT_START', { store: countStore, date })
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
    const record = { id: genId(), date, store: countStore, items: filledItems, countedBy: user.name, applied: apply, locked: true, createdAt: new Date().toISOString() }
    const allCounts = load(KEYS.STOCK_COUNTS)
    save(KEYS.STOCK_COUNTS, [...allCounts, record])
    setCounts([...allCounts, record])

    if (apply) {
      const allProds = load(KEYS.PRODUCTS)
      save(KEYS.PRODUCTS, allProds.map(p => {
        const item = filledItems.find(i => i.productId === p.id)
        return item ? { ...p, stock: item.countedQty } : p
      }))
      setProducts(load(KEYS.PRODUCTS))
    }

    logActivity(user, 'STOCK_COUNT_SUBMIT', { store: countStore, date, applied: apply, items: filledItems.length })
    setView('list')
    setItems([])
    setApplyConfirm(false)
  }

  const verifyOwner = (cb) => {
    const users = load(KEYS.USERS)
    const owner = users.find(u => u.password === ownerPwd && u.role === 'owner' && u.active !== false)
    if (owner) { setOwnerPwd(''); setOwnerPwdErr(''); cb() }
    else { setOwnerPwdErr('Incorrect owner password') }
  }

  const deleteCount = (id) => {
    const updated = load(KEYS.STOCK_COUNTS).filter(c => c.id !== id)
    save(KEYS.STOCK_COUNTS, updated)
    setCounts(updated)
    logActivity(user, 'STOCK_COUNT_DELETE', { id })
    setDeleteConfirm(null)
    setSelected(null)
    setView('list')
  }

  const applyCount = (count) => {
    const allProds = load(KEYS.PRODUCTS)
    save(KEYS.PRODUCTS, allProds.map(p => {
      const item = count.items.find(i => i.productId === p.id)
      return item ? { ...p, stock: item.countedQty } : p
    }))
    const updated = load(KEYS.STOCK_COUNTS).map(c => c.id === count.id ? { ...c, applied: true } : c)
    save(KEYS.STOCK_COUNTS, updated)
    setCounts(updated)
    setSelected({ ...count, applied: true })
    logActivity(user, 'STOCK_COUNT_APPLY', { id: count.id, date: count.date })
    alert('Stock levels updated from this count.')
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const varItems = selected.items.filter(i => i.variance !== 0)
    return (
      <Shell title="Stock Count Details" subtitle={`${fmtDate(selected.date)} — ${selected.store}`} onBack={() => { setSelected(null); setView('list') }}>
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '100%' }}>
              <h3 style={{ margin: '0 0 12px', color: '#dc2626' }}>Delete Stock Count</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px' }}>This will permanently delete the count for <strong style={{ color: 'white' }}>{fmtDate(selected.date)}</strong>. Enter owner password to confirm.</p>
              <input type="password" value={ownerPwd} onChange={e => { setOwnerPwd(e.target.value); setOwnerPwdErr('') }} placeholder="Owner password"
                style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: `1px solid ${ownerPwdErr ? '#dc2626' : '#334155'}`, borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none', marginBottom: '6px' }} />
              {ownerPwdErr && <p style={{ color: '#dc2626', fontSize: '12px', margin: '0 0 10px' }}>{ownerPwdErr}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => { setDeleteConfirm(null); setOwnerPwd(''); setOwnerPwdErr('') }} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => verifyOwner(() => deleteCount(deleteConfirm))} style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '800', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Date', value: fmtDate(selected.date) },
            { label: 'Store', value: selected.store, cap: true },
            { label: 'Counted by', value: selected.countedBy },
            { label: 'Applied', value: selected.applied ? '✅ Yes' : '❌ No' },
            { label: 'Items with variance', value: varItems.length, color: varItems.length > 0 ? '#f59e0b' : '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>{s.label}</p>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', textTransform: s.cap ? 'capitalize' : 'none', color: s.color || 'white' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {isOwner && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {!selected.applied && <button onClick={() => applyCount(selected)} style={{ padding: '9px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Apply to Stock</button>}
            <button onClick={() => setDeleteConfirm(selected.id)} style={{ padding: '9px 16px', backgroundColor: 'transparent', border: '1px solid #dc2626', borderRadius: '8px', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Delete Count</button>
          </div>
        )}

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Product', 'Unit', 'System Qty', 'Counted', 'Variance', 'Value Variance'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.items.map((item, i) => {
                const prod = products.find(p => p.id === item.productId)
                const valueVar = item.variance * (prod?.price || 0)
                return (
                  <tr key={item.productId} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: item.variance !== 0 ? 'rgba(220,38,38,0.05)' : 'transparent' }}>
                    <td style={{ padding: '11px 14px', fontWeight: item.variance !== 0 ? '700' : '400' }}>{item.name}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{item.unit}</td>
                    <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{item.systemQty}</td>
                    <td style={{ padding: '11px 14px', fontWeight: '700' }}>{item.countedQty}</td>
                    <td style={{ padding: '11px 14px', fontWeight: '700', color: item.variance > 0 ? '#4ade80' : item.variance < 0 ? '#dc2626' : '#64748b' }}>
                      {item.variance > 0 ? `+${item.variance}` : item.variance}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: valueVar < 0 ? '#dc2626' : valueVar > 0 ? '#4ade80' : '#64748b' }}>
                      {valueVar !== 0 ? R(valueVar) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {varItems.length > 0 && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', marginTop: '12px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>VARIANCE SUMMARY</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {[
                { label: 'Items short', value: varItems.filter(i => i.variance < 0).length, color: '#dc2626' },
                { label: 'Items over', value: varItems.filter(i => i.variance > 0).length, color: '#4ade80' },
                { label: 'Total value loss', value: R(Math.abs(varItems.filter(i => i.variance < 0).reduce((s, i) => { const p = products.find(x => x.id === i.productId); return s + i.variance * (p?.price || 0) }, 0))), color: '#dc2626' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '16px', color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Shell>
    )
  }

  // ── Count entry view ─────────────────────────────────────────────────────
  if (view === 'count') {
    const filledCount = items.filter(i => i.countedQty !== '').length
    return (
      <Shell title="Stock Count" subtitle={`${countStore} — ${fmtDate(date)} — ${filledCount}/${items.length} entered`} onBack={() => setView('list')}>
        {applyConfirm && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>Save & Submit Count</h3>
              <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: '14px' }}>
                {filledCount} of {items.length} products counted. Variance will only be visible in the report — not during counting.
              </p>
              <p style={{ color: '#f59e0b', margin: '0 0 24px', fontSize: '13px' }}>Apply to stock will update live inventory levels. This cannot be undone.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => submitCount(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Save Only</button>
                <button onClick={() => submitCount(true)} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Apply & Save</button>
              </div>
              <button onClick={() => setApplyConfirm(false)} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#fef3c7', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
            🔒 Blind count in progress — system quantities and variances are hidden to ensure accuracy. Enter only what you physically count.
          </p>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Date:</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
          <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: '8px' }}>{items.length} products &nbsp;|&nbsp; {filledCount} entered</span>
        </div>

        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Product', 'Unit', 'Count Qty'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.productId} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', backgroundColor: item.countedQty !== '' ? 'rgba(0,196,160,0.04)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.unit}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <input type="number" step="0.1" value={item.countedQty} onChange={e => updateCounted(item.productId, e.target.value)}
                      placeholder="Enter count..."
                      style={{ width: '110px', padding: '7px 10px', backgroundColor: item.countedQty !== '' ? 'rgba(0,196,160,0.1)' : '#0f172a', border: `1px solid ${item.countedQty !== '' ? '#00C4A0' : '#334155'}`, borderRadius: '6px', color: 'white', fontSize: '14px', outline: 'none' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setView('list')} style={{ flex: 1, padding: '13px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
          <button onClick={() => setApplyConfirm(true)} style={{ flex: 2, padding: '13px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', cursor: 'pointer', fontWeight: '800' }}>Submit Count →</button>
        </div>
      </Shell>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <Shell title="Stock Count" onBack={onBack}>
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
                {['Date', 'Store', 'Products', 'Counted By', 'Applied', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...counts].reverse().map((c, i) => (
                <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{fmtDate(c.date)}</td>
                  <td style={{ padding: '11px 14px', textTransform: 'capitalize' }}>{c.store}</td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{c.items.length}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{c.countedBy}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: c.applied ? '#14532d33' : '#1e293b', color: c.applied ? '#4ade80' : '#64748b', fontSize: '11px' }}>
                      {c.applied ? 'Applied' : 'Saved only'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => { setSelected(c); setView('detail') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>
                      {isOwner ? 'View & Manage' : 'View Report'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: '#475569', fontSize: '12px', marginTop: '12px' }}>
        🔒 Variances are hidden during counting to prevent bias. View the report after submitting.
        {isOwner ? ' As owner you can apply or delete counts from the detail view.' : ''}
      </p>
    </Shell>
  )
}
