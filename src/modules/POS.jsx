import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId, nowISO, today } from '../data'

export default function POS({ user, onBack }) {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [activeStore, setActiveStore] = useState(user.store === 'both' ? 'butchery' : user.store)
  const [discount, setDiscount] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [payMethod, setPayMethod] = useState('cash')
  const [tendered, setTendered] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [todaySales, setTodaySales] = useState(0)

  const refreshProducts = () => {
    const all = load(KEYS.PRODUCTS)
    const filtered = all.filter(p => p.active && p.store === activeStore)
    setProducts(filtered)
  }

  useEffect(() => {
    refreshProducts()
    const sales = load(KEYS.SALES)
    const t = today()
    const todayTotal = sales
      .filter(s => s.date.startsWith(t) && (user.store === 'both' || s.store === user.store))
      .reduce((sum, s) => sum + s.total, 0)
    setTodaySales(todayTotal)
  }, [activeStore])

  const categories = ['All', ...new Set(products.map(p => p.category))]

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    const matchCat = catFilter === 'All' || p.category === catFilter
    return matchSearch && matchCat
  })

  const addToCart = (product) => {
    if (product.stock <= 0) { alert('Out of stock'); return }
    const existing = cart.find(c => c.id === product.id)
    if (existing && existing.qty >= product.stock) { alert('Insufficient stock'); return }
    setCart(prev => {
      const found = prev.find(c => c.id === product.id)
      if (found) {
        return prev.map(c => c.id === product.id
          ? { ...c, qty: c.qty + (c.unit === 'kg' ? 0.5 : 1), total: (c.qty + (c.unit === 'kg' ? 0.5 : 1)) * c.price }
          : c)
      }
      const startQty = product.unit === 'kg' ? 0.5 : 1
      return [...prev, { ...product, qty: startQty, total: startQty * product.price }]
    })
  }

  const updateQty = (id, qty) => {
    const product = products.find(p => p.id === id)
    const parsed = parseFloat(qty)
    if (isNaN(parsed) || parsed < 0) return
    if (parsed > product.stock) { alert('Insufficient stock'); return }
    if (parsed === 0) { setCart(prev => prev.filter(c => c.id !== id)); return }
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: parsed, total: parsed * c.price } : c))
  }

  const subtotal = cart.reduce((sum, c) => sum + c.total, 0)
  const discountPct = parseFloat(discount) || 0
  const discountAmt = subtotal * (discountPct / 100)
  const total = subtotal - discountAmt

  const completeSale = () => {
    const amt = parseFloat(tendered)
    if (payMethod === 'cash' && amt < total) { alert('Insufficient cash tendered'); return }

    const saleData = {
      id: genId(),
      date: nowISO(),
      store: activeStore,
      cashier: user.name,
      items: cart.map(c => ({ productId: c.id, name: c.name, qty: c.qty, unit: c.unit, price: c.price, total: c.total })),
      subtotal,
      discountPct,
      discountAmt,
      total,
      paymentMethod: payMethod,
      amountTendered: payMethod === 'cash' ? amt : total,
      change: payMethod === 'cash' ? amt - total : 0,
    }

    const sales = load(KEYS.SALES)
    save(KEYS.SALES, [...sales, saleData])

    const allProds = load(KEYS.PRODUCTS)
    save(KEYS.PRODUCTS, allProds.map(p => {
      const item = cart.find(c => c.id === p.id)
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p
    }))

    setTodaySales(prev => prev + total)
    setReceipt(saleData)
    setCart([])
    setDiscount('')
    setTendered('')
    setPayModal(false)
    setPayMethod('cash')
    refreshProducts()
  }

  if (receipt) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>✓</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', color: '#00C4A0' }}>Sale Complete!</h2>
          <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: '13px' }}>Receipt #{receipt.id.split('-')[0].toUpperCase()}</p>

          <div style={{ textAlign: 'left', borderTop: '1px solid #334155', paddingTop: '16px', marginBottom: '16px' }}>
            {receipt.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>{item.name} × {item.qty}{item.unit === 'kg' ? 'kg' : ''}</span>
                <span style={{ fontWeight: '700' }}>{R(item.total)}</span>
              </div>
            ))}
          </div>

          {receipt.discountPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: '13px', marginBottom: '8px' }}>
              <span>Discount ({receipt.discountPct}%)</span>
              <span>-{R(receipt.discountAmt)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '800', borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '16px' }}>
            <span>TOTAL</span>
            <span style={{ color: '#00C4A0' }}>{R(receipt.total)}</span>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '28px' }}>
            {receipt.paymentMethod === 'cash'
              ? <div>Cash: {R(receipt.amountTendered)} &nbsp;|&nbsp; Change: {R(receipt.change)}</div>
              : <div>Card Payment</div>
            }
            <div style={{ marginTop: '4px' }}>Cashier: {receipt.cashier} &nbsp;|&nbsp; {receipt.store}</div>
          </div>

          <button onClick={() => setReceipt(null)} style={{ width: '100%', padding: '14px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginBottom: '10px' }}>
            New Sale
          </button>
          <button onClick={onBack} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <Shell title="POS / Sales" subtitle={`Today's Sales: ${R(todaySales)}`} onBack={onBack}>
      {/* Payment Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Payment</h3>
            <p style={{ margin: '0 0 20px', color: '#00C4A0', fontSize: '24px', fontWeight: '800' }}>{R(total)}</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['cash', 'card'].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid', borderColor: payMethod === m ? '#00C4A0' : '#334155', backgroundColor: payMethod === m ? 'rgba(0,196,160,0.1)' : '#0f172a', color: payMethod === m ? '#00C4A0' : '#94a3b8', fontWeight: '700', cursor: 'pointer' }}>
                  {m === 'cash' ? '💵 Cash' : '💳 Card'}
                </button>
              ))}
            </div>

            {payMethod === 'cash' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Amount Tendered (R)</label>
                <input
                  type="number"
                  value={tendered}
                  onChange={e => setTendered(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '22px', fontWeight: '700', boxSizing: 'border-box', outline: 'none' }}
                />
                {parseFloat(tendered) >= total && (
                  <p style={{ color: '#00C4A0', fontWeight: '700', margin: '10px 0 0', fontSize: '18px' }}>
                    Change: {R(parseFloat(tendered) - total)}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setPayModal(false)} style={{ flex: 1, padding: '13px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button
                onClick={completeSale}
                disabled={payMethod === 'cash' && (!tendered || parseFloat(tendered) < total)}
                style={{ flex: 1, padding: '13px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '800', cursor: 'pointer', opacity: payMethod === 'cash' && (!tendered || parseFloat(tendered) < total) ? 0.4 : 1 }}
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store selector (owner / both-store users) */}
      {user.store === 'both' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['butchery', 'bottle'].map(s => (
            <button key={s} onClick={() => { setActiveStore(s); setCart([]); setSearch(''); setCatFilter('All') }} style={{ padding: '8px 20px', borderRadius: '8px', border: '2px solid', borderColor: activeStore === s ? '#00C4A0' : '#334155', backgroundColor: activeStore === s ? 'rgba(0,196,160,0.1)' : '#1e293b', color: activeStore === s ? '#00C4A0' : '#94a3b8', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize' }}>
              {s === 'butchery' ? '🥩 Butchery' : '🍺 Bottle Store'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        {/* Products Panel */}
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: catFilter === c ? '#00C4A0' : '#1e293b', color: catFilter === c ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '10px' }}>
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.45, border: '1px solid #334155', transition: 'border-color 0.15s, transform 0.1s' }}
                onMouseEnter={e => { if (p.stock > 0) { e.currentTarget.style.borderColor = '#00C4A0'; e.currentTarget.style.transform = 'scale(1.02)' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'scale(1)' }}
              >
                <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '13px' }}>{p.name}</p>
                <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748b' }}>{p.sku}</p>
                <p style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#00C4A0' }}>
                  {R(p.price)}<span style={{ fontSize: '11px', color: '#94a3b8' }}>/{p.unit}</span>
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: p.stock <= p.minStock ? '#f59e0b' : '#64748b' }}>
                  {p.stock <= 0 ? '⛔ Out of stock' : `Stock: ${p.stock}${p.unit === 'kg' ? 'kg' : ''}`}
                </p>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', marginTop: '60px' }}>No products found</p>}
        </div>

        {/* Cart */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'sticky', top: '80px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700' }}>
            Cart {cart.length > 0 && <span style={{ color: '#00C4A0' }}>({cart.length} items)</span>}
          </h3>

          <div style={{ maxHeight: '380px', overflowY: 'auto', marginBottom: '14px' }}>
            {cart.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', margin: '40px 0', fontSize: '14px' }}>Tap a product to add</p>}
            {cart.map(item => (
              <div key={item.id} style={{ borderBottom: '1px solid #0f172a', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', flex: 1 }}>{item.name}</p>
                  <button onClick={() => setCart(c => c.filter(x => x.id !== item.id))} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 8px', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  {item.unit === 'kg' ? (
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={item.qty}
                      onChange={e => updateQty(item.id, e.target.value)}
                      style={{ width: '80px', padding: '5px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '14px', fontWeight: '700', outline: 'none' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '28px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#00C4A0' }}>{R(item.total)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Discount %</label>
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={{ width: '100%', padding: '9px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Subtotal</span><span>{R(subtotal)}</span>
            </div>
            {discountPct > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>
                <span>Discount ({discountPct}%)</span><span>−{R(discountAmt)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '19px', fontWeight: '800', color: '#00C4A0', marginTop: '8px' }}>
              <span>TOTAL</span><span>{R(total)}</span>
            </div>
          </div>

          <button
            onClick={() => cart.length > 0 && setPayModal(true)}
            disabled={cart.length === 0}
            style={{ padding: '14px', backgroundColor: cart.length > 0 ? '#00C4A0' : '#334155', border: 'none', borderRadius: '10px', color: cart.length > 0 ? '#0f172a' : '#64748b', fontWeight: '800', fontSize: '15px', cursor: cart.length > 0 ? 'pointer' : 'not-allowed', marginBottom: '8px' }}
          >
            {cart.length > 0 ? `Charge ${R(total)}` : 'Add items to cart'}
          </button>
          <button onClick={() => setCart([])} style={{ padding: '9px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>
            Clear Cart
          </button>
        </div>
      </div>
    </Shell>
  )
}
