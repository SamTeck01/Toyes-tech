# Toyes Tech POS — Go-live checklist

Everything is built and tested. These steps connect it to the real cloud and the store laptops.

## 1. Supabase (the database) — owned by the business
1. supabase.com/dashboard → **New organization** "Toyes Tech" (Free plan to start; Pro ($25/mo) adds daily
   backups + point-in-time restore — recommended before real money flows).
2. New project "toyes-tech", region **eu-west-2 (London)** (closest to Nigeria), strong DB password saved safely.
3. Apply the migrations in `supabase/migrations/` (in order) and deploy the two functions in
   `supabase/functions/` (`staff-admin` with JWT check **off**, `notify` with it **on**).
4. Auth → Providers → Email: **turn off "Allow new users to sign up"** (staff are created from HQ only).
5. In the SQL editor, store the two values the timers need (from Project Settings → API):
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<service_role key>', 'service_role_key');
   ```

## 2. Website + POS hosting (Vercel)
Project `toyes-tech` → Settings → Environment Variables (Production):
- `VITE_SUPABASE_URL` = `https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the project's anon/publishable key
Redeploy. HQ is at `/admin`, the till at `/pos`.

## 3. First setup in HQ (CEO, ~20 minutes)
1. `/admin/login` → **Create the owner account** (one time only; nobody else can do this afterwards).
2. **Stores**: add each store with a short code (e.g. CMP, CTY) — the code goes on receipts.
3. **Products**: "Import website products", then add the rest (scan barcodes into the barcode box).
4. **Inventory**: pick each store → **+ Stock in** for what's on the shelves.
5. **Staff**: add managers and cashiers, each with a 4–6 digit till PIN. Set your own PIN too.
6. **WhatsApp alerts**: enter your WhatsApp number(s) → Save → "Send a test message".

## 4. Each store laptop (Windows)
1. Open **Chrome or Edge** → `https://<site>/pos`.
2. Sign in with the store manager's username/password (needs internet once).
3. Choose the store → "Start using this till".
4. Install it: click the **install icon** in the address bar (or ⋮ → "Install Toyes Tech POS").
   It gets a desktop icon and opens like an app — **including with no internet**.
5. Cashiers tap their name and enter their PIN. Open the shift with the cash float.
6. Hardware: USB barcode scanner (plug-and-play), 80mm receipt printer (set as default printer;
   in the print dialog choose "80mm" paper, margins none), UPS for power cuts, MiFi as backup internet.
7. Never clear the browser's data on a till while the status bar shows sales "waiting to sync".
   (Signing the till out is blocked until everything has synced.)

## 5. WhatsApp alerts (Meta WhatsApp Business Cloud API)
Start this early — Meta's checks can take a few days.
1. business.facebook.com → create/verify the **Toyes Tech** business (CAC documents).
2. developers.facebook.com → Create app → type **Business** → add **WhatsApp**.
3. Add a **dedicated sender number** (not the CEO's personal WhatsApp) and verify it.
4. Create a **message template**: category *Utility*, name `store_alert`, language English,
   body: `{{1}}` (one variable). Submit for approval.
5. Create a **System User** with a permanent token (permissions: whatsapp_business_messaging).
6. Supabase → Edge Functions → Secrets:
   `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE=store_alert`, `WHATSAPP_TEMPLATE_LANG=en`.
7. HQ → WhatsApp alerts → "Send a test message".
Until approval: alerts wait in the queue for up to 2 days, then are skipped (never a flood).
Every alert is also visible in HQ → WhatsApp alerts → Recent alerts.

## 6. Pilot (1–2 weeks), then roll out
- Run the new POS in one store **alongside Moniepoint**. Each evening compare: HQ Sales total vs
  Moniepoint total, and the shift cash count.
- Then switch that store fully, and roll out store by store.

## What was tested before handover
- 15 database tests run the real migrations (sales, duplicates, permissions, refunds, transfers,
  shifts, alerts) + 10 offline-engine tests (offline selling, network dropping mid-sync, expired
  sign-in, rejected sale kept for review, stock refresh) + 8 website tests.
- Full browser run on a local Supabase: owner setup → stores → products → stock → staff/PINs →
  till sign-in → wrong/right PIN → barcode scan → quick sale → cash with change → **internet off**
  → sell → **refresh page offline** → sell → internet back → all sales synced exactly once with
  unique receipt numbers on two tills → shift count (balanced, and a ₦10,000 shortage flagged) →
  refund with restock → cashier blocked from HQ → WhatsApp messages queued with correct text,
  failed sends kept for retry → end-of-day summary totals.
