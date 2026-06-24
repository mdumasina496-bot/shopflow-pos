import { useState } from 'react'
import Shell from '../components/Shell'

const C = {
  teal: '#00C4A0', dark: '#0A6C6B', card: '#1e293b', bg: '#0f172a',
  border: '#334155', muted: '#64748b', sub: '#94a3b8',
  red: '#dc2626', amber: '#f59e0b', green: '#16a34a', purple: '#7c3aed',
}

const Step = ({ n, children }) => (
  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
    <div style={{ minWidth: '28px', height: '28px', borderRadius: '50%', backgroundColor: C.dark, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>{n}</div>
    <div style={{ paddingTop: '4px', fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6 }}>{children}</div>
  </div>
)

const Tip = ({ children, type = 'info' }) => {
  const styles = {
    info:    { bg: 'rgba(0,196,160,0.1)',   border: C.teal,   icon: '💡', color: '#99f6e4' },
    warn:    { bg: 'rgba(245,158,11,0.1)',  border: C.amber,  icon: '⚠️', color: '#fcd34d' },
    danger:  { bg: 'rgba(220,38,38,0.1)',   border: C.red,    icon: '🚨', color: '#fca5a5' },
    rule:    { bg: 'rgba(129,140,248,0.1)', border: '#818cf8', icon: '📌', color: '#c7d2fe' },
  }
  const s = styles[type]
  return (
    <div style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', gap: '10px', fontSize: '13px' }}>
      <span>{s.icon}</span>
      <span style={{ color: s.color, lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ backgroundColor: C.card, borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: 'white' }}>
        <span style={{ fontWeight: '700', fontSize: '15px' }}>{title}</span>
        <span style={{ color: C.muted, fontSize: '18px', lineHeight: 1 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  )
}

const Badge = ({ children, color = C.teal }) => (
  <span style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44`, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', marginLeft: '8px' }}>
    {children}
  </span>
)

const ROLES = [
  { id: 'cashier', label: '🧾 Cashier', color: '#0A6C6B' },
  { id: 'manager', label: '👔 Manager', color: '#1e40af' },
  { id: 'owner',   label: '🏪 Owner',   color: '#7c3aed' },
  { id: 'all',     label: '📖 Full Reference', color: '#334155' },
]

// ─────────────────────────────────────────────────────────────────────────────
// CASHIER CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function CashierGuide() {
  return (
    <div>
      <div style={{ backgroundColor: 'rgba(10,108,107,0.15)', border: '1px solid #0A6C6B', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '16px', color: C.teal }}>Cashier Guide</p>
        <p style={{ margin: 0, fontSize: '13px', color: C.sub }}>Everything you need to know for your daily shift on ShopFlow POS.</p>
      </div>

      <Section title="1. Starting Your Shift — Login & Verification" defaultOpen>
        <Step n="1">Open the app and enter your <strong>username</strong> and <strong>password</strong> on the login screen. Press <strong>LOG IN</strong>.</Step>
        <Step n="2">On the dashboard you will see your name and role in the top-right corner. This is your active session.</Step>
        <Step n="3">Tap <strong>🏪 Admin Menu</strong> → <strong>🛒 Orders</strong>. Because you are a cashier, you will see an <strong>Identity Verification</strong> screen — enter your password again. This confirms it is really you operating the till.</Step>
        <Tip type="rule">You must enter your own password every time you open Orders — even if someone else is already logged in. This keeps every sale linked to the right cashier.</Tip>
        <Step n="4">If you have been assigned to a till by your manager, you will see the till name at the top. If the screen shows "Not Assigned", ask your manager to assign you via <strong>Assign</strong> first.</Step>
      </Section>

      <Section title="2. Processing an Order (Taking a Sale)">
        <Step n="1">On the Orders screen, choose the <strong>order type</strong> at the top: Takeaway, Braai In, Call Order, or Delivery. For call/delivery, enter the customer name and phone.</Step>
        <Step n="2">Tap a product card to add it to the cart. The cart appears on the right side of the screen.</Step>
        <Step n="3">To change quantity: use the <strong>+ / −</strong> buttons in the cart. For kg products, type the exact weight.</Step>
        <Step n="4">If the customer wants extras (pap, achaar, rolls, etc.), tap the <strong>Extras</strong> tab and add from there.</Step>
        <Step n="5">To apply a discount, type the percentage in the <strong>Discount %</strong> box at the bottom of the cart.</Step>
        <Step n="6">When ready, press <strong>Charge R___</strong> to open the payment screen.</Step>
        <Step n="7">Select payment method — Cash, Card, or Split. For cash, enter the amount tendered and the change is calculated automatically.</Step>
        <Step n="8">Press <strong>Complete</strong>. The receipt screen will appear. Print a receipt or braai ticket if needed, then press <strong>New Order</strong>.</Step>
        <Tip>You can search for products using the search bar at the top of the product panel. Also use the category filter buttons to narrow down.</Tip>
      </Section>

      <Section title="3. Voiding an Item">
        <Step n="1">In the cart, find the item you need to remove and press <strong>VOID</strong> next to it.</Step>
        <Step n="2">A void screen will appear. Select the <strong>reason</strong> from the dropdown (e.g. "Wrong item added", "Customer changed mind").</Step>
        <Step n="3">A <strong>manager or owner password</strong> is required to approve the void. Call your manager to enter their password.</Step>
        <Step n="4">Once approved, the item will show as "VOIDED" in the cart and will not be charged.</Step>
        <Tip type="warn">You cannot void items yourself — manager approval is always required. This is for accountability.</Tip>
      </Section>

      <Section title="4. Attendance — Clock In & Clock Out">
        <Step n="1">Go to <strong>🏪 Admin Menu</strong> → <strong>📋 Attendance</strong>.</Step>
        <Step n="2">Enter your password to clock in at the start of your shift.</Step>
        <Step n="3">At the end of your shift, go back and enter your password again to clock out.</Step>
        <Tip type="rule">Always clock in when you arrive and clock out when you leave. This is used for your attendance record.</Tip>
      </Section>

      <Section title="5. End of Shift — What to Do">
        <Step n="1">Make sure all orders are completed or properly voided. Do not leave items in the cart when you close.</Step>
        <Step n="2">If you were assigned to a till, your manager will call you for <strong>cashup</strong>. Count your cash and wait for the manager.</Step>
        <Step n="3">Clock out via Attendance.</Step>
        <Step n="4">Press <strong>Logout</strong> on the dashboard.</Step>
        <Tip type="warn">If you exit Orders with items still in the cart and no payment was taken, those items are logged as an "abandoned order". Your manager will see this during cashup.</Tip>
      </Section>

      <Section title="6. Common Questions">
        <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
          <p style={{ fontWeight: '700', color: C.teal, margin: '0 0 4px' }}>A product shows "Out of stock" — what do I do?</p>
          <p style={{ margin: '0 0 14px', color: C.sub }}>Tell your manager. They can receive new stock via GRV or adjust inventory. You cannot sell an out-of-stock product.</p>
          <p style={{ fontWeight: '700', color: C.teal, margin: '0 0 4px' }}>I made a mistake on the wrong order type — can I change it?</p>
          <p style={{ margin: '0 0 14px', color: C.sub }}>Yes, just tap a different order type button at the top before completing payment. You can change it anytime during the order.</p>
          <p style={{ fontWeight: '700', color: C.teal, margin: '0 0 4px' }}>The system says I am "Not Assigned" — what does that mean?</p>
          <p style={{ margin: '0 0 14px', color: C.sub }}>Your manager must first assign you to a till using the <strong>Assign</strong> module. Ask your manager to do this before you can process sales.</p>
          <p style={{ fontWeight: '700', color: C.teal, margin: '0 0 4px' }}>Can I see my own sales for the day?</p>
          <p style={{ margin: '0 0 0', color: C.sub }}>The till total shows at the top of the Orders screen ("Today: R___"). For a full breakdown, ask your manager to pull a report.</p>
        </div>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function ManagerGuide() {
  return (
    <div>
      <div style={{ backgroundColor: 'rgba(30,64,175,0.15)', border: '1px solid #1e40af', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '16px', color: '#60a5fa' }}>Manager Guide</p>
        <p style={{ margin: 0, fontSize: '13px', color: C.sub }}>Daily operations, cashier management, cashup, and reporting.</p>
      </div>

      <Section title="1. Starting the Day — Assigning Cashiers" defaultOpen>
        <Step n="1">Log in with your manager username and password.</Step>
        <Step n="2">Go to <strong>🏪 Admin Menu</strong> → <strong>👤 Assign</strong>.</Step>
        <Step n="3">Enter your manager password to open the assign screen.</Step>
        <Step n="4">Select the cashier, the till, and set the <strong>float amount</strong> (the starting cash in the till). Press <strong>Assign</strong>.</Step>
        <Step n="5">The cashier is now assigned and can process sales. Repeat for each cashier/till.</Step>
        <Tip>If a cashier is not assigned and <strong>requireAssignment</strong> is enabled in Settings, they will see a locked screen in Orders until you assign them.</Tip>
      </Section>

      <Section title="2. Approving Voids">
        <Step n="1">When a cashier needs to void an item, they will call you over to the till.</Step>
        <Step n="2">On the void screen, check the item and the reason selected by the cashier.</Step>
        <Step n="3">Enter your <strong>manager password</strong> to approve. The item will be voided and logged.</Step>
        <Tip type="rule">All voids are recorded with the item name, amount, cashier, your name as approver, and the reason. Check the Voids report regularly.</Tip>
      </Section>

      <Section title="3. End-of-Shift Cashup">
        <Step n="1">Go to <strong>🏪 Admin Menu</strong> → <strong>💰 Store Cashup</strong> → <strong>+ New Cashup</strong>.</Step>
        <Step n="2">Select the cashier and till from the dropdown.</Step>
        <Step n="3">If the system detects any <strong>abandoned orders</strong> for that cashier, a warning will appear. Investigate before continuing.</Step>
        <Step n="4">Enter the <strong>card total</strong> (from the card machine slip) and any <strong>petty cash</strong> used from the till.</Step>
        <Step n="5">Have the cashier count the physical cash by denomination in the grid — without looking at the system expected total (blind count).</Step>
        <Step n="6">Press <strong>Submit for Verification</strong>, then enter your manager password to confirm.</Step>
        <Step n="7">The system will show the <strong>variance</strong> (difference between counted cash and expected). A variance of R0 is perfect.</Step>
        <Tip type="warn">Investigate any variance before dismissing the cashier. Positive variance means more cash than expected; negative means short.</Tip>
      </Section>

      <Section title="4. Receiving Stock — GRV">
        <Step n="1">When stock arrives from a supplier, go to <strong>📋 GRV</strong> → <strong>+ New GRV</strong>.</Step>
        <Step n="2">Enter the supplier name, date, and store.</Step>
        <Step n="3">Add each item received: select the product, enter the quantity and the cost price on the invoice.</Step>
        <Step n="4">Press <strong>Submit GRV & Update Stock</strong>. Stock levels and cost prices are updated automatically.</Step>
        <Tip>For charcoal/coal delivery, use the <strong>🔥 Charcoal / Coal</strong> tab in GRV. Record usage daily when braai is used.</Tip>
      </Section>

      <Section title="5. Stock Count">
        <Step n="1">Go to <strong>⚖️ Stock Count</strong> → <strong>Start New Count</strong>. Select the store and date.</Step>
        <Step n="2">Staff count the physical stock and enter quantities in the <strong>Count Qty</strong> column. The system qty and variance are <strong>hidden</strong> during counting — this prevents bias.</Step>
        <Step n="3">Press <strong>Submit Count</strong>. Choose <strong>Save Only</strong> (record without updating stock) or <strong>Apply & Save</strong> (update stock to counted quantities).</Step>
        <Step n="4">After submission, open the count report to see variances and value loss. Only the owner can delete or modify a submitted count.</Step>
        <Tip type="rule">Do stock counts at the start or end of shift when the floor is quiet. Never tell staff what the system says before they finish counting.</Tip>
      </Section>

      <Section title="6. Reports — What to Check Daily">
        <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
          {[
            { label: '📊 Reports → Order Reports → Daily Sales', desc: 'See total revenue and transaction count for today.' },
            { label: '📊 Reports → Order Reports → Voids / Overrings', desc: 'Review any voids from today — check reasons are legitimate.' },
            { label: '📊 Reports → Order Reports → Best Sellers', desc: 'See which products are selling best. Use to plan purchasing.' },
            { label: '📊 Reports → Order Reports → Restock Suggestions', desc: 'Identifies products running low based on sales velocity. Act on Critical items immediately.' },
            { label: '📊 Reports → Cashup Reports', desc: 'Review daily cashup results and any variances.' },
          ].map(r => (
            <div key={r.label} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: '0 0 2px', fontWeight: '700', color: C.teal, fontSize: '13px' }}>{r.label}</p>
              <p style={{ margin: 0, color: C.sub, fontSize: '13px' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="7. Online Orders">
        <Step n="1">Go to <strong>💬 Online Orders</strong> from the dashboard. A red badge shows how many new orders are waiting.</Step>
        <Step n="2">New orders trigger an audio alarm. Tap <strong>Start Processing</strong> when you begin preparing the order.</Step>
        <Step n="3">Tap <strong>💬 Reply on WhatsApp</strong> to send the customer a confirmation message.</Step>
        <Step n="4">Tap <strong>Mark Done</strong> when the order is ready for collection/delivery.</Step>
        <Step n="5">To adjust waiting time when the shop is busy, go to <strong>Online Orders → Settings tab</strong> and select a new wait time.</Step>
      </Section>

      <Section title="8. Wastage Log">
        <Step n="1">Go to <strong>🗑️ Wastage Log</strong> whenever stock is wasted, spoiled, or written off.</Step>
        <Step n="2">Select the product, enter the quantity and reason. Submit — stock is deducted automatically.</Step>
        <Tip type="warn">Never ignore wastage. Unrecorded wastage causes your stock count to show false shortages, making it look like stock is being stolen.</Tip>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNER CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function OwnerGuide() {
  return (
    <div>
      <div style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid #7c3aed', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 4px', fontWeight: '800', fontSize: '16px', color: '#c4b5fd' }}>Owner Guide</p>
        <p style={{ margin: 0, fontSize: '13px', color: C.sub }}>Full system control — users, permissions, financial reports, and system setup.</p>
      </div>

      <Section title="1. Setting Up the System (First Time)" defaultOpen>
        <Step n="1"><strong>Settings</strong> (Admin Menu → ⚙️ Settings → Store Info): Enter your store name, address, phone, WhatsApp number, and VAT number.</Step>
        <Step n="2"><strong>Users</strong>: Add all staff members. Set each person's role (manager / cashier), store (butchery / bottle / both), and password.</Step>
        <Step n="3"><strong>Module Access</strong>: In Users → Edit User, tick exactly which modules each staff member is allowed to access. Leave all unticked to allow everything their role permits.</Step>
        <Step n="4"><strong>Inventory</strong>: Add all products with SKU, selling price, cost price, unit (kg or each), minimum stock level, and which store they belong to.</Step>
        <Step n="5"><strong>Settings → Tills</strong>: Add each till with a name and number. Assign each till to the correct store.</Step>
        <Step n="6"><strong>Settings → POS Settings</strong>: Enable chisa nyama/braai mode, require assignment, allow split payment — based on your business needs.</Step>
      </Section>

      <Section title="2. Managing Users & Access Control">
        <Step n="1">Go to <strong>👥 Users</strong> from the dashboard (owner only).</Step>
        <Step n="2">Press <strong>+ Add User</strong> to create a new staff member. Fill in full name, username, password, role, and store.</Step>
        <Step n="3">Under <strong>Module Access</strong>, tick which modules this person can access. Leave all unticked for default role-based access.</Step>
        <Step n="4">To disable a staff member (e.g. they left), press <strong>Disable</strong> on their row. Their account becomes inactive but records are kept.</Step>
        <Step n="5">To change someone's password, press <strong>Edit</strong> and enter a new password in the "New Password" field.</Step>
        <Tip type="rule">Never share your owner password. You are the only one who can access Users, Activity Monitor, FC Report, and delete stock counts.</Tip>
      </Section>

      <Section title="3. Activity Monitor — Tracking Staff Movement">
        <Step n="1">Go to <strong>🏪 Admin Menu</strong> → <strong>🔍 Activity Monitor</strong> (owner only).</Step>
        <Step n="2">Every login, sale, void, GRV, stock count, manager override, and cashup is recorded with a timestamp and the staff member's name.</Step>
        <Step n="3">Use the <strong>filters</strong> to search by date range, staff member, or action type.</Step>
        <Tip type="danger">If you see "Orders Override" entries, a manager used their password to access Orders on behalf of a cashier. Investigate why.</Tip>
        <Tip>Run this report daily to spot patterns — frequent voids by the same cashier, late logins, or unexpected GRVs.</Tip>
      </Section>

      <Section title="4. Financial Reports">
        <div style={{ fontSize: '14px', lineHeight: 1.8 }}>
          {[
            { label: '📈 FC Report (Food Cost)', desc: 'Shows your food cost % — the ratio of what you paid for stock vs what you sold it for. Target below 35% for butchery. Pulls from GRVs, sales, and inventory.' },
            { label: '📊 Reports → Stock Reports → Gross Profit', desc: 'GP per product — selling price minus cost price. Shows which products make the most money.' },
            { label: '📊 Reports → Order Reports → Best Sellers', desc: 'Top products by revenue for any date range. Use to plan which items to stock more of.' },
            { label: '📊 Reports → Order Reports → Restock Suggestions', desc: 'Automatically flags products at risk of running out based on daily sales velocity.' },
            { label: '📊 Reports → Cashup Reports → Store Cashup', desc: 'Summary of all cashups. Look for repeated negative variances — this may indicate a problem.' },
          ].map(r => (
            <div key={r.label} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#c4b5fd', fontSize: '13px' }}>{r.label}</p>
              <p style={{ margin: 0, color: C.sub, fontSize: '13px' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="5. Stock Count — Owner Controls">
        <Step n="1">Stock counts are done by managers/staff in <strong>⚖️ Stock Count</strong>. Staff count without seeing variances (blind count).</Step>
        <Step n="2">As owner you can view the full count report including variance and <strong>value loss in Rands</strong>.</Step>
        <Step n="3">To <strong>apply</strong> a count to live stock: open the count → press <strong>Apply to Stock</strong> → confirm with your owner password.</Step>
        <Step n="4">To <strong>delete</strong> a count (e.g. a mistake was made): open the count → press <strong>Delete Count</strong> → enter owner password.</Step>
        <Tip type="danger">Only delete a count if it was incorrectly entered. Deleted counts cannot be recovered.</Tip>
      </Section>

      <Section title="6. Butchery — Carcass Breakdown & Manufacturing">
        <p style={{ color: C.sub, fontSize: '14px', marginBottom: '12px' }}>For butcheries that process whole carcasses in-house:</p>
        <Step n="1">Go to <strong>🥩 Butchery Cuts</strong> → <strong>+ New Record</strong>.</Step>
        <Step n="2">Select the raw material (e.g. whole beef carcass), enter the weight and <strong>cost price per kg</strong>.</Step>
        <Step n="3">Add each cut produced: name/product, weight in kg, selling price per kg.</Step>
        <Step n="4">The system calculates yield %, wastage weight + value, gross profit, and margin % automatically.</Step>
        <Step n="5">Submit — raw stock is deducted, cut products are added to inventory.</Step>
        <p style={{ color: C.sub, fontSize: '14px', margin: '14px 0 12px' }}>For in-house manufacturing (wors, mince, pap):</p>
        <Step n="6">Go to <strong>🏭 Manufacturing</strong> → <strong>+ New Batch</strong>.</Step>
        <Step n="7">Select or name the output product, enter output quantity and selling price.</Step>
        <Step n="8">Add input materials used (ingredients deducted from stock). System shows P&L per batch.</Step>
      </Section>

      <Section title="7. Online Orders Setup">
        <Step n="1">In <strong>💬 Online Orders → Settings tab</strong>, enter your WhatsApp number (format: 27821234567).</Step>
        <Step n="2">Toggle the store <strong>Online / Offline</strong> switch — customers will see your status.</Step>
        <Step n="3">Copy the <strong>Customer Order Link</strong> and share it on WhatsApp status, Facebook, or print it as a QR code for your counter.</Step>
        <Step n="4">Adjust <strong>waiting time</strong> based on how busy the shop is (10–90 min). When very busy, set it to 45–60 min so customers have correct expectations.</Step>
      </Section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL MODULE REFERENCE
// ─────────────────────────────────────────────────────────────────────────────
function FullReference() {
  const modules = [
    { icon: '🏪', name: 'Admin Menu', access: 'All', desc: 'Hub for front-of-house daily operations. Contains: Orders, Assign, Cashup, Shifts, Customers, Settings, Attendance, Activity Monitor.' },
    { icon: '🛒', name: 'Orders', access: 'All', desc: 'The main POS screen. Add products, extras, apply discounts, process cash/card/split payments. Cashiers must re-enter their password each session. Void requires manager approval.' },
    { icon: '👤', name: 'Assign', access: 'Manager, Owner', desc: 'Assign a cashier to a till with a starting float before they begin selling. Required if "requireAssignment" is on in Settings.' },
    { icon: '💰', name: 'Store Cashup', access: 'Manager, Owner', desc: 'Blind denomination count by cashier, verified by manager. Calculates expected vs actual cash. Warns if cashier has abandoned orders.' },
    { icon: '📋', name: 'Attendance', access: 'All', desc: 'Staff clock in/out by entering their password. Manager can view full attendance history.' },
    { icon: '👥', name: 'Customers', access: 'Manager, Owner', desc: 'Customer profiles with contact details and order history. Useful for call and delivery orders.' },
    { icon: '⚙️', name: 'Settings', access: 'Manager, Owner', desc: 'Store info, POS toggles, till management, menu items & extras, WhatsApp number, online order settings.' },
    { icon: '🔍', name: 'Activity Monitor', access: 'Owner only', desc: 'Full audit trail of all system events — logins, sales, voids, GRVs, stock counts, overrides. Filterable by staff, action, and date.' },
    { icon: '💬', name: 'Online Orders', access: 'All', desc: 'Manage WhatsApp and call orders. Online/offline toggle, waiting time adjustment, audio alarm for new orders, WhatsApp reply button, internet speed test.' },
    { icon: '🔍', name: 'Orders Search', access: 'Manager, Owner', desc: 'Search all completed and abandoned orders by order number, customer name, phone, or cashier name.' },
    { icon: '📦', name: 'Inventory', access: 'Manager, Owner', desc: 'Add, edit, and adjust product stock. Set selling price, cost price, SKU, unit, minimum stock level, and store.' },
    { icon: '📋', name: 'GRV (Stock Receiving)', access: 'Manager, Owner', desc: 'Record goods received from suppliers. Updates stock and cost prices. Includes a separate Charcoal/Coal tab for braai coal tracking.' },
    { icon: '🥩', name: 'Butchery Cuts', access: 'Manager, Owner', desc: 'Process whole carcasses into cuts. Tracks yield %, wastage, and full P&L (cost vs revenue per carcass).' },
    { icon: '🏭', name: 'Manufacturing', access: 'Manager, Owner', desc: 'Log in-house production (wors, mince, pap etc.). Input materials deducted from stock, output added to stock. Shows P&L per batch.' },
    { icon: '🍺', name: 'Bottle Store', access: 'Manager, Owner', desc: 'Bottle store stock overview and breakage log.' },
    { icon: '⚖️', name: 'Stock Count', access: 'Manager, Owner', desc: 'Blind physical stock count — staff count without seeing system quantities or variance. Report shows variance and value loss. Owner can apply or delete counts.' },
    { icon: '🗑️', name: 'Wastage Log', access: 'Manager, Owner', desc: 'Record spoilage, breakage, or write-offs. Deducts from stock automatically.' },
    { icon: '📊', name: 'Reports', access: 'Manager, Owner', desc: 'Full reporting hub: Stock Reports, Cashup Reports, Menu Sales, Order Reports (with Best Sellers + Restock Suggestions), Summary Reports.' },
    { icon: '📈', name: 'FC Report', access: 'Owner only', desc: 'Food cost percentage report. Compares cost of goods sold to revenue. Shows which products drag your margins down.' },
    { icon: '👥', name: 'Users', access: 'Owner only', desc: 'Add/edit/disable staff accounts. Set role, store access, password, and per-user module access permissions.' },
  ]
  return (
    <div>
      <div style={{ backgroundColor: C.card, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '36px 160px 1fr 120px', gap: '0', backgroundColor: C.bg, padding: '10px 16px' }}>
          {['', 'Module', 'What it does', 'Who can use'].map(h => (
            <span key={h} style={{ fontSize: '10px', color: C.muted, fontWeight: '600', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {modules.map((m, i) => (
          <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '36px 160px 1fr 120px', gap: '0', padding: '11px 16px', borderTop: i > 0 ? `1px solid ${C.bg}` : 'none', alignItems: 'start' }}>
            <span style={{ fontSize: '18px' }}>{m.icon}</span>
            <span style={{ fontWeight: '700', fontSize: '13px', paddingRight: '8px' }}>{m.name}</span>
            <span style={{ fontSize: '12px', color: C.sub, lineHeight: 1.5, paddingRight: '12px' }}>{m.desc}</span>
            <span style={{ fontSize: '11px', color: m.access.includes('Owner only') ? '#c4b5fd' : m.access === 'All' ? C.teal : '#60a5fa', fontWeight: '600' }}>{m.access}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function HelpGuide({ user, onBack }) {
  const defaultRole = user.role === 'cashier' ? 'cashier' : user.role === 'manager' ? 'manager' : 'owner'
  const [activeRole, setActiveRole] = useState(defaultRole)

  return (
    <Shell title="Help & Training Guide" subtitle="ShopFlow POS — ZeHuWo Pty Ltd" onBack={onBack}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setActiveRole(r.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `2px solid ${activeRole === r.id ? r.color : C.border}`, backgroundColor: activeRole === r.id ? `${r.color}22` : 'transparent', color: activeRole === r.id ? 'white' : C.muted, fontWeight: '700', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s' }}>
            {r.label}
          </button>
        ))}
        <a href="/shopflow-pos/training-cashier.html" target="_blank" rel="noopener"
          style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: 'transparent', color: C.sub, fontWeight: '600', cursor: 'pointer', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🖨️ Print Cards
        </a>
      </div>

      {activeRole === 'cashier' && <CashierGuide />}
      {activeRole === 'manager' && <ManagerGuide />}
      {activeRole === 'owner' && <OwnerGuide />}
      {activeRole === 'all' && <FullReference />}
    </Shell>
  )
}
