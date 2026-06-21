import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, genId, getSettings, saveSettings } from '../../data'

export default function Settings({ user, onBack }) {
  const [settings, setSettings] = useState(getSettings())
  const [tills, setTills] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [activeTab, setActiveTab] = useState('store')
  const [tillForm, setTillForm] = useState({})
  const [tillModal, setTillModal] = useState(null)
  const [menuModal, setMenuModal] = useState(null)
  const [menuForm, setMenuForm] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTills(load(KEYS.TILLS))
    setMenuItems(load(KEYS.MENU_ITEMS))
  }, [])

  const persistSettings = (s) => { saveSettings(s); setSettings(s); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const update = (key, val) => persistSettings({ ...settings, [key]: val })

  const persistTills = (updated) => { save(KEYS.TILLS, updated); setTills(updated) }
  const saveTill = () => {
    if (!tillForm.name?.trim()) { alert('Till name required'); return }
    const all = load(KEYS.TILLS)
    if (tillModal === 'add') persistTills([...all, { ...tillForm, id: genId() }])
    else persistTills(all.map(t => t.id === tillForm.id ? { ...tillForm } : t))
    setTillModal(null)
  }

  const persistMenuItems = (updated) => { save(KEYS.MENU_ITEMS, updated); setMenuItems(updated) }
  const saveMenuItem = () => {
    if (!menuForm.name?.trim() || !menuForm.price) { alert('Name and price required'); return }
    const all = load(KEYS.MENU_ITEMS)
    if (menuModal === 'add') persistMenuItems([...all, { ...menuForm, id: genId(), price: +menuForm.price, costPrice: +(menuForm.costPrice || 0) }])
    else persistMenuItems(all.map(m => m.id === menuForm.id ? { ...menuForm, price: +menuForm.price, costPrice: +(menuForm.costPrice || 0) } : m))
    setMenuModal(null)
  }

  const S = (field, label, type = 'text', opts = {}) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
      {type === 'toggle' ? (
        <div onClick={() => update(field, !settings[field])} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: settings[field] ? '#00C4A0' : '#334155', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '3px', left: settings[field] ? '23px' : '3px', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: '14px', color: settings[field] ? '#00C4A0' : '#94a3b8', fontWeight: '600' }}>{settings[field] ? 'Enabled' : 'Disabled'}</span>
        </div>
      ) : opts.options ? (
        <select value={settings[field] ?? ''} onChange={e => update(field, e.target.value)}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', maxWidth: '320px', boxSizing: 'border-box' }}>
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={settings[field] ?? ''} onChange={e => update(field, type === 'number' ? +e.target.value : e.target.value)}
          style={{ width: '100%', maxWidth: '320px', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
      )}
    </div>
  )

  const TABS = [['store', 'Store Info'], ['pos', 'POS Settings'], ['tills', 'Tills'], ['menu', 'Menu & Extras']]

  return (
    <Shell title="Settings" onBack={onBack} actions={
      saved && <span style={{ color: '#00C4A0', fontSize: '13px', fontWeight: '700' }}>✓ Saved</span>
    }>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === id ? '#0A6C6B' : 'transparent', color: activeTab === id ? 'white' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'store' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', maxWidth: '500px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Store Information</h3>
          {S('storeName', 'Store Name')}
          {S('storeAddress', 'Address')}
          {S('storePhone', 'Phone Number')}
          {S('vatNumber', 'VAT Number')}
          {S('vatRate', 'VAT Rate (%)', 'number')}
          {S('receiptFooter', 'Receipt Footer Message')}
          {S('orderNumberPrefix', 'Order Number Prefix (e.g. ORD)')}
        </div>
      )}

      {activeTab === 'pos' && (
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', maxWidth: '500px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>POS Configuration</h3>
          <div style={{ marginBottom: '24px' }}>{S('requireAssignment', 'Require cashier assignment before sales', 'toggle')}</div>
          <div style={{ marginBottom: '24px' }}>{S('chisaNyamaMode', 'Enable Chisa Nyama / Braai mode (extras, braai tickets)', 'toggle')}</div>
          <div style={{ marginBottom: '24px' }}>{S('printBraaiOrders', 'Print braai ticket on dine-in orders', 'toggle')}</div>
          <div style={{ marginBottom: '24px' }}>{S('allowSplitPayment', 'Allow split payment (cash + card)', 'toggle')}</div>
          {S('braaiAreaLabel', 'Braai Area Label (printed on braai tickets)')}
        </div>
      )}

      {activeTab === 'tills' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button onClick={() => { setTillForm({ name: '', number: tills.length + 1, store: 'butchery', active: true }); setTillModal('add') }}
              style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              + Add Till
            </button>
          </div>

          {tillModal && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
              <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '100%' }}>
                <h3 style={{ margin: '0 0 20px' }}>{tillModal === 'add' ? 'Add Till' : 'Edit Till'}</h3>
                {[{ f: 'name', l: 'Till Name *', t: 'text' }, { f: 'number', l: 'Till Number', t: 'number' }].map(({ f, l, t }) => (
                  <div key={f} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{l}</label>
                    <input type={t} value={tillForm[f] ?? ''} onChange={e => setTillForm(x => ({ ...x, [f]: e.target.value }))}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                ))}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Store</label>
                  <select value={tillForm.store || 'butchery'} onChange={e => setTillForm(x => ({ ...x, store: e.target.value }))}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="butchery">Butchery</option>
                    <option value="bottle">Bottle Store</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setTillModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveTill} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Save</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Name', 'Number', 'Store', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {tills.map((t, i) => (
                  <tr key={t.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '11px 14px', fontWeight: '600' }}>{t.name}</td>
                    <td style={{ padding: '11px 14px', color: '#94a3b8' }}>#{t.number}</td>
                    <td style={{ padding: '11px 14px', textTransform: 'capitalize', color: '#64748b' }}>{t.store}</td>
                    <td style={{ padding: '11px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: t.active ? '#14532d33' : '#1e293b', color: t.active ? '#4ade80' : '#64748b', fontSize: '11px' }}>{t.active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setTillForm({ ...t }); setTillModal('edit') }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                        <button onClick={() => { const all = load(KEYS.TILLS); persistTills(all.map(x => x.id === t.id ? { ...x, active: !x.active } : x)) }} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: t.active ? '#dc2626' : '#16a34a', cursor: 'pointer', fontSize: '11px' }}>{t.active ? 'Disable' : 'Enable'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Manage extras, sides & braai service items shown in Orders</p>
            <button onClick={() => { setMenuForm({ name: '', category: 'Sides', type: 'extra', price: '', costPrice: '', unit: 'each', available: true, printToBraai: false, store: 'butchery' }); setMenuModal('add') }}
              style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              + Add Item
            </button>
          </div>

          {menuModal && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
              <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 20px' }}>{menuModal === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h3>
                {[{ f: 'name', l: 'Name *' }, { f: 'category', l: 'Category' }].map(({ f, l }) => (
                  <div key={f} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{l}</label>
                    <input type="text" value={menuForm[f] ?? ''} onChange={e => setMenuForm(x => ({ ...x, [f]: e.target.value }))}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                ))}
                {[{ f: 'type', l: 'Type', opts: [['extra','Extra/Side'],['braai_service','Braai Service']] }, { f: 'store', l: 'Store', opts: [['butchery','Butchery'],['bottle','Bottle']] }].map(({ f, l, opts }) => (
                  <div key={f} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{l}</label>
                    <select value={menuForm[f] ?? ''} onChange={e => setMenuForm(x => ({ ...x, [f]: e.target.value }))}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                      {opts.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  {[{ f: 'price', l: 'Price (R) *' }, { f: 'costPrice', l: 'Cost Price (R)' }].map(({ f, l }) => (
                    <div key={f}>
                      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{l}</label>
                      <input type="number" value={menuForm[f] ?? ''} onChange={e => setMenuForm(x => ({ ...x, [f]: e.target.value }))}
                        style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[['available', 'Available'], ['printToBraai', 'Print to Braai']].map(([f, l]) => (
                    <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#94a3b8' }}>
                      <input type="checkbox" checked={!!menuForm[f]} onChange={e => setMenuForm(x => ({ ...x, [f]: e.target.checked }))} />
                      {l}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setMenuModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveMenuItem} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Save</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{ backgroundColor: '#0f172a' }}>{['Name', 'Category', 'Type', 'Price', 'Cost', 'Braai Print', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {menuItems.map((m, i) => (
                  <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', opacity: m.available ? 1 : 0.5 }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{m.name}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{m.category}</td>
                    <td style={{ padding: '10px 14px', color: m.type === 'braai_service' ? '#f59e0b' : '#64748b', fontSize: '11px' }}>{m.type}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#00C4A0' }}>R {m.price}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>R {m.costPrice || 0}</td>
                    <td style={{ padding: '10px 14px' }}>{m.printToBraai ? <span style={{ color: '#f59e0b' }}>🔥 Yes</span> : <span style={{ color: '#64748b' }}>No</span>}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: m.available ? '#14532d33' : '#1e293b', color: m.available ? '#4ade80' : '#64748b', fontSize: '11px' }}>{m.available ? 'On' : 'Off'}</span></td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => { setMenuForm({ ...m }); setMenuModal('edit') }} style={{ padding: '3px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '5px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                        <button onClick={() => { const all = load(KEYS.MENU_ITEMS); persistMenuItems(all.map(x => x.id === m.id ? { ...x, available: !x.available } : x)) }} style={{ padding: '3px 8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '5px', color: m.available ? '#dc2626' : '#16a34a', cursor: 'pointer', fontSize: '11px' }}>{m.available ? 'Disable' : 'Enable'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Shell>
  )
}
