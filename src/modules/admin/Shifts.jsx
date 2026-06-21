import { useState, useEffect } from 'react'
import Shell from '../../components/Shell'
import { KEYS, load, save, genId } from '../../data'

export default function Shifts({ user, onBack }) {
  const [shifts, setShifts] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})

  useEffect(() => { setShifts(load(KEYS.SHIFTS)) }, [])

  const persist = (updated) => { save(KEYS.SHIFTS, updated); setShifts(updated) }

  const openAdd = () => setForm({ name: '', startTime: '06:00', endTime: '14:00', store: 'both', active: true }) || setModal('add')
  const openEdit = (s) => { setForm({ ...s }); setModal('edit') }

  const saveShift = () => {
    if (!form.name.trim()) { alert('Shift name is required'); return }
    const all = load(KEYS.SHIFTS)
    if (modal === 'add') persist([...all, { ...form, id: genId() }])
    else persist(all.map(s => s.id === form.id ? { ...form } : s))
    setModal(null)
  }

  const toggle = (id) => {
    const all = load(KEYS.SHIFTS)
    persist(all.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const F = (field, label, type = 'text', opts = {}) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
      {opts.options ? (
        <select value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
      )}
    </div>
  )

  return (
    <Shell title="Shifts" onBack={onBack} actions={
      <button onClick={openAdd} style={{ padding: '8px 16px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
        + Add Shift
      </button>
    }>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 20px' }}>{modal === 'add' ? 'Add Shift' : 'Edit Shift'}</h3>
            {F('name', 'Shift Name *')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {F('startTime', 'Start Time', 'time')}
              {F('endTime', 'End Time', 'time')}
            </div>
            {F('store', 'Store', 'text', { options: [{ value: 'both', label: 'Both Stores' }, { value: 'butchery', label: 'Butchery' }, { value: 'bottle', label: 'Bottle Store' }] })}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveShift} style={{ flex: 1, padding: '12px', backgroundColor: '#00C4A0', border: 'none', borderRadius: '8px', color: '#0f172a', fontWeight: '700', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
        {shifts.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No shifts configured yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a' }}>
                {['Shift Name', 'Start', 'End', 'Duration', 'Store', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((s, i) => {
                const [sh, sm] = s.startTime.split(':').map(Number)
                const [eh, em] = s.endTime.split(':').map(Number)
                const hrs = ((eh * 60 + em) - (sh * 60 + sm) + 1440) % 1440 / 60
                return (
                  <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', opacity: s.active ? 1 : 0.5 }}>
                    <td style={{ padding: '11px 14px', fontWeight: '600' }}>{s.name}</td>
                    <td style={{ padding: '11px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>{s.startTime}</td>
                    <td style={{ padding: '11px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>{s.endTime}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{hrs.toFixed(1)}h</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: '#1e3a8a33', color: '#60a5fa', fontSize: '11px', textTransform: 'capitalize' }}>{s.store === 'both' ? 'All Stores' : s.store}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', backgroundColor: s.active ? '#14532d33' : '#1e293b', color: s.active ? '#4ade80' : '#64748b', fontSize: '11px' }}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(s)} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                        <button onClick={() => toggle(s.id)} style={{ padding: '4px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: s.active ? '#dc2626' : '#16a34a', cursor: 'pointer', fontSize: '11px' }}>
                          {s.active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  )
}
