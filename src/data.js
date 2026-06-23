export const KEYS = {
  PRODUCTS: 'sf_products',
  SALES: 'sf_sales',
  GRV: 'sf_grv',
  BUTCHERY: 'sf_butchery',
  STOCK_COUNTS: 'sf_stock_counts',
  WASTAGE: 'sf_wastage',
  USERS: 'sf_users',
  TILLS: 'sf_tills',
  ASSIGNMENTS: 'sf_assignments',
  SHIFTS: 'sf_shifts',
  CASHUP: 'sf_cashup',
  CUSTOMERS: 'sf_customers',
  ATTENDANCE: 'sf_attendance',
  PETTY_CASH: 'sf_petty_cash',
  MENU_ITEMS: 'sf_menu_items',
  SETTINGS: 'sf_settings',
  VOIDS: 'sf_voids',
  CREDIT_NOTES: 'sf_credit_notes',
  ONLINE_ORDERS: 'sf_online_orders',
  ACTIVITY_LOG: 'sf_activity_log',
  CHARCOAL: 'sf_charcoal',
  MANUFACTURING: 'sf_manufacturing',
  CARCASS: 'sf_carcass',
  ABANDONED: 'sf_abandoned',
}

export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const load = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch { return fallback }
}

export const save = (key, data) => localStorage.setItem(key, JSON.stringify(data))

export const R = (n) => `R ${(+(n || 0)).toFixed(2)}`
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
export const today = () => new Date().toISOString().slice(0, 10)
export const nowISO = () => new Date().toISOString()

export const getSettings = () => load(KEYS.SETTINGS, DEFAULT_SETTINGS)
export const saveSettings = (s) => save(KEYS.SETTINGS, s)

// ── Seed Data ──────────────────────────────────────────────────────────────

export const SEED_PRODUCTS = [
  { id: 'p1', name: 'Beef Steak', sku: 'BUT001', category: 'Beef', store: 'butchery', price: 180, costPrice: 95, unit: 'kg', stock: 25, minStock: 5, active: true },
  { id: 'p2', name: 'Chicken Braai Pack', sku: 'BUT002', category: 'Chicken', store: 'butchery', price: 65, costPrice: 38, unit: 'kg', stock: 30, minStock: 10, active: true },
  { id: 'p3', name: 'Pork Ribs', sku: 'BUT003', category: 'Pork', store: 'butchery', price: 95, costPrice: 55, unit: 'kg', stock: 18, minStock: 5, active: true },
  { id: 'p4', name: 'Beef Mince', sku: 'BUT004', category: 'Beef', store: 'butchery', price: 75, costPrice: 45, unit: 'kg', stock: 20, minStock: 8, active: true },
  { id: 'p5', name: 'Lamb Chops', sku: 'BUT005', category: 'Lamb', store: 'butchery', price: 220, costPrice: 145, unit: 'kg', stock: 12, minStock: 4, active: true },
  { id: 'p6', name: 'Castle Lager 750ml', sku: 'BOT001', category: 'Beer', store: 'bottle', price: 22, costPrice: 14, unit: 'each', stock: 120, minStock: 24, active: true },
  { id: 'p7', name: 'Amstel 6-pack', sku: 'BOT002', category: 'Beer', store: 'bottle', price: 95, costPrice: 65, unit: 'each', stock: 48, minStock: 12, active: true },
  { id: 'p8', name: 'Jameson 750ml', sku: 'BOT003', category: 'Spirits', store: 'bottle', price: 385, costPrice: 268, unit: 'each', stock: 15, minStock: 3, active: true },
  { id: 'p9', name: 'Savanna Dry 330ml', sku: 'BOT004', category: 'Cider', store: 'bottle', price: 28, costPrice: 18, unit: 'each', stock: 96, minStock: 24, active: true },
  { id: 'p10', name: 'Klipdrift Export 1L', sku: 'BOT005', category: 'Spirits', store: 'bottle', price: 225, costPrice: 155, unit: 'each', stock: 20, minStock: 5, active: true },
  { id: 'p11', name: 'Chenin Blanc 750ml', sku: 'BOT006', category: 'Wine', store: 'bottle', price: 85, costPrice: 55, unit: 'each', stock: 24, minStock: 6, active: true },
  { id: 'p12', name: 'Sauvignon Blanc 750ml', sku: 'BOT007', category: 'Wine', store: 'bottle', price: 95, costPrice: 62, unit: 'each', stock: 18, minStock: 6, active: true },
  { id: 'p13', name: 'Shiraz 750ml', sku: 'BOT008', category: 'Wine', store: 'bottle', price: 110, costPrice: 72, unit: 'each', stock: 18, minStock: 6, active: true },
  { id: 'p14', name: 'Rosé 750ml', sku: 'BOT009', category: 'Wine', store: 'bottle', price: 90, costPrice: 58, unit: 'each', stock: 12, minStock: 4, active: true },
  { id: 'p15', name: 'Méthode Cap Classique', sku: 'BOT010', category: 'Wine', store: 'bottle', price: 165, costPrice: 110, unit: 'each', stock: 8, minStock: 3, active: true },
]

export const SEED_MENU_ITEMS = [
  { id: 'mi1', name: 'Pap (Small)', category: 'Sides', type: 'extra', price: 15, costPrice: 5, unit: 'each', available: true, printToBraai: true, store: 'butchery' },
  { id: 'mi2', name: 'Pap (Large)', category: 'Sides', type: 'extra', price: 25, costPrice: 8, unit: 'each', available: true, printToBraai: true, store: 'butchery' },
  { id: 'mi3', name: 'Achaar', category: 'Condiments', type: 'extra', price: 15, costPrice: 6, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
  { id: 'mi4', name: 'Chakalaka', category: 'Condiments', type: 'extra', price: 20, costPrice: 8, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
  { id: 'mi5', name: 'Rolls (Each)', category: 'Sides', type: 'extra', price: 10, costPrice: 4, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
  { id: 'mi6', name: 'Tomato & Onion', category: 'Sides', type: 'extra', price: 25, costPrice: 10, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
  { id: 'mi7', name: 'Braai Service', category: 'Service', type: 'braai_service', price: 30, costPrice: 0, unit: 'each', available: true, printToBraai: true, store: 'butchery' },
  { id: 'mi8', name: 'Mushroom Sauce', category: 'Sauces', type: 'extra', price: 20, costPrice: 8, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
  { id: 'mi9', name: 'Garlic Bread', category: 'Sides', type: 'extra', price: 18, costPrice: 7, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
  { id: 'mi10', name: 'Coleslaw', category: 'Sides', type: 'extra', price: 20, costPrice: 9, unit: 'each', available: true, printToBraai: false, store: 'butchery' },
]

export const SEED_TILLS = [
  { id: 't1', name: 'Till 1', number: 1, store: 'butchery', active: true },
  { id: 't2', name: 'Till 2', number: 2, store: 'bottle', active: true },
]

export const SEED_SHIFTS = [
  { id: 'sh1', name: 'Morning', startTime: '06:00', endTime: '14:00', store: 'both', active: true },
  { id: 'sh2', name: 'Afternoon', startTime: '14:00', endTime: '22:00', store: 'both', active: true },
  { id: 'sh3', name: 'Full Day', startTime: '06:00', endTime: '22:00', store: 'both', active: true },
]

export const SEED_USERS = [
  { id: 'u1', username: 'owner', password: '1234', name: 'Store Owner', role: 'owner', store: 'both', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'u2', username: 'butchery_manager', password: '1234', name: 'Butchery Manager', role: 'manager', store: 'butchery', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'u3', username: 'bottle_manager', password: '1234', name: 'Bottle Manager', role: 'manager', store: 'bottle', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'u4', username: 'butchery_cashier', password: '1234', name: 'Butchery Cashier', role: 'cashier', store: 'butchery', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'u5', username: 'bottle_cashier', password: '1234', name: 'Bottle Cashier', role: 'cashier', store: 'bottle', active: true, createdAt: '2025-01-01T00:00:00.000Z' },
]

export const DEFAULT_SETTINGS = {
  storeName: 'ShopFlow Store',
  storeAddress: '',
  storePhone: '',
  vatNumber: '',
  vatRate: 0,
  currency: 'R',
  chisaNyamaMode: true,
  requireAssignment: true,
  braaiAreaLabel: 'Braai Area',
  allowSplitPayment: true,
  receiptFooter: 'Thank you for your business!',
  orderNumberPrefix: 'ORD',
  printBraaiOrders: true,
  whatsappNumber: '',
  onlineOrdersEnabled: true,
}

export function initData() {
  if (!localStorage.getItem(KEYS.PRODUCTS)) save(KEYS.PRODUCTS, SEED_PRODUCTS)
  if (!localStorage.getItem(KEYS.USERS)) save(KEYS.USERS, SEED_USERS)
  if (!localStorage.getItem(KEYS.TILLS)) save(KEYS.TILLS, SEED_TILLS)
  if (!localStorage.getItem(KEYS.SHIFTS)) save(KEYS.SHIFTS, SEED_SHIFTS)
  if (!localStorage.getItem(KEYS.MENU_ITEMS)) save(KEYS.MENU_ITEMS, SEED_MENU_ITEMS)
  if (!localStorage.getItem(KEYS.SETTINGS)) save(KEYS.SETTINGS, DEFAULT_SETTINGS)
  if (!localStorage.getItem(KEYS.ONLINE_ORDERS)) save(KEYS.ONLINE_ORDERS, [])
  if (!localStorage.getItem(KEYS.ACTIVITY_LOG)) save(KEYS.ACTIVITY_LOG, [])
  if (!localStorage.getItem(KEYS.CHARCOAL)) save(KEYS.CHARCOAL, [])
  if (!localStorage.getItem(KEYS.ABANDONED)) save(KEYS.ABANDONED, [])
  if (!localStorage.getItem(KEYS.MANUFACTURING)) save(KEYS.MANUFACTURING, [])
  if (!localStorage.getItem(KEYS.CARCASS)) save(KEYS.CARCASS, [])
}

export function logActivity(user, action, details = {}) {
  try {
    const log = load(KEYS.ACTIVITY_LOG, [])
    const entry = { id: genId(), timestamp: nowISO(), userId: user?.id || 'system', userName: user?.name || 'System', userRole: user?.role || 'system', action, details }
    save(KEYS.ACTIVITY_LOG, [...log.slice(-4999), entry])
  } catch { /* never crash on logging */ }
}

// ── Order number generator ─────────────────────────────────────────────────
export function nextOrderNumber() {
  const settings = getSettings()
  const prefix = settings.orderNumberPrefix || 'ORD'
  const sales = load(KEYS.SALES)
  const d = new Date()
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const todaySales = sales.filter(s => s.date && s.date.startsWith(today()))
  return `${prefix}-${stamp}-${String(todaySales.length + 1).padStart(3, '0')}`
}

// ── Print helpers ──────────────────────────────────────────────────────────
export function printBraaiTicket(order, settings = {}) {
  const win = window.open('', '_blank', 'width=320,height=500')
  if (!win) return
  const label = settings.braaiAreaLabel || 'Braai Area'
  const items = [...(order.items || []), ...(order.extras || [])].filter(i => i.printToBraai !== false)
  win.document.write(`<!DOCTYPE html><html><head><title>Braai Ticket</title>
  <style>
    body{font-family:monospace;font-size:14px;padding:10px;width:270px}
    h2{text-align:center;margin:4px 0;font-size:16px}
    .sub{text-align:center;font-size:12px;color:#555;margin-bottom:8px}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;margin:4px 0}
    .big{font-size:20px;font-weight:bold;text-align:center;margin:6px 0}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>🔥 ${label.toUpperCase()}</h2>
  <div class="sub">${fmtDateTime(order.date)}</div>
  <div class="big">#${order.orderNumber}</div>
  <hr/>
  ${order.customerName ? `<div class="row"><span>Customer:</span><span>${order.customerName}</span></div>` : ''}
  ${order.tableNumber ? `<div class="row"><span>Table/Ref:</span><span>${order.tableNumber}</span></div>` : ''}
  <hr/>
  ${items.map(i => `<div class="row"><span>${i.name}</span><span>${i.qty}${i.unit === 'kg' ? 'kg' : ' x'}</span></div>`).join('')}
  <hr/>
  <div style="text-align:center;margin-top:8px;font-size:12px">Please prepare this order</div>
  </body></html>`)
  win.print()
  setTimeout(() => win.close(), 500)
}

export function printReceipt(order, settings = {}) {
  const win = window.open('', '_blank', 'width=320,height=600')
  if (!win) return
  const storeName = settings.storeName || 'ShopFlow Store'
  const footer = settings.receiptFooter || 'Thank you!'
  const allItems = [...(order.items || []), ...(order.extras || [])]
  win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
  <style>
    body{font-family:monospace;font-size:13px;padding:10px;width:270px}
    h2{text-align:center;font-size:15px;margin:4px 0}
    .sub{text-align:center;font-size:11px;color:#555}
    hr{border:none;border-top:1px dashed #000;margin:5px 0}
    .row{display:flex;justify-content:space-between;margin:3px 0}
    .total{font-weight:bold;font-size:15px}
    .footer{text-align:center;font-size:11px;margin-top:8px}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>${storeName}</h2>
  ${settings.storeAddress ? `<div class="sub">${settings.storeAddress}</div>` : ''}
  ${settings.storePhone ? `<div class="sub">Tel: ${settings.storePhone}</div>` : ''}
  ${settings.vatNumber ? `<div class="sub">VAT: ${settings.vatNumber}</div>` : ''}
  <hr/>
  <div class="sub">${fmtDateTime(order.date)}</div>
  <div class="sub">Order #: ${order.orderNumber} | Cashier: ${order.cashier}</div>
  <hr/>
  ${allItems.map(i => `<div class="row"><span>${i.name} × ${i.qty}${i.unit === 'kg' ? 'kg' : ''}</span><span>R ${(i.total || 0).toFixed(2)}</span></div>`).join('')}
  <hr/>
  ${order.discountAmt > 0 ? `<div class="row"><span>Discount (${order.discountPct}%)</span><span>-R ${order.discountAmt.toFixed(2)}</span></div>` : ''}
  <div class="row total"><span>TOTAL</span><span>R ${(order.total || 0).toFixed(2)}</span></div>
  <hr/>
  <div class="row"><span>Payment</span><span>${order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'card' ? 'Card' : 'Split'}</span></div>
  ${order.paymentMethod === 'cash' ? `<div class="row"><span>Tendered</span><span>R ${(order.amountTendered || 0).toFixed(2)}</span></div><div class="row"><span>Change</span><span>R ${(order.change || 0).toFixed(2)}</span></div>` : ''}
  <div class="footer">${footer}</div>
  </body></html>`)
  win.print()
  setTimeout(() => win.close(), 500)
}
