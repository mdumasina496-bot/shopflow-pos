import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, R, fmtDate, today } from '../../data'

const startOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

const SUB_REPORTS = [
  { id: 'variance',     label: 'Stock Variance' },
  { id: 'gp',          label: 'Gross Profit / FC' },
  { id: 'grv',         label: 'Goods Received' },
  { id: 'stocktake',   label: 'Stocktake' },
  { id: 'onhand',      label: 'Stock on Hand' },
  { id: 'manufactured',label: 'Stock Manufactured' },
  { id: 'wastage',     label: 'Stock Wastage' },
  { id: 'supplier',    label: 'Supplier Summary' },
]

function DateFilter({ from, setFrom, to, setTo, storeFilter, setStoreFilter, showStore }) {
  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {[['FROM', from, setFrom], ['TO', to, setTo]].map(([label, val, setter]) => (
        <div key={label}>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>{label}</label>
          <input type="date" value={val} onChange={e => setter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none' }} />
        </div>
      ))}
      {showStore && (
        <div>
          <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '3px' }}>STORE</label>
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px' }}>
            <option value="all">All Stores</option>
            <option value="butchery">Butchery</option>
            <option value="bottle">Bottle Store</option>
          </select>
        </div>
      )}
    </div>
  )
}

function printTable(title, columns, rows, totalsRow) {
  const win = window.open('', '_blank', 'width=900,height=600')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h2{margin:0 0 14px}table{width:100%;border-collapse:collapse}th{background:#eee;padding:7px 10px;text-align:left;font-size:11px;border:1px solid #ddd}td{padding:6px 10px;border:1px solid #ddd}.total{font-weight:bold;background:#f5f5f5}@media print{body{padding:10px}}</style>
  </head><body><h2>${title}</h2>
  <table><thead><tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
  ${totalsRow ? `<tr class="total">${totalsRow.map(c=>`<td>${c}</td>`).join('')}</tr>` : ''}
  </tbody></table></body></html>`)
  win.print()
  setTimeout(() => win.close(), 500)
}

export default function StockReports({ user, onBack }) {
  const [active, setActive] = useState(null)
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(today())
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)

  const showStore = user.store === 'both'

  // ── VARIANCE REPORT ────────────────────────────────────────────────────
  const VarianceReport = () => {
    const products = load(KEYS.PRODUCTS).filter(p => storeFilter === 'all' || p.store === storeFilter)
    const sales = load(KEYS.SALES).filter(s => s.date?.slice(0,10) >= from && s.date?.slice(0,10) <= to && (storeFilter === 'all' || s.store === storeFilter))
    const grvs = load(KEYS.GRV).filter(g => g.date >= from && g.date <= to && (storeFilter === 'all' || g.store === storeFilter))
    const counts = load(KEYS.STOCK_COUNTS).filter(c => c.date >= from && c.date <= to)

    const rows = products.map(p => {
      const openingCount = counts.filter(c => c.date < from).slice(-1)[0]?.items?.find(i => i.productId === p.id)
      const openingStock = openingCount?.countedQty ?? p.stock
      const purchases = grvs.flatMap(g => g.items).filter(i => i.productId === p.id).reduce((s, i) => s + i.qty, 0)
      const closingStock = p.stock
      const actualUsage = openingStock + purchases - closingStock
      const theoreticalUsage = sales.flatMap(s => [...(s.items||[]),...(s.extras||[])]).filter(i => i.productId === p.id).reduce((s, i) => s + i.qty, 0)
      const variance = actualUsage - theoreticalUsage
      const variancePct = theoreticalUsage > 0 ? ((variance / theoreticalUsage) * 100).toFixed(1) : 0
      const varianceValue = variance * p.costPrice
      const closingValue = closingStock * p.costPrice
      return { p, openingStock, purchases, closingStock, actualUsage, theoreticalUsage, variance, variancePct, varianceValue, closingValue }
    })

    const totals = rows.reduce((acc, r) => ({
      openingStock: acc.openingStock + r.openingStock,
      purchases: acc.purchases + r.purchases,
      closingStock: acc.closingStock + r.closingStock,
      actualUsage: acc.actualUsage + r.actualUsage,
      theoreticalUsage: acc.theoreticalUsage + r.theoreticalUsage,
      variance: acc.variance + r.variance,
      varianceValue: acc.varianceValue + r.varianceValue,
      closingValue: acc.closingValue + r.closingValue,
    }), { openingStock:0, purchases:0, closingStock:0, actualUsage:0, theoreticalUsage:0, variance:0, varianceValue:0, closingValue:0 })

    return (
      <div>
        <DateFilter from={from} setFrom={setFrom} to={to} setTo={setTo} storeFilter={storeFilter} setStoreFilter={setStoreFilter} showStore={showStore} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button onClick={() => printTable('Stock Variance Report',
            ['Code','Name','UoM','Opening','Purchases','Closing','Actual Usage','Theoretical','Variance','Var%','Var Value','Unit Cost','Closing Value'],
            rows.map(r => [r.p.sku, r.p.name, r.p.unit, r.openingStock.toFixed(2), r.purchases.toFixed(2), r.closingStock.toFixed(2), r.actualUsage.toFixed(2), r.theoreticalUsage.toFixed(2), r.variance.toFixed(2), `${r.variancePct}%`, `R ${r.varianceValue.toFixed(2)}`, `R ${r.p.costPrice.toFixed(2)}`, `R ${r.closingValue.toFixed(2)}`]),
            ['','TOTALS','','',totals.purchases.toFixed(2),totals.closingStock.toFixed(2),totals.actualUsage.toFixed(2),totals.theoreticalUsage.toFixed(2),totals.variance.toFixed(2),'',`R ${totals.varianceValue.toFixed(2)}`,'',`R ${totals.closingValue.toFixed(2)}`]
          )} style={{ padding: '7px 14px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '7px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
            🖨️ Print Report
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Code','Name','UoM','Opening','Purchases','Closing','Actual Usage','Theoretical','Variance','Var %','Var Value','Unit Cost','Closing Value'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.p.id} style={{ borderTop: '1px solid #0f172a', backgroundColor: Math.abs(r.variance) > r.theoreticalUsage * 0.1 ? 'rgba(220,38,38,0.05)' : 'transparent' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>{r.p.sku}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '600', whiteSpace: 'nowrap' }}>{r.p.name}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{r.p.unit}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{r.openingStock.toFixed(2)}</td>
                  <td style={{ padding: '9px 12px', color: '#60a5fa' }}>{r.purchases.toFixed(2)}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{r.closingStock.toFixed(2)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '600' }}>{r.actualUsage.toFixed(2)}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{r.theoreticalUsage.toFixed(2)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: r.variance > 0 ? '#dc2626' : r.variance < 0 ? '#4ade80' : '#64748b' }}>
                    {r.variance > 0 ? `+${r.variance.toFixed(2)}` : r.variance.toFixed(2)}
                  </td>
                  <td style={{ padding: '9px 12px', color: Math.abs(r.variancePct) > 10 ? '#f59e0b' : '#64748b' }}>{r.variancePct}%</td>
                  <td style={{ padding: '9px 12px', color: r.varianceValue > 0 ? '#dc2626' : '#64748b' }}>{R(r.varianceValue)}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{R(r.p.costPrice)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700' }}>{R(r.closingValue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}>
                <td colSpan={3} style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>TOTALS</td>
                <td style={{ padding: '10px 12px', fontWeight: '700' }}>{totals.openingStock.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '700' }}>{totals.purchases.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '700' }}>{totals.closingStock.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '700' }}>{totals.actualUsage.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '700' }}>{totals.theoreticalUsage.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '800', color: totals.variance > 0 ? '#dc2626' : '#4ade80' }}>{totals.variance > 0 ? `+${totals.variance.toFixed(2)}` : totals.variance.toFixed(2)}</td>
                <td />
                <td style={{ padding: '10px 12px', fontWeight: '800', color: '#dc2626' }}>{R(totals.varianceValue)}</td>
                <td />
                <td style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>{R(totals.closingValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  // ── GP / FC REPORT ─────────────────────────────────────────────────────
  const GPReport = () => {
    const products = load(KEYS.PRODUCTS).filter(p => storeFilter === 'all' || p.store === storeFilter)
    const sales = load(KEYS.SALES).filter(s => s.date?.slice(0,10) >= from && s.date?.slice(0,10) <= to && (storeFilter === 'all' || s.store === storeFilter))
    const grvs = load(KEYS.GRV).filter(g => g.date >= from && g.date <= to && (storeFilter === 'all' || g.store === storeFilter))

    const closingStockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const purchases = grvs.reduce((s, g) => s + g.totalCost, 0)
    const revenue = sales.reduce((s, x) => s + x.total, 0)

    const productRows = products.map(p => {
      const sold = sales.flatMap(s => [...(s.items||[]),...(s.extras||[])]).filter(i => i.productId === p.id)
      const qtySold = sold.reduce((s, i) => s + i.qty, 0)
      const salesRev = sold.reduce((s, i) => s + i.total, 0)
      const theoreticalCost = qtySold * p.costPrice
      const actualGP = salesRev - theoreticalCost
      const gpPct = salesRev > 0 ? (actualGP / salesRev * 100) : 0
      const fcPct = salesRev > 0 ? (theoreticalCost / salesRev * 100) : 0
      return { p, qtySold, salesRev, theoreticalCost, actualGP, gpPct, fcPct }
    }).filter(r => r.qtySold > 0)

    const totRev = productRows.reduce((s, r) => s + r.salesRev, 0)
    const totCost = productRows.reduce((s, r) => s + r.theoreticalCost, 0)
    const totActualGP = totRev - totCost
    const theoreticalGPPct = totRev > 0 ? (totActualGP / totRev * 100) : 0
    const theoreticalFCPct = totRev > 0 ? (totCost / totRev * 100) : 0

    const cogs = purchases - closingStockValue
    const actualGP = revenue - cogs
    const actualGPPct = revenue > 0 ? (actualGP / revenue * 100) : 0
    const actualFCPct = revenue > 0 ? (cogs / revenue * 100) : 0

    return (
      <div>
        <DateFilter from={from} setFrom={setFrom} to={to} setTo={setTo} storeFilter={storeFilter} setStoreFilter={setStoreFilter} showStore={showStore} />
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Product', 'Qty Sold', 'Revenue', 'Theoretical Cost', 'GP (R)', 'GP %', 'FC %'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productRows.map((r, i) => (
                <tr key={r.p.id} style={{ borderTop: '1px solid #0f172a' }}>
                  <td style={{ padding: '9px 12px', fontWeight: '600' }}>{r.p.name}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{r.qtySold.toFixed(2)} {r.p.unit}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: '#00C4A0' }}>{R(r.salesRev)}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{R(r.theoreticalCost)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: r.actualGP >= 0 ? '#4ade80' : '#dc2626' }}>{R(r.actualGP)}</td>
                  <td style={{ padding: '9px 12px', color: r.gpPct >= 30 ? '#4ade80' : '#f59e0b', fontWeight: '700' }}>{r.gpPct.toFixed(1)}%</td>
                  <td style={{ padding: '9px 12px', color: r.fcPct <= 35 ? '#4ade80' : '#dc2626', fontWeight: '700' }}>{r.fcPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}>
                <td style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>TOTALS</td>
                <td />
                <td style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>{R(totRev)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '800' }}>{R(totCost)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '800', color: '#4ade80' }}>{R(totActualGP)}</td>
                <td /><td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* GP/FC Summary at bottom */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>GP / FC Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a' }}>
                  {['Metric', 'Theoretical %', 'Actual %', 'Difference'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: '1px solid #0f172a' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>Gross Profit (GP)</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#4ade80' }}>{theoreticalGPPct.toFixed(1)}%</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: actualGPPct >= 30 ? '#4ade80' : '#f59e0b' }}>{actualGPPct.toFixed(1)}%</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: actualGPPct >= theoreticalGPPct ? '#4ade80' : '#dc2626' }}>
                    {actualGPPct >= theoreticalGPPct ? '+' : ''}{(actualGPPct - theoreticalGPPct).toFixed(1)}%
                  </td>
                </tr>
                <tr style={{ borderTop: '1px solid #0f172a' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>Food Cost (FC)</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#94a3b8' }}>{theoreticalFCPct.toFixed(1)}%</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: actualFCPct <= 35 ? '#4ade80' : '#dc2626' }}>{actualFCPct.toFixed(1)}%</td>
                  <td style={{ padding: '12px 14px', fontWeight: '800', color: actualFCPct <= theoreticalFCPct ? '#4ade80' : '#dc2626' }}>
                    {actualFCPct <= theoreticalFCPct ? '' : '+'}{(actualFCPct - theoreticalFCPct).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── GRV REPORT ─────────────────────────────────────────────────────────
  const GRVReport = () => {
    const grvs = load(KEYS.GRV).filter(g => g.date >= from && g.date <= to && (storeFilter === 'all' || g.store === storeFilter))
    const total = grvs.reduce((s, g) => s + g.totalCost, 0)
    return (
      <div>
        <DateFilter from={from} setFrom={setFrom} to={to} setTo={setTo} storeFilter={storeFilter} setStoreFilter={setStoreFilter} showStore={showStore} />
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['GRV #','Date','Supplier','Store','Items','Total','Received By'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {grvs.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No GRVs in this period</td></tr>
              : grvs.map((g, i) => (
                <tr key={g.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#00C4A0' }}>{g.grvNumber}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{fmtDate(g.date)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>{g.supplier}</td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#64748b' }}>{g.store}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{g.items.length}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700' }}>{R(g.totalCost)}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{g.receivedBy}</td>
                </tr>
              ))}
            </tbody>
            {grvs.length > 0 && <tfoot><tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}><td colSpan={5} style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>TOTAL</td><td style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>{R(total)}</td><td /></tr></tfoot>}
          </table>
        </div>
      </div>
    )
  }

  // ── STOCK ON HAND ───────────────────────────────────────────────────────
  const StockOnHand = () => {
    const products = load(KEYS.PRODUCTS).filter(p => p.active && (storeFilter === 'all' || p.store === storeFilter))
    const totalValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const totalRetail = products.reduce((s, p) => s + p.stock * p.price, 0)
    return (
      <div>
        <div style={{ marginBottom: '14px' }}>
          {showStore && <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ padding: '8px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px' }}><option value="all">All Stores</option><option value="butchery">Butchery</option><option value="bottle">Bottle Store</option></select>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {[['Products', products.length, '#00C4A0'], ['Low Stock', products.filter(p => p.stock <= p.minStock).length, '#f59e0b'], ['Cost Value', R(totalValue), '#818cf8'], ['Retail Value', R(totalRetail), '#34d399']].map(([l, v, c]) => (
            <div key={l} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontWeight: '800', color: c, fontSize: '18px' }}>{v}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{l}</p>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Code','Product','Store','Category','UoM','Stock','Min','Cost/Unit','Cost Value','Retail Value'].map(h => <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid #0f172a', backgroundColor: p.stock <= p.minStock ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>{p.sku}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '600' }}>{p.name}</td>
                  <td style={{ padding: '9px 12px', textTransform: 'capitalize', color: '#64748b' }}>{p.store}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{p.category}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{p.unit}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: p.stock <= 0 ? '#dc2626' : p.stock <= p.minStock ? '#f59e0b' : 'white' }}>{p.stock}</td>
                  <td style={{ padding: '9px 12px', color: '#64748b' }}>{p.minStock}</td>
                  <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{R(p.costPrice)}</td>
                  <td style={{ padding: '9px 12px', fontWeight: '700' }}>{R(p.stock * p.costPrice)}</td>
                  <td style={{ padding: '9px 12px', color: '#00C4A0', fontWeight: '700' }}>{R(p.stock * p.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}>
                <td colSpan={8} style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>TOTALS</td>
                <td style={{ padding: '10px 12px', fontWeight: '800' }}>{R(totalValue)}</td>
                <td style={{ padding: '10px 12px', fontWeight: '800', color: '#00C4A0' }}>{R(totalRetail)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  // ── WASTAGE REPORT ──────────────────────────────────────────────────────
  const WastageReport = () => {
    const wastage = load(KEYS.WASTAGE).filter(w => w.date >= from && w.date <= to && (storeFilter === 'all' || w.store === storeFilter))
    const total = wastage.reduce((s, w) => s + w.totalCost, 0)
    return (
      <div>
        <DateFilter from={from} setFrom={setFrom} to={to} setTo={setTo} storeFilter={storeFilter} setStoreFilter={setStoreFilter} showStore={showStore} />
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Date','Product','Store','Qty','Reason','Cost Loss','Logged By'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {wastage.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No wastage in this period</td></tr>
              : wastage.map((w, i) => (
                <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{fmtDate(w.date)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600' }}>{w.productName}</td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#64748b' }}>{w.store}</td>
                  <td style={{ padding: '10px 12px' }}>{w.qty} {w.unit}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{w.reason}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#dc2626' }}>{R(w.totalCost)}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{w.loggedBy}</td>
                </tr>
              ))}
            </tbody>
            {wastage.length > 0 && <tfoot><tr style={{ backgroundColor: '#7f1d1d22', borderTop: '2px solid #7f1d1d' }}><td colSpan={5} style={{ padding: '10px 12px', fontWeight: '800', color: '#fca5a5' }}>TOTAL LOSS</td><td style={{ padding: '10px 12px', fontWeight: '800', color: '#dc2626' }}>{R(total)}</td><td /></tr></tfoot>}
          </table>
        </div>
      </div>
    )
  }

  // ── SUPPLIER SUMMARY ────────────────────────────────────────────────────
  const SupplierSummary = () => {
    const grvs = load(KEYS.GRV).filter(g => g.date >= from && g.date <= to && (storeFilter === 'all' || g.store === storeFilter))
    const supplierMap = {}
    grvs.forEach(g => {
      if (!supplierMap[g.supplier]) supplierMap[g.supplier] = { name: g.supplier, orders: 0, total: 0, items: 0 }
      supplierMap[g.supplier].orders++
      supplierMap[g.supplier].total += g.totalCost
      supplierMap[g.supplier].items += g.items.length
    })
    const suppliers = Object.values(supplierMap).sort((a, b) => b.total - a.total)
    return (
      <div>
        <DateFilter from={from} setFrom={setFrom} to={to} setTo={setTo} storeFilter={storeFilter} setStoreFilter={setStoreFilter} showStore={showStore} />
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Supplier','GRVs','Items','Total Purchased'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {suppliers.length === 0 ? <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No supplier data in this period</td></tr>
              : suppliers.map((s, i) => (
                <tr key={s.name} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                  <td style={{ padding: '11px 14px', fontWeight: '600' }}>{s.name}</td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{s.orders}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b' }}>{s.items}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700', color: '#00C4A0' }}>{R(s.total)}</td>
                </tr>
              ))}
            </tbody>
            {suppliers.length > 0 && <tfoot><tr style={{ backgroundColor: '#0A6C6B22', borderTop: '2px solid #0A6C6B' }}><td style={{ padding: '10px 14px', fontWeight: '800', color: '#00C4A0' }}>TOTAL</td><td style={{ padding: '10px 14px', fontWeight: '700' }}>{suppliers.reduce((s, x) => s + x.orders, 0)}</td><td /><td style={{ padding: '10px 14px', fontWeight: '800', color: '#00C4A0' }}>{R(suppliers.reduce((s, x) => s + x.total, 0))}</td></tr></tfoot>}
          </table>
        </div>
      </div>
    )
  }

  const CONTENT = { variance: <VarianceReport />, gp: <GPReport />, grv: <GRVReport />, onhand: <StockOnHand />, wastage: <WastageReport />, supplier: <SupplierSummary />, stocktake: <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>📋 Use the Stock Count module to run a stocktake. Results appear here once submitted.</div>, manufactured: <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>🥩 Use the Butchery Cuts module to record manufacturing. Reports populate from those records.</div> }

  return (
    <Shell title="Stock Reports" onBack={onBack}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {SUB_REPORTS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: active === s.id ? '#00C4A0' : '#1e293b', color: active === s.id ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>
      {active ? CONTENT[active] : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📦</p>
          <p>Select a stock report above</p>
        </div>
      )}
    </Shell>
  )
}
