import { useState, useEffect } from 'react'
import Shell from '../components/Shell'
import { KEYS, load, save, R, genId } from '../data'

const UNITS = ['kg', 'each', 'litre', 'pack', 'bottle', 'box']
const BUT_CATS = ['Beef', 'Chicken', 'Pork', 'Lamb', 'Fish', 'Other Meat']
const BOT_CATS = ['Beer', 'Cider', 'Wine', 'Spirits', 'RTD', 'Other']

const inp = (field, label, form, setForm, type = 'text', extra = {}) => (
  <div key={field} style={{ marginBottom: '14px' }}>
    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
    {extra.options ? (
      <select value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
        {extra.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
    )}
  </div>
)

export default function Inventory({ user, onBack }) {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [storeFilter, setStoreFilter] = useState(user.store === 'both' ? 'all' : user.store)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjAmt, setAdjAmt] = useState('')

  useEffect(() => { setProducts(load(KEYS.PRODUCTS)) }, [])

  const persist = (updated) => { save(KEYS.PRODUCTS, updated); setProducts(updated) }

  const openAdd = () => {
    const defaultStore = user.store === 'both' ? 'butchery' : user.store
    setForm({ name: '', sku: '', category: defaultStore === 'butchery' ? 'Beef' : 'Beer', store: defaultStore, price: '', costPrice: '', unit: defaultStore === 'butchery' ? 'kg' : 'each', stock: '', minStock: '', active: true })
    setModal('add')
  }

  const openEdit = (p) => { setForm({ ...p }); setModal('edit') }

  const saveProduct = () => {
    if (!form.name.trim()) { alert('Product name is required'); return }
    if (!form.price || !form.costPrice) { alert('Selling price and cost price are required'); return }
    const all = load(KEYS.PRODUCTS)
    if (modal === 'add') {
      persist([...all, { ...form, id: genId(), price: +form.price, costPrice: +form.costPrice, stock: +(form.stock || 0), minStock: +(form.minStock || 0) }])
    } else {
      persist(all.map(p => p.id === form.id ? { ...form, price: +form.price, costPrice: +form.costPrice, stock: +form.stock, minStock: +form.minStock } : p))
    }
    setModal(null)
  }

  const applyAdjust = () => {
    const amt = parseFloat(adjAmt)
    if (isNaN(amt)) { alert('Enter a valid number (e.g. +10 or -5)'); return }
    const all = load(KEYS.PRODUCTS)
    persist(all.map(p => p.id === adjustModal.id ? { ...p, stock: Math.max(0, p.stock + amt) } : p))
    setAdjustModal(null)
    setAdjAmt('')
  }

  const toggleActive = (id) => {
    const all = load(KEYS.PRODUCTS)
    persist(all.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  const visible = products.filter(p => {
    const matchStore = storeFilter === 'all' || p.store === storeFilter
    const q = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && p.active) || (statusFilter === 'inactive' && !p.active) || (statusFilter === 'low' && p.active && p.stock <= p.minStock) || (statusFilter === 'out' && p.stock <= 0)
    return matchStore && matchSearch && matchStatus
  })

  const activeProds = products.filter(p => p.active)
  const cats = form.store === 'butchery' ? BUT_CATS : BOT_CATS

  const Modal = () => (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>{modal === 'add' ? 'Add Product' : 'Edit Product'}</h3>
        {inp('name', 'Product Name *', form, setForm)}
        {inp('sku', 'SKU / Barcode', form, setForm)}
        {user.store === 'both' && inp('store', 'Store', form, setForm, 'text', { options: ['butchery', 'bottle'] })}
        {inp('category', 'Category', form, setForm, 'text', { options: cats })}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {inp('price', 'Selling Price (R) *', form, setForm, 'number')}
          {inp('costPrice', 'Cost Price (R) *', form, setForm, 'number')}
          {inp('stock', 'Current Stock', form, setForm, 'number')}
          {inp('minStock', 'Min Stock Level', form, setForm, 'number')}
        </div>
        {inp('unit', 'Unit', form, setForm, 'text', { options: UNITS })}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
          <button onClick={saveProduct} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  )

  return (
    <Shell title="Inventory" onBack={onBack} actions={
      <button onClick={openAdd} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + Add Product
      </button>
    }>
      {modal && <Modal />}

      {adjustModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '100%' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px' }}>Adjust Stock</h3>
            <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px' }}>{adjustModal.name} — Current: <strong style={{ color: 'white' }}>{adjustModal.stock} {adjustModal.unit}</strong></p>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Adjustment amount (+/-)</label>
            <input type="number" value={adjAmt} onChange={e => setAdjAmt(e.target.value)} placeholder="+10 or -5" autoFocus
              style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '18px', boxSizing: 'border-box', outline: 'none', marginBottom: '20px' }} />
            {adjAmt && <p style={{ color: '#00C4A0', fontWeight: '700', margin: '-12px 0 16px', fontSize: '14px' }}>
              New stock: {Math.max(0, adjustModal.stock + (parseFloat(adjAmt) || 0))} {adjustModal.unit}
            </p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setAdjustModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              <button onClick={applyAdjust} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Active Products', value: activeProds.length, color: '#00C4A0' },
          { label: 'Low Stock', value: activeProds.filter(p => p.stock <= p.minStock && p.stock > 0).length, color: '#f59e0b' },
          { label: 'Out of Stock', value: products.filter(p => p.stock <= 0).length, color: '#dc2626' },
          { label: 'Stock Value (Cost)', value: R(activeProds.reduce((s, p) => s + p.stock * p.costPrice, 0)), color: '#818cf8' },
          { label: 'Stock Value (Retail)', value: R(activeProds.reduce((s, p) => s + p.stock * p.price, 0)), color: '#34d399' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: s.value.toString().length > 6 ? '14px' : '20px', fontWeight: '800', color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '180px', padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', outline: 'none' }} />
        {user.store === 'both' && (
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)}
            style={{ padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px' }}>
            <option value="all">All Stores</option>
            <option value="butchery">Butchery</option>
            <option value="bottle">Bottle Store</option>
          </select>
        )}
        {[['active', 'Active'], ['low', 'Low Stock'], ['out', 'Out of Stock'], ['inactive', 'Inactive'], ['all', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)} style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', backgroundColor: statusFilter === val ? '#00C4A0' : '#1e293b', color: statusFilter === val ? '#0f172a' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a' }}>
              {['Product', 'SKU', 'Store', 'Category', 'Cost', 'Price', 'Margin', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i) => {
              const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price * 100).toFixed(0) : 0
              const stockColor = p.stock <= 0 ? '#dc2626' : p.stock <= p.minStock ? '#f59e0b' : '#94a3b8'
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #0f172a', opacity: p.active ? 1 : 0.45 }}>
                  <td style={{ padding: '11px 14px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap' }}>{p.name}</td>
                  <td style={{ padding: '11px 14px', color: '#64748b', fontFamily: 'monospace' }}>{p.sku}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: p.store === 'butchery' ? '#7f1d1d33' : '#78350f33', color: p.store === 'butchery' ? '#fca5a5' : '#fcd34d', fontSize: '11px', fontWeight: '600', border: `1px solid ${p.store === 'butchery' ? '#7f1d1d' : '#92400e'}` }}>
                      {p.store}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{p.category}</td>
                  <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{R(p.costPrice)}</td>
                  <td style={{ padding: '11px 14px', fontWeight: '700' }}>{R(p.price)}</td>
                  <td style={{ padding: '11px 14px', color: +margin >= 40 ? '#4ade80' : +margin >= 20 ? '#f59e0b' : '#dc2626', fontWeight: '600' }}>{margin}%</td>
                  <td style={{ padding: '11px 14px', color: stockColor, fontWeight: '700' }}>{p.stock} <span style={{ fontSize: '11px', fontWeight: '400' }}>{p.unit}</span></td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: p.active ? '#14532d55' : '#1e293b', color: p.active ? '#4ade80' : '#64748b', fontSize: '11px', border: `1px solid ${p.active ? '#166534' : '#334155'}` }}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setAdjustModal(p)} style={{ padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '5px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>± Stock</button>
                      <button onClick={() => openEdit(p)} style={{ padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '5px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                      <button onClick={() => toggleActive(p.id)} style={{ padding: '4px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '5px', color: p.active ? '#dc2626' : '#16a34a', cursor: 'pointer', fontSize: '11px' }}>
                        {p.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No products found</p>}
      </div>
    </Shell>
  )
}
