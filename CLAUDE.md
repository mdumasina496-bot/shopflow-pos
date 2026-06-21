# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (localhost:5173)
npm run build      # production build → dist/
npm run preview    # preview production build locally
npm run lint       # ESLint check
```

No test suite exists. Verify changes by running `npm run dev` and testing in browser. The project builds as a PWA (vite-plugin-pwa).

## Project Overview

ShopFlow POS is a React + Vite offline-first Point of Sale system for a South African butchery / chisa nyama / bottle store business, built by ZeHuWo Pty Ltd. All data is persisted in **browser localStorage** — no backend exists yet.

## Architecture

### Data Layer — `src/data.js`

Single source of truth for everything. Key exports:
- `KEYS` — all localStorage key constants (`sf_products`, `sf_sales`, `sf_users`, `sf_assignments`, `sf_cashup`, `sf_menu_items`, etc.)
- `load(key, fallback)` / `save(key, data)` — read/write localStorage
- `initData()` — called once on app mount; seeds localStorage with default products, users, tills, shifts, menu items and settings if empty
- `getSettings()` / `saveSettings()` — store-wide config object
- `nextOrderNumber()` — generates sequential order numbers
- `printBraaiTicket(order, settings)` / `printReceipt(order, settings)` — open a new browser window and call `window.print()` for thermal printing

**Always read fresh from localStorage before writing** (`load(KEYS.X)`) rather than relying on stale React state, to prevent data loss when multiple components modify the same key.

### Navigation — `src/App.jsx`

Single-page app with a `screen` state string. Login → Dashboard → Module. Module components receive `{ user, onBack }` props. The `MENU` array and `MODULE_MAP` object in App.jsx control which tiles appear per role/store and which component renders.

### Module Structure

```
src/modules/
  AdminMenu.jsx          — hub with 7 sub-module tiles (front-of-house)
  admin/
    Orders.jsx           — main POS: products + extras tabs, void (manager pwd), braai/takeaway/call/delivery order types, cash/card/split payment
    Assign.jsx           — manager assigns cashier to till with float; 2-step: manager pwd → cashier pwd
    StoreCashup.jsx      — blind cashup by denomination; manager verifies
    Shifts.jsx           — shift CRUD
    Customers.jsx        — customer profiles + order history lookup
    Settings.jsx         — store info, POS toggles, tills CRUD, menu items CRUD
    Attendance.jsx       — staff clock in/out by password; history view
  Reports.jsx            — hub with 5 sub-module tiles
  reports/
    StockReports.jsx     — Variance, GP/FC, GRV, Stock on Hand, Wastage, Supplier Summary
    CashupReports.jsx    — Store Cashup, Till Summary, Petty Cash
    MenuSalesReports.jsx — Menu Sales, Items Sold, Extras Sold (butchery only)
    OrderReports.jsx     — Daily, Hourly, Monthly, Invoices, Discounts, Voids, Payment Breakdown
    SummaryReports.jsx   — Activity timeline, Suppliers, Customers, Attendance
  Inventory.jsx          — product CRUD + stock adjustment
  GRV.jsx                — goods received; updates stock + cost price on submit
  ButcheryCuts.jsx       — meat processing; deducts raw material, adds cut products to stock
  BottleStore.jsx        — bottle store stock overview + breakage log
  StockCount.jsx         — physical count with variance; optional apply to stock
  Wastage.jsx            — wastage log; deducts stock
  FCReport.jsx           — food cost % from GRVs / sales / inventory
  Users.jsx              — user CRUD (owner only)
src/components/
  Shell.jsx              — sticky header with logo-main.png, back button, optional actions slot
```

### Role & Store Access

Users have `role` (owner / manager / cashier) and `store` (butchery / bottle / both). Menu items filter by both. Access within modules is enforced by checking `user.role`.

**Key business rule**: if `settings.requireAssignment === true`, cashiers see a locked screen in Orders until a manager assigns them to a till via Assign (creates a record in `sf_assignments` for today with `status: 'open'`).

### Logos

- `public/logo-button.png` — glossy logo, **login screen only**
- `public/logo-main.png` — standard logo, **Shell header + dashboard header**

### Chisa Nyama (Braai) Mode

Controlled by `settings.chisaNyamaMode`. When active, the Orders module shows an **Extras** tab sourced from `sf_menu_items` (pap, achaar, chakalaka, braai service etc.). Order type "Braai In" triggers a printable braai ticket (`printBraaiTicket`) for the kitchen/braai area. Extras have a `printToBraai` flag.

### Styling

All styles are inline (no Tailwind classes used at runtime — Tailwind is installed but styling is done via JS objects). Colour palette:
- Background: `#0f172a`, Cards: `#1e293b`, Border: `#334155`
- Accent header: `#0A6C6B`, Primary action: `#00C4A0`
- Text: `white` / `#94a3b8` / `#64748b`
- Danger: `#dc2626`, Warning: `#f59e0b`, Success: `#16a34a`

## Key Business Context

- South African market — currency is Rands (`R`), VAT 15%, date format `en-ZA`
- Chisa nyama = customers buy raw meat and staff braai it on-site; orders print to braai area
- Blind cashup = cashier counts cash without seeing the system expected total; manager verifies after
- GRV submission updates both stock quantity and cost price on the product
- Void items in Orders require a manager password (`role === 'manager' || 'owner'`); voids are logged to `sf_voids`
- `CUSTOMER_CHECKLIST.html` in root — printable setup form for customer visits
