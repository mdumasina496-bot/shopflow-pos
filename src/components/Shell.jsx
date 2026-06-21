export default function Shell({ title, subtitle, onBack, children, actions }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
      <div style={{ backgroundColor: '#0A6C6B', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={onBack}
          style={{ background: 'rgba(0,0,0,0.25)', border: 'none', borderRadius: '8px', color: 'white', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap' }}
        >
          ← Back
        </button>
        <img src="/logo-main.png" alt="ShopFlow POS" style={{ height: '36px', objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          {subtitle && <p style={{ margin: 0, fontSize: '11px', color: '#99f6e4' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{actions}</div>}
      </div>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}
