import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, fmtDate, today, logActivity } from '../data'

export default function StockManufacturing({ user, onBack }) {
  const [records, setRecords] = useState([])
  const [products, setProducts] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ outputName: '', outputProductId: '', outputQty: '', outputUnit: 'kg', outputPrice: '', date: today(), notes: '', batchRef: '' })
  const [inputs, setInputs] = useState([])
  const [inputForm, setInputForm] = useState({ productId: '', qty: '', unit: 'kg' })

  useEffect(() => {
    setRecords(load(KEYS.MANUFACTURING))
    setProducts(load(KEYS.PRODUCTS).filter(p => p.active))
  }, [])

  const outputProd = products.find(p => p.id === form.outputProductId)
  const totalInputCost = inputs.reduce((s, i) => {
    const p = products.find(x => x.id === i.productId)
    return s + i.qty * (p?.costPrice || 0)
  }, 0)
  const outputValue = parseFloat(form.outputQty || 0) * parseFloat(form.outputPrice || outputProd?.price || 0)
  const grossProfit = outputValue - totalInputCost
  const marginPct = totalInputCost > 0 ? ((grossProfit / totalInputCost) * 100).toFixed(1) : 0

  const addInput = () => {
    const prod = products.find(p => p.id === inputForm.productId)
    if (!prod) { alert('Select an input product'); return }
    if (!inputForm.qty || parseFloat(inputForm.qty) <= 0) { alert('Enter valid quantity'); return }
    if (parseFloat(inputForm.qty) > prod.stock) { alert(`Insufficient stock. Available: ${prod.stock} ${prod.unit}`); return }
    setInputs(prev => [...prev, { productId: prod.id, name: prod.name, qty: parseFloat(inputForm.qty), unit: inputForm.unit || prod.unit, costPrice: prod.costPrice, total: parseFloat(inputForm.qty) * prod.costPrice }])
    setInputForm({ productId: '', qty: '', unit: 'kg' })
  }

  const submitManufacture = () => {
    if (!form.outputName.trim() && !form.outputProductId) { alert('Enter output product name or select from inventory'); return }
    if (!form.outputQty || parseFloat(form.outputQty) <= 0) { alert('Enter output quantity'); return }
    if (inputs.length === 0) { alert('Add at least one input material'); return }

    const record = {
      id: genId(), date: form.date, batchRef: form.batchRef || `MFG-${Date.now()}`,
      outputProductId: form.outputProductId || null,
      outputName: outputProd ? outputProd.name : form.outputName,
      outputQty: parseFloat(form.outputQty), outputUnit: form.outputUnit,
      outputPrice: parseFloat(form.outputPrice) || outputProd?.price || 0,
      outputValue, inputs, totalInputCost, grossProfit,
      marginPct: parseFloat(marginPct), notes: form.notes,
      processedBy: user.name, createdAt: new Date().toISOString(),
    }

    save(KEYS.MANUFACTURING, [...load(KEYS.MANUFACTURING), record])
    setRecords(load(KEYS.MANUFACTURING))

    const allProds = load(KEYS.PRODUCTS)
    const updated = allProds.map(p => {
      const input = inputs.find(i => i.productId === p.id)
      if (input) return { ...p, stock: Math.max(0, p.stock - input.qty) }
      if (p.id === form.outputProductId) return { ...p, stock: p.stock + parseFloat(form.outputQty) }
      return p
    })
    save(KEYS.PRODUCTS, updated)
    setProducts(updated.filter(p => p.active))

    logActivity(user, 'MANUFACTURING', { output: record.outputName, qty: record.outputQty, grossProfit })
    setView('list')
    setForm({ outputName: '', outputProductId: '', outputQty: '', outputUnit: 'kg', outputPrice: '', date: today(), notes: '', batchRef: '' })
    setInputs([])
  }

  if (view === 'detail' && selected) {
    return (
      <Shell title="Manufacturing Record" subtitle={`${selected.outputName} — ${fmtDate(selected.date)}`} onBack={() => { setSelected(null); setView('list') }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Batch Summary</h3>
            {[
              ['Date', fmtDate(selected.date)],
              ['Batch Ref', selected.batchRef],
              ['Processed by', selected.processedBy],
              ['Output product', selected.outputName],
              ['Output qty', `${selected.outputQty} ${selected.outputUnit}`],
              ['Selling price/unit', R(selected.outputPrice)],
              ['Output value', R(selected.outputValue)],
              ['Input cost', R(selected.totalInputCost)],
              ['Gross profit', R(selected.grossProfit)],
              ['Margin %', `${selected.marginPct}%`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f172a', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <strong style={{ color: label === 'Gross profit' ? (selected.grossProfit >= 0 ? '#4ade80' : '#dc2626') : label === 'Margin %' ? (selected.marginPct >= 20 ? '#4ade80' : '#f59e0b') : 'white' }}>{val}</strong>
              </div>
            ))}
            {selected.notes && <p style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>Notes: {selected.notes}</p>}
          </div>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Input Materials</h3>
            {selected.inputs.map((inp, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #0f172a', fontSize: '13px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600' }}>{inp.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{inp.qty} {inp.unit} × {R(inp.costPrice)}</p>
                </div>
                <span style={{ fontWeight: '700', color: '#f59e0b' }}>{R(inp.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </Shell>
    )
  }

  if (view === 'new') {
    return (
      <Shell title="New Manufacturing Batch" onBack={() => setView('list')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Output Product</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Link to Inventory (optional)</label>
                <select value={form.outputProductId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value)
                  setForm(f => ({ ...f, outputProductId: e.target.value, outputName: p ? p.name : '', outputPrice: p ? String(p.price) : '' }))
                }}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="">Not in inventory</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {!form.outputProductId && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                  <input type="text" value={form.outputName} onChange={e => setForm(f => ({ ...f, outputName: e.target.value }))} placeholder="e.g. Boerewors, Seasoned Mince, Pap..."
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Output Qty *</label>
                  <input type="number" step="0.1" value={form.outputQty} onChange={e => setForm(f => ({ ...f, outputQty: e.target.value }))} placeholder="0.0"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unit</label>
                  <select value={form.outputUnit} onChange={e => setForm(f => ({ ...f, outputUnit: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box' }}>
                    {['kg', 'each', 'pack', 'litre'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Selling Price/unit (R)</label>
                  <input type="number" step="0.01" value={form.outputPrice} onChange={e => setForm(f => ({ ...f, outputPrice: e.target.value }))} placeholder="0.00"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Batch Reference</label>
                <input type="text" value={form.batchRef} onChange={e => setForm(f => ({ ...f, batchRef: e.target.value }))} placeholder="e.g. MFG-001, Boeries-June..."
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..."
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Add Input Material</h3>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Input Product *</label>
                <select value={inputForm.productId} onChange={e => {
                  const p = products.find(x => x.id === e.target.value)
                  setInputForm(f => ({ ...f, productId: e.target.value, unit: p?.unit || 'kg' }))
                }}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock} {p.unit})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qty Used *</label>
                  <input type="number" step="0.1" value={inputForm.qty} onChange={e => setInputForm(f => ({ ...f, qty: e.target.value }))} placeholder="0.0"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unit</label>
                  <input type="text" value={inputForm.unit} onChange={e => setInputForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              <button onClick={addInput} style={{ width: '100%', padding: '10px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>+ Add Input</button>
            </div>
          </div>

          <div>
            {(totalInputCost > 0 || form.outputQty) && (
              <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>P&L Preview</h3>
                {[
                  { label: 'Output qty', value: `${form.outputQty || 0} ${form.outputUnit}`, color: '#00C4A0' },
                  { label: 'Input cost', value: R(totalInputCost), color: '#f59e0b' },
                  { label: 'Output value (sell)', value: R(outputValue), color: '#00C4A0' },
                  { label: 'Gross profit', value: R(grossProfit), color: grossProfit >= 0 ? '#4ade80' : '#dc2626' },
                  { label: 'Margin %', value: `${marginPct}%`, color: parseFloat(marginPct) >= 20 ? '#4ade80' : '#f59e0b' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #0f172a', fontSize: '13px' }}>
                    <span style={{ color: '#94a3b8' }}>{r.label}</span>
                    <strong style={{ color: r.color }}>{r.value}</strong>
                  </div>
                ))}
              </div>
            )}

            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Inputs ({inputs.length})</h3>
              {inputs.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', margin: '30px 0' }}>No inputs added</p>
              ) : (
                <>
                  {inputs.map((inp, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>{inp.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{inp.qty} {inp.unit} × {R(inp.costPrice)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '700', color: '#f59e0b', fontSize: '13px' }}>{R(inp.total)}</span>
                        <button onClick={() => setInputs(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={submitManufacture} style={{ width: '100%', marginTop: '16px', padding: '14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
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
    <Shell title="Stock Manufacturing" subtitle="In-house production tracking" onBack={onBack} actions={
      <button onClick={() => setView('new')} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + New Batch
      </button>
    }>
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🏭</p>
          <p>No manufacturing records yet. Use this to track in-house production: boerewors, seasoned mince, pap, etc.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Date', 'Batch Ref', 'Output Product', 'Output Qty', 'Input Cost', 'Revenue', 'Gross Profit', 'Margin', 'By', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...records].reverse().map((rec, i) => (
                <tr key={rec.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{fmtDate(rec.date)}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{rec.batchRef}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '600' }}>{rec.outputName}</td>
                  <td style={{ padding: '11px 14px' }}>{rec.outputQty} {rec.outputUnit}</td>
                  <td style={{ padding: '11px 14px', color: '#f59e0b' }}>{R(rec.totalInputCost)}</td>
                  <td style={{ padding: '11px 14px', color: '#00C4A0' }}>{R(rec.outputValue)}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: rec.grossProfit >= 0 ? '#4ade80' : '#dc2626' }}>{R(rec.grossProfit)}</td>
                  <td style={{ padding: '11px 14px', color: rec.marginPct >= 20 ? '#4ade80' : '#f59e0b' }}>{rec.marginPct}%</td>
                  <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '12px' }}>{rec.processedBy}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => { setSelected(rec); setView('detail') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>View</button>
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
