import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, R, today } from '../data'

const monthStart = (offset = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() + offset, 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}
const monthEnd = (offset = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() + offset + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d.toISOString().slice(0, 10)
}

export default function FCReport({ user, onBack }) {
  const [from, setFrom] = useState(monthStart(0))
  const [to, setTo] = useState(today())
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)
  const [targetFC, setTargetFC] = useState('35')
  const [manualOpening, setManualOpening] = useState('')
  const [data, setData] = useState(null)

  const calculate = () => {
    const products = load(KEYS.PRODUCTS).filter(p => storeFilter === 'all' || p.store === storeFilter)
    const sales = load(KEYS.SALES).filter(s => {
      const d = s.date.slice(0, 10)
      return d >= from && d <= to && (storeFilter === 'all' || s.store === storeFilter)
    })
    const grvs = load(KEYS.GRV).filter(g => {
      const d = g.date
      return d >= from && d <= to && (storeFilter === 'all' || g.store === storeFilter)
    })
    const wastage = load(KEYS.WASTAGE).filter(w => {
      const d = w.date
      return d >= from && d <= to && (storeFilter === 'all' || w.store === storeFilter)
    })

    const revenue = sales.reduce((s, x) => s + x.total, 0)
    const purchases = grvs.reduce((s, g) => s + g.totalCost, 0)
    const closingStockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const wastageValue = wastage.reduce((s, w) => s + w.totalCost, 0)

    const openingStockValue = manualOpening !== '' ? parseFloat(manualOpening) : 0

    const cogs = openingStockValue + purchases - closingStockValue
    const grossProfit = revenue - cogs
    const fcPct = revenue > 0 ? (cogs / revenue) * 100 : 0
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0

    setData({
      revenue,
      purchases,
      openingStockValue,
      closingStockValue,
      wastageValue,
      cogs,
      grossProfit,
      fcPct,
      grossMarginPct,
      salesCount: sales.length,
      grvCount: grvs.length,
      wastageCount: wastage.length,
      products: products.length,
    })
  }

  useEffect(() => { calculate() }, [from, to, storeFilter, manualOpening])

  const fc = data?.fcPct || 0
  const target = parseFloat(targetFC) || 35
  const fcStatus = fc <= target ? 'good' : fc <= target * 1.15 ? 'warning' : 'over'
  const fcColor = fcStatus === 'good' ? '#4ade80' : fcStatus === 'warning' ? '#f59e0b' : '#dc2626'

  return (
    <Shell title="FC Report" subtitle="Food Cost Analysis" onBack={onBack}>
      {/* Controls */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>FROM</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>TO</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
          </div>
          {user.store === 'both' && (
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>STORE</label>
              <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px' }}>
                <option value="all">All Stores</option>
                <option value="butchery">Butchery</option>
                <option value="bottle">Bottle Store</option>
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>TARGET FC%</label>
            <input type="number" value={targetFC} onChange={e => setTargetFC(e.target.value)} placeholder="35" style={{ width: '80px', padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>OPENING STOCK (R)</label>
            <input type="number" value={manualOpening} onChange={e => setManualOpening(e.target.value)} placeholder="0 (auto)" style={{ width: '130px', padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['This Month', monthStart(0), today()], ['Last Month', monthStart(-1), monthEnd(-1)]].map(([label, f, t]) => (
              <button key={label} onClick={() => { setFrom(f); setTo(t) }} style={{ padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* FC% Hero */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Food Cost %</p>
            <p style={{ margin: '0 0 8px', fontSize: '72px', fontWeight: '900', color: fcColor, lineHeight: 1 }}>
              {fc.toFixed(1)}%
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Target: <strong style={{ color: '#94a3b8' }}>{targetFC}%</strong>
              &nbsp;|&nbsp;
              {fcStatus === 'good' ? <span style={{ color: '#4ade80' }}>✅ On target</span> : fcStatus === 'warning' ? <span style={{ color: '#f59e0b' }}>⚠️ Slightly over</span> : <span style={{ color: '#dc2626' }}>❌ Over target</span>}
            </p>
            {/* FC gauge bar */}
            <div style={{ position: 'relative', marginTop: '20px', backgroundColor: '#0f172a', borderRadius: '8px', height: '12px', overflow: 'visible' }}>
              <div style={{ height: '100%', width: `${Math.min(100, fc)}%`, backgroundColor: fcColor, borderRadius: '8px', transition: 'width 0.4s' }} />
              <div style={{ position: 'absolute', left: `${Math.min(99, target)}%`, top: '-4px', width: '2px', height: '20px', backgroundColor: '#fff', borderRadius: '2px', transform: 'translateX(-50%)' }} />
              <span style={{ position: 'absolute', left: `${Math.min(99, target)}%`, top: '20px', fontSize: '10px', color: '#94a3b8', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Target {target}%</span>
            </div>
          </div>

          {/* Calculation breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cost Calculation</h3>
              {[
                { label: 'Opening Stock Value', value: R(data.openingStockValue), note: manualOpening !== '' ? 'manual' : 'not set', color: '#94a3b8' },
                { label: '+ Purchases (GRVs)', value: R(data.purchases), note: `${data.grvCount} GRVs`, color: '#60a5fa' },
                { label: '− Closing Stock Value', value: R(data.closingStockValue), note: 'current inventory', color: '#a78bfa' },
                { label: '= Cost of Goods Sold', value: R(data.cogs), color: '#f59e0b', bold: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{row.label}</p>
                    {row.note && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{row.note}</p>}
                  </div>
                  <span style={{ fontWeight: row.bold ? '800' : '700', color: row.color, fontSize: row.bold ? '16px' : '14px' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue & Profit</h3>
              {[
                { label: 'Total Revenue (Sales)', value: R(data.revenue), note: `${data.salesCount} transactions`, color: '#00C4A0', bold: true },
                { label: '− Cost of Goods Sold', value: R(data.cogs), color: '#f59e0b' },
                { label: '= Gross Profit', value: R(data.grossProfit), color: data.grossProfit >= 0 ? '#4ade80' : '#dc2626', bold: true },
                { label: 'Gross Margin %', value: `${data.grossMarginPct.toFixed(1)}%`, color: '#4ade80', bold: true },
                { label: 'Wastage Cost (period)', value: R(data.wastageValue), note: `${data.wastageCount} records`, color: '#dc2626' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #0f172a' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{row.label}</p>
                    {row.note && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{row.note}</p>}
                  </div>
                  <span style={{ fontWeight: row.bold ? '800' : '700', color: row.color, fontSize: row.bold ? '16px' : '14px' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fc > target && (
                <div style={{ backgroundColor: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#fca5a5' }}>
                  ❌ Food cost is <strong>{(fc - target).toFixed(1)}%</strong> above target. Review purchasing costs, pricing, and wastage.
                </div>
              )}
              {data.wastageValue > data.revenue * 0.05 && (
                <div style={{ backgroundColor: '#78350f22', border: '1px solid #78350f', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#fcd34d' }}>
                  ⚠️ Wastage ({R(data.wastageValue)}) is over 5% of revenue. Investigate expiry management and portion control.
                </div>
              )}
              {data.grossProfit > 0 && fc <= target && (
                <div style={{ backgroundColor: '#14532d22', border: '1px solid #14532d', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#4ade80' }}>
                  ✅ Food cost is within target. Gross profit: {R(data.grossProfit)} ({data.grossMarginPct.toFixed(1)}% margin).
                </div>
              )}
              {data.openingStockValue === 0 && (
                <div style={{ backgroundColor: '#1e3a8a22', border: '1px solid #1e3a8a', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#93c5fd' }}>
                  ℹ️ Opening stock is set to R0. Enter an opening stock value above for a more accurate FC% calculation.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Shell>
  )
}
