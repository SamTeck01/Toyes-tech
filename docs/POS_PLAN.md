# Toyes Tech POS — Plan (agreed with CEO)

Goal: replace the Moniepoint POS *software* with our own multi-store POS that never stops selling,
even without internet, and keeps the CEO informed on WhatsApp in real time.

## CEO requirements (non-negotiable)
1. **Multiple accounts**: CEO = super admin; each store has its own staff accounts.
2. **Separate inventory per store.**
3. **Fast checkout / quick sale**: sell an item that isn't in inventory, immediately.
4. **WhatsApp alert to CEO on every sale**, from any store.
5. **Works offline**: keeps selling with no internet; syncs automatically when back.
6. **No errors**: reliability is the top priority.

## Architecture
- **Backend: Supabase** (Postgres + Auth + Row Level Security + Edge Functions + backups).
- **POS app**: installable web app (PWA) on the store laptop, opens with no internet.
- **Offline-first**: every sale is saved on the laptop first (IndexedDB), then sent to the
  server by a sync queue. Each sale has a unique ID made on the laptop, so a retry can never
  create a duplicate. Clear status bar: Online / Offline · "3 sales waiting to sync".
- **Receipt numbers** include store + device code (e.g. `CMP-L1-000123`) so two offline
  laptops can never clash.
- Stock is never blocked by sync: an offline sale is always accepted; if stock goes negative
  after sync, the CEO and manager get flagged, the sale is never lost.

## Data model (per store)
`stores`, `staff` (role: super_admin | manager | cashier, store_id, PIN), `products` (shared
catalogue), `inventory` (store_id, product_id, qty, price), `sales`, `sale_lines` (product_id
nullable → quick-sale items), `payments`, `stock_movements` (every change, with who/why),
`shifts` (opening cash, expected vs counted cash), `audit_log`.

## Roles
- **Super admin (CEO)**: all stores, live sales feed, compare stores, prices, staff,
  stock transfers, refunds approval, reports.
- **Manager**: own store: stock in, price changes, refunds, discounts above limit, reports.
- **Cashier**: sell, hold, print receipts. Quick PIN switch between cashiers on one laptop.

## Quick sale (not in inventory)
"Quick sale" button → name, price, qty → sell. Reported separately ("Unlisted items") so the
CEO sees them; manager can later turn one into a real product with one tap.

## WhatsApp alerts
- **WhatsApp Business Cloud API (Meta)**. Needs: a dedicated business phone number, Meta
  Business verification, and an approved message template (Meta rule for business-sent messages).
- Flow: sale saved on server → database trigger → Edge Function → WhatsApp message to CEO:
  "New sale · Campus store · ₦135,000 · JBL Flip 6 ×1 · Cash · Tolu · 2:14pm".
- Offline sales alert when they sync, marked "made offline at 2:14pm".
- Also: end-of-day summary per store, low-stock alerts, refund alerts, quick-sale alerts.
- Fallback if Meta approval is slow: Twilio WhatsApp or SMS until approved.

## Reliability ("no errors") — how we deliver it
- Offline mode + duplicate-proof sync (above).
- Automated tests for every money path: sale, split payment, refund, sync retry, offline.
- Error monitoring (Sentry): we see problems before the store calls; fixes go live remotely in
  minutes — no screen-sharing or physical visits (the Moniepoint pain point).
- Daily database backups + point-in-time restore.
- **Pilot**: run in one store alongside Moniepoint for 1–2 weeks, compare totals daily,
  then roll out store by store.
- Hardware advice: UPS for the laptop, 4G MiFi as backup internet, 80mm receipt printer,
  USB barcode scanner.
- Note: card payments still need a card terminal (Moniepoint/Paystack terminal). Our POS records
  the card payment; it replaces the software, not the terminal.

## Also recommended
Shift open/close with cash count · stock receiving (supplier deliveries) · stock transfers
between stores · low-stock alerts · barcode label printing · customer records & warranty lookup
by phone number · audit log (discounts, price overrides, deletes) · Excel export ·
2-factor login for the CEO · training mode for new staff · website orders from same stock.

## Phases
1. **Backend + accounts**: Supabase, stores, roles, logins, move products/inventory per store.
2. **Offline POS**: PWA, local database, sync queue, status bar, quick sale, PIN switching.
3. **WhatsApp alerts**: Meta setup, templates, per-sale + daily summary.
4. **CEO dashboard**: all stores live, reports, transfers, staff management.
5. **Hardening**: tests, Sentry, backups, pilot in one store, then roll out.

## Needed from the client
- List of stores (name, address) and staff per store with roles.
- Product list + stock per store (Excel is fine).
- CEO's WhatsApp number + a separate number for the business sender; Facebook/Meta Business
  account access for verification.
- Who owns the Supabase/Vercel accounts (should be the business).
- Laptop OS/browser, printer and scanner models, card terminal they'll keep.
