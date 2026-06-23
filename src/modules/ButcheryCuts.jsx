import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, today, logActivity } from '../data'

export default function ButcheryCuts({ user, onBack }) {
  const [records, setRecords] = useState([])
  const [products, setProducts] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [rawProduct, setRawProduct] = useState('')
  const [rawWeight, setRawWeight] = useState('')
  const [date, setDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [cuts, setCuts] = useState([])
  const [cutForm, setCutForm] = useState({ productId: '', name: '', weight: '', sellingPrice: '' })
  const [rawCostPerKg, setRawCostPerKg] = useState('')
  const [activeTab, setActiveTab] = useState('cuts')

  useEffect(() => {
    setRecords(load(KEYS.BUTCHERY))
    setProducts(load(KEYS.PRODUCTS).filter(p => p.active && p.store === 'butchery'))
  }, [])

  const raw = rawWeight ? parseFloat(rawWeight) : 0
  const processedWeight = cuts.reduce((s, c) => s + c.weight, 0)
  const wastageWeight = Math.max(0, raw - processedWeight)
  const yieldPct = raw > 0 ? ((processedWeight / raw) * 100).toFixed(1) : 0

  const rawCostPKg = parseFloat(rawCostPerKg) || 0
  const totalRawCost = raw * rawCostPKg
  const cutsRevenue = cuts.reduce((s, c) => s + c.weight * (c.sellingPrice || 0), 0)
  const wastageValue = wastageWeight * rawCostPKg
  const grossProfit = cutsRevenue - totalRawCost
  const marginPct = totalRawCost > 0 ? ((grossProfit / totalRawCost) * 100).toFixed(1) : 0

  const addCut = () => {
    if (!cutForm.weight || parseFloat(cutForm.weight) <= 0) { alert('Enter a valid weight'); return }
    if (!cutForm.name.trim() && !cutForm.productId) { alert('Enter a cut name or select a product'); return }
    const prod = products.find(p => p.id === cutForm.productId)
    const newCut = {
      productId: cutForm.productId || null,
      name: prod ? prod.name : cutForm.name,
      weight: parseFloat(cutForm.weight),
      sellingPrice: parseFloat(cutForm.sellingPrice) || (prod ? prod.price : 0),
    }
    setCuts(prev => [...prev, newCut])
    setCutForm({ productId: '', name: '', weight: '', sellingPrice: '' })
  }

  const submitRecord = () => {
    const rawProd = products.find(p => p.id === rawProduct)
    if (!rawProd) { alert('Select the raw material product'); return }
    if (!raw || raw <= 0) { alert('Enter raw material weight'); return }
    if (raw > rawProd.stock) { alert(`Insufficient stock. Available: ${rawProd.stock}kg`); return }
    if (cuts.length === 0) { alert('Add at least one cut'); return }

    const record = {
      id: genId(),
      date,
      notes,
      rawProductId: rawProd.id,
      rawProductName: rawProd.name,
      rawWeight: raw,
      rawCostPerKg: rawCostPKg,
      totalRawCost,
      cuts,
      processedWeight,
      wastageWeight,
      wastageValue,
      yieldPct: parseFloat(yieldPct),
      cutsRevenue,
      grossProfit,
      marginPct: parseFloat(marginPct),
      processedBy: user.name,
      createdAt: new Date().toISOString(),
    }
    logActivity(user, 'BUTCHERY_CUTS', { rawProduct: rawProd.name, rawWeight: raw, yieldPct, grossProfit })

    const allRecords = load(KEYS.BUTCHERY)
    save(KEYS.BUTCHERY, [...allRecords, record])
    setRecords([...allRecords, record])

    const allProds = load(KEYS.PRODUCTS)
    const updated = allProds.map(p => {
      if (p.id === rawProd.id) return { ...p, stock: Math.max(0, p.stock - raw) }
      const cut = cuts.find(c => c.productId === p.id)
      if (cut) return { ...p, stock: p.stock + cut.weight }
      return p
    })
    save(KEYS.PRODUCTS, updated)
    setProducts(updated.filter(p => p.active && p.store === 'butchery'))

    setView('list')
    setRawProduct('')
    setRawWeight('')
    setDate(today())
    setNotes('')
    setCuts([])
  }

  if (view === 'detail' && selected) {
    return (
      <Shell title="Processing Record" subtitle={`${selected.rawProductName} — ${fmtDate(selected.date)}`} onBack={() => { setSelected(null); setView('list') }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Summary</h3>
            {[
              ['Date', fmtDate(selected.date)],
              ['Processed by', selected.processedBy],
              ['Raw material', selected.rawProductName],
              ['Raw weight in', `${selected.rawWeight}kg`],
              ['Processed weight', `${selected.processedWeight}kg`],
              ['Wastage', `${selected.wastageWeight.toFixed(2)}kg`],
              ['Yield', `${selected.yieldPct}%`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <strong style={{ color: label === 'Yield' ? (selected.yieldPct >= 75 ? '#4ade80' : '#f59e0b') : 'white' }}>{val}</strong>
              </div>
            ))}
            {selected.notes && <p style={{ marginTop: '14px', fontSize: '13px', color: '#94a3b8' }}>Notes: {selected.notes}</p>}
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Cuts Produced</h3>
            {selected.cuts.map((cut, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0f172a', fontSize: '14px' }}>
                <span style={{ fontWeight: '600' }}>{cut.name}</span>
                <span style={{ color: '#00C4A0', fontWeight: '700' }}>{cut.weight}kg</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #334155', fontWeight: '800' }}>
              <span style={{ color: '#64748b' }}>Total cuts</span>
              <span style={{ color: '#00C4A0' }}>{selected.processedWeight}kg</span>
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  if (view === 'new') {
    const selectedRawProd = products.find(p => p.id === rawProduct)
    return (
      <Shell title="New Processing Record" onBack={() => setView('list')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Left: Input */}
          <div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Raw Material</h3>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Select Raw Product *</label>
                <select value={rawProduct} onChange={e => setRawProduct(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock}kg)</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Raw Weight (kg) *</label>
                <input type="number" step="0.1" value={rawWeight} onChange={e => setRawWeight(e.target.value)} placeholder="0.0"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                {selectedRawProd && <p style={{ margin: '6px 0 0', fontSize: '12px', color: raw > selectedRawProd.stock ? '#dc2626' : '#64748b' }}>Available: {selectedRawProd.stock}kg</p>}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Carcass Cost Price (R/kg)</label>
                <input type="number" step="0.01" value={rawCostPerKg} onChange={e => setRawCostPerKg(e.target.value)} placeholder="e.g. 45.00"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                {rawCostPKg > 0 && raw > 0 && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' }}>Total carcass cost: {R(totalRawCost)}</p>}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional..."
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            {/* Add cut */}
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Add Cut</h3>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Link to Product (optional)</label>
                <select value={cutForm.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value)
                  setCutForm(f => ({ ...f, productId: e.target.value, name: p ? p.name : '' }))
                }}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="">No product link</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cut Name *</label>
                <input type="text" value={cutForm.name} onChange={e => setCutForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. T-Bone, Fillet..."
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Weight (kg) *</label>
                  <input type="number" step="0.1" value={cutForm.weight} onChange={e => setCutForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.0"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Selling Price (R/kg)</label>
                  <input type="number" step="0.01" value={cutForm.sellingPrice} onChange={e => setCutForm(f => ({ ...f, sellingPrice: e.target.value }))} placeholder="0.00"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              <button onClick={addCut} style={{ width: '100%', padding: '10px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                + Add Cut
              </button>
            </div>
          </div>

          {/* Right: Summary + Cuts */}
          <div>
            {/* Yield summary */}
            {raw > 0 && (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Yield Summary</h3>
                {[
                  { label: 'Raw weight in', value: `${raw}kg`, color: 'white' },
                  { label: 'Processed (cuts)', value: `${processedWeight.toFixed(2)}kg`, color: '#00C4A0' },
                  { label: 'Wastage', value: `${wastageWeight.toFixed(2)}kg (${R(wastageValue)})`, color: wastageWeight > raw * 0.3 ? '#dc2626' : '#f59e0b' },
                  { label: 'Yield %', value: `${yieldPct}%`, color: parseFloat(yieldPct) >= 75 ? '#4ade80' : '#f59e0b' },
                  ...(rawCostPKg > 0 ? [
                    { label: 'Total carcass cost', value: R(totalRawCost), color: '#f59e0b' },
                    { label: 'Cuts revenue (sell)', value: R(cutsRevenue), color: '#00C4A0' },
                    { label: 'Gross profit', value: R(grossProfit), color: grossProfit >= 0 ? '#4ade80' : '#dc2626' },
                    { label: 'Margin %', value: `${marginPct}%`, color: parseFloat(marginPct) >= 20 ? '#4ade80' : '#f59e0b' },
                  ] : []),
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a', fontSize: '14px' }}>
                    <span style={{ color: '#94a3b8' }}>{r.label}</span>
                    <strong style={{ color: r.color }}>{r.value}</strong>
                  </div>
                ))}
                {/* Yield bar */}
                <div style={{ marginTop: '12px', backgroundColor: '#0f172a', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, yieldPct)}%`, backgroundColor: parseFloat(yieldPct) >= 75 ? '#4ade80' : '#f59e0b', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Cuts list */}
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Cuts ({cuts.length})</h3>
              {cuts.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', margin: '30px 0', fontSize: '14px' }}>No cuts added yet</p>
              ) : (
                <>
                  {cuts.map((cut, i) => {
                    const cutRevenue = cut.weight * (cut.sellingPrice || 0)
                    const cutCost = cut.weight * rawCostPKg
                    const cutGP = cutRevenue - cutCost
                    return (
                      <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{cut.name}</p>
                            {cut.productId && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Linked to inventory</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: '700', color: '#00C4A0' }}>{cut.weight}kg</span>
                            <button onClick={() => setCuts(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                          </div>
                        </div>
                        {cut.sellingPrice > 0 && (
                          <p style={{ margin: '3px 0 0', fontSize: '11px', color: cutGP >= 0 ? '#4ade80' : '#dc2626' }}>
                            Sell: {R(cutRevenue)} | GP: {R(cutGP)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  <button onClick={submitRecord} style={{ width: '100%', marginTop: '16px', padding: '14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                    Submit & Update Stock
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
    <Shell title="Butchery Cuts" subtitle="Processing & yield tracking" onBack={onBack} actions={
      <button onClick={() => setView('new')} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + New Record
      </button>
    }>
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🥩</p>
          <p>No processing records yet. Click "New Record" to log a butchery cut.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Date', 'Raw Material', 'Raw Weight', 'Cuts', 'Yield', 'Wastage', 'Processed By', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...records].reverse().map((rec, i) => (
                <tr key={rec.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{fmtDate(rec.date)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>{rec.rawProductName}</td>
                  <td style={{ padding: '12px 14px' }}>{rec.rawWeight}kg</td>
                  <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{rec.cuts.length} cuts</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: rec.yieldPct >= 75 ? '#4ade80' : '#f59e0b' }}>{rec.yieldPct}%</td>
                  <td style={{ padding: '12px 14px', color: '#f59e0b' }}>{rec.wastageWeight.toFixed(2)}kg</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{rec.processedBy}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => { setSelected(rec); setView('detail') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
