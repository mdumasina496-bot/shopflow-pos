import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, R, genId, nowISO, today, nextOrderNumber, getSettings, printBraaiTicket, printReceipt } from '../../data'

const ORDER_TYPES = [
  { id: 'takeaway', label: '🥡 Takeaway' },
  { id: 'braai',    label: '🔥 Braai In' },
  { id: 'call',     label: '📞 Call Order' },
  { id: 'delivery', label: '🚗 Delivery' },
]

function VoidModal({ item, onConfirm, onCancel }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  const verify = () => {
    const users = load(KEYS.USERS)
    const mgr = users.find(u => u.password === pwd && (u.role === 'manager' || u.role === 'owner') && u.active !== false)
    if (mgr) { onConfirm(mgr.name) }
    else { setErr('Incorrect manager password'); setPwd('') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '100%' }}>
        <h3 style={{ margin: '0 0 6px', color: '#dc2626' }}>Void Item</h3>
        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px' }}>
          Voiding: <strong style={{ color: 'white' }}>{item.name}</strong> — {R(item.total)}<br />
          Manager password required to approve.
        </p>
        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Manager Password</label>
        <input type="password" value={pwd} onChange={e => { setPwd(e.target.value); setErr('') }} autoFocus
          onKeyDown={e => e.key === 'Enter' && verify()}
          style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: `1px solid ${err ? '#dc2626' : '#334155'}`, borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }} />
        {err && <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px' }}>{err}</p>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
          <button onClick={verify} style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Confirm Void</button>
        </div>
      </div>
    </div>
  )
}

function PaymentModal({ total, onComplete, onCancel, allowSplit }) {
  const [method, setMethod] = useState('cash')
  const [tendered, setTendered] = useState('')
  const [cashAmt, setCashAmt] = useState('')
  const [cardAmt, setCardAmt] = useState('')

  const cashNum = parseFloat(tendered || cashAmt) || 0
  const cardNum = parseFloat(cardAmt) || 0
  const splitTotal = cashNum + cardNum

  const canComplete = method === 'cash' ? cashNum >= total
    : method === 'card' ? true
    : splitTotal >= total

  const handleComplete = () => {
    if (!canComplete) return
    onComplete({
      paymentMethod: method,
      amountTendered: method === 'cash' ? cashNum : method === 'card' ? total : splitTotal,
      cashAmount: method === 'split' ? cashNum : method === 'cash' ? cashNum : 0,
      cardAmount: method === 'split' ? cardNum : method === 'card' ? total : 0,
      change: method === 'cash' ? cashNum - total : method === 'split' ? Math.max(0, splitTotal - total) : 0,
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '20px' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '100%' }}>
        <h3 style={{ margin: '0 0 6px' }}>Payment</h3>
        <p style={{ margin: '0 0 20px', color: '#00C4A0', fontSize: '26px', fontWeight: '900' }}>{R(total)}</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['cash', 'card', ...(allowSplit ? ['split'] : [])].map(m => (
            <button key={m} onClick={() => setMethod(m)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '2px solid', borderColor: method === m ? '#00C4A0' : '#334155', backgroundColor: method === m ? 'rgba(0,196,160,0.1)' : '#0f172a', color: method === m ? '#00C4A0' : '#94a3b8', fontWeight: '700', cursor: 'pointer', textTransform: 'capitalize', fontSize: '13px' }}>
              {m === 'cash' ? '💵 Cash' : m === 'card' ? '💳 Card' : '✂️ Split'}
            </button>
          ))}
        </div>

        {method === 'cash' && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Amount Tendered (R)</label>
            <input type="number" value={tendered} onChange={e => setTendered(e.target.value)} placeholder="0.00" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleComplete()}
              style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '22px', fontWeight: '700', boxSizing: 'border-box', outline: 'none' }} />
            {cashNum >= total && <p style={{ color: '#00C4A0', fontWeight: '700', margin: '8px 0 0', fontSize: '18px' }}>Change: {R(cashNum - total)}</p>}
          </div>
        )}

        {method === 'split' && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cash Amount (R)</label>
              <input type="number" value={cashAmt} onChange={e => setCashAmt(e.target.value)} placeholder="0.00"
                style={{ width: '100%', padding: '11px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Card Amount (R)</label>
              <input type="number" value={cardAmt} onChange={e => setCardAmt(e.target.value)} placeholder="0.00"
                style={{ width: '100%', padding: '11px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            {splitTotal > 0 && <p style={{ color: splitTotal >= total ? '#00C4A0' : '#f59e0b', margin: '8px 0 0', fontSize: '14px', fontWeight: '700' }}>
              Total entered: {R(splitTotal)} {splitTotal < total ? `(still need ${R(total - splitTotal)})` : '✓'}
            </p>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleComplete} disabled={!canComplete}
            style={{ flex: 1, padding: '13px', backgroundColor: canComplete ? '#00C4A0' : '#334155', border: 'none', borderRadius: '8px', color: canComplete ? '#0f172a' : '#64748b', fontWeight: '800', cursor: canComplete ? 'pointer' : 'not-allowed' }}>
            Complete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders({ user, onBack }) {
  const [products, setProducts] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [cart, setCart] = useState([])
  const [extraCart, setExtraCart] = useState([])
  const [orderType, setOrderType] = useState('takeaway')
  const [customerName, setCustomerName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('products')
  const [catFilter, setCatFilter] = useState('All')
  const [discountPct, setDiscountPct] = useState('')
  const [voidTarget, setVoidTarget] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [todaySales, setTodaySales] = useState(0)
  const settings = getSettings()

  useEffect(() => {
    const activeStore = user.store === 'both' ? null : user.store
    const prods = load(KEYS.PRODUCTS).filter(p => p.active && (!activeStore || p.store === activeStore))
    setProducts(prods)

    const mItems = load(KEYS.MENU_ITEMS).filter(m => m.available && (!activeStore || m.store === activeStore))
    setMenuItems(mItems)

    if (settings.requireAssignment) {
      const assignments = load(KEYS.ASSIGNMENTS)
      const today_ = today()
      const active = assignments.find(a =>
        a.cashierId === user.id && a.status === 'open' && a.date === today_
      )
      setAssignment(active || null)
    } else {
      setAssignment({ tillName: 'No Till Required', float: 0 })
    }

    const sales = load(KEYS.SALES)
    const t = today()
    setTodaySales(sales.filter(s => s.date?.startsWith(t) && (user.store === 'both' || s.store === user.store)).reduce((s, x) => s + x.total, 0))
  }, [])

  const productCats = ['All', ...new Set(products.map(p => p.category))]
  const filteredProds = products.filter(p => {
    const q = search.toLowerCase()
    return (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) && (catFilter === 'All' || p.category === catFilter)
  })
  const filteredExtras = menuItems.filter(m => m.available)

  const addToCart = (product, isExtra = false) => {
    const targetCart = isExtra ? extraCart : cart
    const setTarget = isExtra ? setExtraCart : setCart
    if (!isExtra && product.stock <= 0) { alert('Out of stock'); return }
    const existing = targetCart.find(c => c.id === product.id)
    if (!isExtra && existing && existing.qty >= product.stock) { alert('Insufficient stock'); return }
    setTarget(prev => {
      const found = prev.find(c => c.id === product.id)
      if (found) {
        const newQty = found.qty + (product.unit === 'kg' ? 0.5 : 1)
        return prev.map(c => c.id === product.id ? { ...c, qty: newQty, total: newQty * c.price } : c)
      }
      const startQty = product.unit === 'kg' ? 0.5 : 1
      return [...prev, { ...product, qty: startQty, total: startQty * product.price, voided: false, printToBraai: product.printToBraai !== false }]
    })
  }

  const updateQty = (id, qty, isExtra = false) => {
    const parsed = parseFloat(qty)
    if (isNaN(parsed) || parsed < 0) return
    const setter = isExtra ? setExtraCart : setCart
    if (!isExtra) {
      const prod = products.find(p => p.id === id)
      if (prod && parsed > prod.stock) { alert('Insufficient stock'); return }
    }
    if (parsed === 0) { setter(prev => prev.filter(c => c.id !== id)); return }
    setter(prev => prev.map(c => c.id === id ? { ...c, qty: parsed, total: parsed * c.price } : c))
  }

  const activeCart = cart.filter(i => !i.voided)
  const activeExtras = extraCart.filter(i => !i.voided)
  const subtotal = [...activeCart, ...activeExtras].reduce((s, i) => s + i.total, 0)
  const disc = parseFloat(discountPct) || 0
  const discountAmt = subtotal * (disc / 100)
  const total = subtotal - discountAmt

  const handleVoidConfirm = (approvedBy) => {
    const { id, isExtra } = voidTarget
    const setter = isExtra ? setExtraCart : setCart
    setter(prev => prev.map(c => c.id === id ? { ...c, voided: true, total: 0, voidedBy: approvedBy } : c))

    const voids = load(KEYS.VOIDS)
    const item = (isExtra ? extraCart : cart).find(c => c.id === id)
    save(KEYS.VOIDS, [...voids, { id: genId(), date: nowISO(), itemName: item.name, itemTotal: item.total, cashier: user.name, approvedBy, orderId: null }])
    setVoidTarget(null)
  }

  const completeSale = (payInfo) => {
    const orderNumber = nextOrderNumber()
    const saleData = {
      id: genId(),
      orderNumber,
      date: nowISO(),
      store: user.store === 'both' ? (products[0]?.store || 'butchery') : user.store,
      cashier: user.name,
      cashierId: user.id,
      tillId: assignment?.tillId || null,
      tillName: assignment?.tillName || null,
      shiftId: assignment?.shiftId || null,
      orderType,
      customerName: customerName || null,
      tableNumber: tableNumber || null,
      customerPhone: customerPhone || null,
      items: [...cart].map(i => ({ ...i })),
      extras: [...extraCart].map(i => ({ ...i })),
      subtotal,
      discountPct: disc,
      discountAmt,
      total,
      ...payInfo,
    }

    const allSales = load(KEYS.SALES)
    save(KEYS.SALES, [...allSales, saleData])

    const allProds = load(KEYS.PRODUCTS)
    save(KEYS.PRODUCTS, allProds.map(p => {
      const item = activeCart.find(c => c.id === p.id)
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p
    }))
    setProducts(load(KEYS.PRODUCTS).filter(p => p.active && (user.store === 'both' ? true : p.store === user.store)))

    setTodaySales(prev => prev + total)
    setReceipt(saleData)
    setCart([]); setExtraCart([]); setDiscountPct(''); setCustomerName(''); setTableNumber(''); setCustomerPhone('')
    setShowPayment(false)
  }

  // ── Not assigned screen ────────────────────────────────────────────────
  if (settings.requireAssignment && !assignment) {
    return (
      <Shell title="Orders" onBack={onBack}>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontSize: '64px', margin: '0 0 16px' }}>🔒</p>
          <h2 style={{ color: '#f59e0b', margin: '0 0 12px' }}>Not Assigned</h2>
          <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
            You have not been assigned to a till for today. Ask your manager to open the <strong>Assign</strong> module and assign you before you can process orders.
          </p>
        </div>
      </Shell>
    )
  }

  // ── Receipt screen ─────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>✓</div>
          <h2 style={{ margin: '0 0 4px', color: '#00C4A0' }}>Sale Complete!</h2>
          <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '13px' }}>Order #{receipt.orderNumber}</p>

          <div style={{ textAlign: 'left', borderTop: '1px solid #334155', paddingTop: '14px', marginBottom: '14px' }}>
            {[...(receipt.items || []), ...(receipt.extras || [])].filter(i => !i.voided).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>{item.name} × {item.qty}{item.unit === 'kg' ? 'kg' : ''}</span>
                <span>{R(item.total)}</span>
              </div>
            ))}
          </div>

          {receipt.discountPct > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: '13px', marginBottom: '6px' }}>
              <span>Discount ({receipt.discountPct}%)</span><span>−{R(receipt.discountAmt)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '800', color: '#00C4A0', borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '16px' }}>
            <span>TOTAL</span><span>{R(receipt.total)}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
            {receipt.paymentMethod === 'cash' ? `Cash: ${R(receipt.amountTendered)} | Change: ${R(receipt.change)}` : receipt.paymentMethod === 'card' ? 'Card Payment' : 'Split Payment'}
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button onClick={() => printReceipt(receipt, settings)} style={{ flex: 1, padding: '11px', backgroundColor: '#0A6C6B', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>🖨️ Receipt</button>
            {(receipt.orderType === 'braai') && (
              <button onClick={() => printBraaiTicket(receipt, settings)} style={{ flex: 1, padding: '11px', backgroundColor: '#b91c1c', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>🔥 Braai Ticket</button>
            )}
          </div>
          <button onClick={() => setReceipt(null)} style={{ width: '100%', padding: '13px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '10px', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginBottom: '8px' }}>
            New Order
          </button>
          <button onClick={onBack} style={{ width: '100%', padding: '11px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>
            Back to Admin Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <Shell title="Orders" subtitle={`Till: ${assignment?.tillName || '—'} | Today: ${R(todaySales)}`} onBack={onBack}>
      {voidTarget && <VoidModal item={voidTarget} onConfirm={handleVoidConfirm} onCancel={() => setVoidTarget(null)} />}
      {showPayment && <PaymentModal total={total} allowSplit={settings.allowSplitPayment} onComplete={completeSale} onCancel={() => setShowPayment(false)} />}

      {/* Order type + customer details */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {ORDER_TYPES.map(t => (
            <button key={t.id} onClick={() => setOrderType(t.id)} style={{ padding: '7px 12px', borderRadius: '8px', border: '2px solid', borderColor: orderType === t.id ? '#00C4A0' : '#334155', backgroundColor: orderType === t.id ? 'rgba(0,196,160,0.1)' : '#0f172a', color: orderType === t.id ? '#00C4A0' : '#94a3b8', fontWeight: '700', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
        {(orderType === 'call' || orderType === 'delivery' || orderType === 'braai') && (
          <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', width: '160px' }} />
        )}
        {(orderType === 'call' || orderType === 'delivery') && (
          <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone number" style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', width: '140px' }} />
        )}
        {orderType === 'braai' && (
          <input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Table / Order ref" style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', width: '150px' }} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '14px' }}>
        {/* Product panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            <button onClick={() => setTab('products')} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', backgroundColor: tab === 'products' ? '#0A6C6B' : 'transparent', color: tab === 'products' ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
              🥩 Products
            </button>
            {menuItems.length > 0 && (
              <button onClick={() => setTab('extras')} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', backgroundColor: tab === 'extras' ? '#b91c1c' : 'transparent', color: tab === 'extras' ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                ➕ Extras
              </button>
            )}
          </div>

          {tab === 'products' && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, padding: '9px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {productCats.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', backgroundColor: catFilter === c ? '#00C4A0' : '#1e293b', color: catFilter === c ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                    {c}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '9px' }}>
                {filteredProds.map(p => (
                  <div key={p.id} onClick={() => addToCart(p)}
                    style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '13px', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.45, border: '1px solid #334155', transition: 'border-color 0.15s, transform 0.1s' }}
                    onMouseEnter={e => { if (p.stock > 0) { e.currentTarget.style.borderColor = '#00C4A0'; e.currentTarget.style.transform = 'scale(1.02)' } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'scale(1)' }}>
                    <p style={{ margin: '0 0 3px', fontWeight: '700', fontSize: '12px' }}>{p.name}</p>
                    <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#64748b' }}>{p.sku}</p>
                    <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#00C4A0' }}>{R(p.price)}<span style={{ fontSize: '10px', color: '#94a3b8' }}>/{p.unit}</span></p>
                    <p style={{ margin: 0, fontSize: '10px', color: p.stock <= p.minStock ? '#f59e0b' : '#64748b' }}>
                      {p.stock <= 0 ? '⛔ Out of stock' : `${p.stock}${p.unit === 'kg' ? 'kg' : ''}`}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'extras' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '9px' }}>
              {filteredExtras.map(m => (
                <div key={m.id} onClick={() => addToCart(m, true)}
                  style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '13px', cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.15s, transform 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'scale(1)' }}>
                  <p style={{ margin: '0 0 3px', fontWeight: '700', fontSize: '12px' }}>{m.name}</p>
                  <p style={{ margin: '0 0 6px', fontSize: '10px', color: m.type === 'braai_service' ? '#f59e0b' : '#64748b' }}>{m.category}</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: m.type === 'braai_service' ? '#f59e0b' : '#00C4A0' }}>{R(m.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'sticky', top: '70px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '700' }}>
            Cart {(cart.length + extraCart.length) > 0 && <span style={{ color: '#00C4A0' }}>({cart.filter(i=>!i.voided).length + extraCart.filter(i=>!i.voided).length})</span>}
          </h3>

          <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '12px' }}>
            {cart.length === 0 && extraCart.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', margin: '30px 0', fontSize: '13px' }}>Tap a product to add</p>}

            {[...cart.map(i => ({ ...i, isExtra: false })), ...extraCart.map(i => ({ ...i, isExtra: true }))].map((item, idx) => (
              <div key={`${item.id}-${item.isExtra}`} style={{ borderBottom: '1px solid #0f172a', paddingBottom: '10px', marginBottom: '10px', opacity: item.voided ? 0.4 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', flex: 1, textDecoration: item.voided ? 'line-through' : 'none' }}>{item.name} {item.isExtra && <span style={{ fontSize: '10px', color: '#f59e0b' }}>extra</span>}</span>
                  {!item.voided ? (
                    <button onClick={() => setVoidTarget({ ...item })} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '700', padding: '0 0 0 6px' }}>VOID</button>
                  ) : <span style={{ fontSize: '10px', color: '#dc2626' }}>VOIDED</span>}
                </div>
                {!item.voided && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    {item.unit === 'kg' ? (
                      <input type="number" step="0.1" value={item.qty} onChange={e => updateQty(item.id, e.target.value, item.isExtra)}
                        style={{ width: '70px', padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: 'white', fontSize: '13px', outline: 'none' }} />
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1, item.isExtra)} style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '22px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1, item.isExtra)} style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    )}
                    <span style={{ fontSize: '13px', fontWeight: '700', color: item.isExtra ? '#f59e0b' : '#00C4A0' }}>{R(item.total)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Discount %</label>
            <input type="number" min="0" max="100" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="0"
              style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '7px', color: 'white', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '3px' }}>
              <span>Subtotal</span><span>{R(subtotal)}</span>
            </div>
            {disc > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f59e0b', marginBottom: '3px' }}>
              <span>Discount ({disc}%)</span><span>−{R(discountAmt)}</span>
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: '#00C4A0' }}>
              <span>TOTAL</span><span>{R(total)}</span>
            </div>
          </div>

          <button onClick={() => (cart.length > 0 || extraCart.length > 0) && setShowPayment(true)}
            disabled={cart.length === 0 && extraCart.length === 0}
            style={{ padding: '13px', backgroundColor: (cart.length > 0 || extraCart.length > 0) ? '#00C4A0' : '#334155', border: 'none', borderRadius: '10px', color: (cart.length > 0 || extraCart.length > 0) ? '#0f172a' : '#64748b', fontWeight: '800', fontSize: '14px', cursor: (cart.length > 0 || extraCart.length > 0) ? 'pointer' : 'not-allowed', marginBottom: '6px' }}>
            {(cart.length > 0 || extraCart.length > 0) ? `Charge ${R(total)}` : 'Add items to cart'}
          </button>
          <button onClick={() => { setCart([]); setExtraCart([]) }} style={{ padding: '8px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '7px', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}>
            Clear Cart
          </button>
        </div>
      </div>
    </Shell>
  )
}
