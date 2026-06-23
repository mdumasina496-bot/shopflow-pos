import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, R, fmtDateTime } from '../data'

export default function OrderSearch({ user, onBack }) {
  const [sales, setSales] = useState([])
  const [abandoned, setAbandoned] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    setSales(load(KEYS.SALES))
    setAbandoned(load(KEYS.ABANDONED, []))
  }, [])

  const q = query.toLowerCase().trim()

  const matchSale = (s) => {
    if (!q) return true
    return (
      s.orderNumber?.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q) ||
      s.customerPhone?.toLowerCase().includes(q) ||
      s.cashier?.toLowerCase().includes(q)
    )
  }

  const matchAbandoned = (a) => {
    if (!q) return true
    return (
      a.cashier?.toLowerCase().includes(q) ||
      a.id?.toLowerCase().includes(q) ||
      a.items?.some(i => i.name?.toLowerCase().includes(q))
    )
  }

  const filteredSales = statusFilter === 'abandoned' ? [] : sales.filter(matchSale)
  const filteredAbandoned = statusFilter === 'fulfilled' ? [] : abandoned.filter(matchAbandoned)

  const totalResults = filteredSales.length + filteredAbandoned.length

  const Row = ({ children, id }) => (
    <div style={{ borderTop: '1px solid #0f172a' }}>
      <div onClick={() => setExpanded(expanded === id ? null : id)}
        style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 100px 90px', gap: '8px', padding: '10px 14px', cursor: 'pointer', alignItems: 'center' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f172a33'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        {children}
      </div>
    </div>
  )

  return (
    <Shell title="Orders Search" subtitle="Search all fulfilled & unfulfilled orders" onBack={onBack}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by order #, customer name, phone, cashier..."
          autoFocus
          style={{ flex: 1, minWidth: '220px', padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['all', 'All'], ['fulfilled', 'Completed'], ['abandoned', 'Abandoned']].map(([id, label]) => (
            <button key={id} onClick={() => setStatusFilter(id)}
              style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', backgroundColor: statusFilter === id ? '#00C4A0' : '#0f172a', color: statusFilter === id ? '#0f172a' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px' }}>
        {totalResults} result{totalResults !== 1 ? 's' : ''} — {filteredSales.length} completed, {filteredAbandoned.length} abandoned
      </p>

      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 100px 90px', gap: '8px', padding: '10px 14px', backgroundColor: '#0f172a' }}>
          {['Order / Date', 'Customer / Cashier', 'Items', 'Total', 'Status'].map(h => (
            <span key={h} style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {/* Completed sales */}
        {filteredSales.length === 0 && filteredAbandoned.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '60px 20px', margin: 0 }}>
            {q ? `No orders matching "${query}"` : 'No orders yet'}
          </p>
        )}

        {[...filteredSales].reverse().map(s => (
          <div key={s.id}>
            <div onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 100px 90px', gap: '8px', padding: '10px 14px', cursor: 'pointer', borderTop: '1px solid #0f172a', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f172a55'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '12px', color: '#00C4A0', fontFamily: 'monospace' }}>{s.orderNumber}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{fmtDateTime(s.date)}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>{s.customerName || '—'}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  {s.cashier}{s.customerPhone ? ` • ${s.customerPhone}` : ''}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                {(s.items?.filter(i => !i.voided).length || 0) + (s.extras?.filter(i => !i.voided).length || 0)} item(s)
              </p>
              <p style={{ margin: 0, fontWeight: '700', color: '#00C4A0', fontSize: '13px' }}>{R(s.total)}</p>
              <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: '#14532d33', color: '#4ade80', fontSize: '10px', fontWeight: '700' }}>
                {s.paymentMethod?.toUpperCase()}
              </span>
            </div>
            {expanded === s.id && (
              <div style={{ padding: '0 14px 14px', backgroundColor: '#0f172a22' }}>
                <div style={{ borderTop: '1px solid #334155', paddingTop: '10px' }}>
                  {[...(s.items || []), ...(s.extras || [])].filter(i => !i.voided).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8' }}>{item.name} × {item.qty}{item.unit === 'kg' ? 'kg' : ''}</span>
                      <span style={{ fontWeight: '600' }}>{R(item.total)}</span>
                    </div>
                  ))}
                  {s.discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#f59e0b' }}>
                    <span>Discount ({s.discountPct}%)</span><span>−{R(s.discountAmt)}</span>
                  </div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: '13px', fontWeight: '800', color: '#00C4A0', borderTop: '1px solid #334155', marginTop: '4px' }}>
                    <span>TOTAL</span><span>{R(s.total)}</span>
                  </div>
                  {s.orderType && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#64748b' }}>Type: {s.orderType} • Store: {s.store} • Till: {s.tillName || '—'}</p>}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Abandoned orders */}
        {filteredAbandoned.length > 0 && statusFilter !== 'fulfilled' && (
          <>
            <div style={{ padding: '8px 14px', backgroundColor: 'rgba(220,38,38,0.12)', borderTop: '2px solid #dc2626' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#fca5a5' }}>⚠️ ABANDONED ORDERS — items were in cart but payment was never completed</p>
            </div>
            {[...filteredAbandoned].reverse().map(a => (
              <div key={a.id}>
                <div onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 100px 90px', gap: '8px', padding: '10px 14px', cursor: 'pointer', borderTop: '1px solid #0f172a', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f172a55'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '11px', color: '#dc2626', fontFamily: 'monospace' }}>ABANDONED</p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>{fmtDateTime(a.date)}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>Cashier: {a.cashier}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Store: {a.store}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{(a.items?.length || 0) + (a.extras?.length || 0)} item(s)</p>
                  <p style={{ margin: 0, fontWeight: '700', color: '#dc2626', fontSize: '13px' }}>{R(a.total)}</p>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: '#dc262633', color: '#fca5a5', fontSize: '10px', fontWeight: '700' }}>ABANDONED</span>
                </div>
                {expanded === a.id && (
                  <div style={{ padding: '0 14px 14px', backgroundColor: 'rgba(220,38,38,0.05)' }}>
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '10px' }}>
                      {[...(a.items || []), ...(a.extras || [])].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
                          <span style={{ color: '#94a3b8' }}>{item.name} × {item.qty}{item.unit === 'kg' ? 'kg' : ''}</span>
                          <span style={{ fontWeight: '600', color: '#dc2626' }}>{R(item.total)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', fontSize: '13px', fontWeight: '800', color: '#dc2626', borderTop: '1px solid #334155', marginTop: '4px' }}>
                        <span>TOTAL (UNPAID)</span><span>{R(a.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </Shell>
  )
}
