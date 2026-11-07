import { localDb, getMeta, setMeta, type LocalSale, type LocalProduct, type LocalInventory, type LocalStaff, type LocalShift, type SaleLine, type PaymentMethod } from "./localdb";

/**
 * The POS engine: records sales on the till first, then syncs them to the server.
 * A sale is never lost and never duplicated:
 *  - it is written to the local database (with its outbox entry) in one transaction before anything else;
 *  - the server call is idempotent on the sale id, so a retry after a dropped connection is harmless;
 *  - network or sign-in problems leave it queued; a server rejection keeps it, flagged for review.
 */

export class NetworkError extends Error {}
export class AuthError extends Error {}
export class RejectedError extends Error {}

export interface PosServer {
  submitSale(payload: Record<string, unknown>): Promise<void>;
  saveShift(payload: Record<string, unknown>): Promise<void>;
  pull(storeId: string): Promise<{ products: LocalProduct[]; inventory: LocalInventory[]; staff: LocalStaff[] }>;
  notify(): Promise<void>;
}

export interface Device {
  device_id: string;
  device_code: string;
  store_id: string;
  store_code: string;
  store_name: string;
}

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  pending: number;
  failed: number;
  lastSyncAt: string | null;
  problem: "none" | "offline" | "auth" | "server";
  message?: string;
}

let status: SyncStatus = { online: true, syncing: false, pending: 0, failed: 0, lastSyncAt: null, problem: "none" };
const listeners = new Set<(s: SyncStatus) => void>();
const emit = (patch: Partial<SyncStatus>) => {
  status = { ...status, ...patch };
  listeners.forEach((l) => l(status));
};
export const getStatus = () => status;
export const subscribe = (fn: (s: SyncStatus) => void) => {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
};

const refreshCounts = async () => {
  const all = await localDb.outbox.toArray();
  emit({ pending: all.filter((o) => !o.failed).length, failed: all.filter((o) => o.failed).length });
};

export const getDevice = () => getMeta<Device | null>("device", null);
export const setDevice = (d: Device) => setMeta("device", d);

/** Money helpers: naira amounts are whole numbers; round to avoid float drift. */
export const money = (n: number) => Math.round(n * 100) / 100;

export const computeTotals = (lines: SaleLine[], discount: number, payments: { amount: number }[]) => {
  const subtotal = money(lines.reduce((s, l) => s + l.unit_price * l.quantity, 0));
  const d = Math.min(Math.max(0, money(discount)), subtotal);
  const total = money(subtotal - d);
  const paid = money(payments.reduce((s, p) => s + p.amount, 0));
  return { subtotal, discount: d, total, paid, change: Math.max(0, money(paid - total)) };
};

export interface NewSale {
  cashier: { id: string; full_name: string };
  lines: SaleLine[];
  discount: number;
  payments: { method: PaymentMethod; amount: number }[];
  customer_name?: string;
  customer_phone?: string;
}

/** Record a sale on this till. Works with no internet. Returns the saved sale (for the receipt). */
export const recordSale = async (input: NewSale, isOnline = typeof navigator === "undefined" ? true : navigator.onLine) => {
  const device = await getDevice();
  if (!device) throw new Error("This till is not set up yet.");
  if (!input.lines.length) throw new Error("Add at least one item.");
  for (const l of input.lines) {
    if (!(l.quantity > 0) || !(l.unit_price >= 0) || !l.name.trim()) throw new Error(`Check the item “${l.name || "unnamed"}”.`);
  }
  const t = computeTotals(input.lines, input.discount, input.payments);
  if (t.paid < t.total) throw new Error("Payment is less than the total.");

  let sale!: LocalSale;
  await localDb.transaction("rw", localDb.sales, localDb.outbox, localDb.inventory, localDb.meta, async () => {
    const seq = (await getMeta<number>("receipt_seq", 0)) + 1;
    await setMeta("receipt_seq", seq);
    sale = {
      id: crypto.randomUUID(),
      receipt_no: `${device.store_code}-${device.device_code}-${String(seq).padStart(6, "0")}`,
      store_id: device.store_id,
      store_name: device.store_name,
      device_id: device.device_id,
      cashier_id: input.cashier.id,
      cashier_name: input.cashier.full_name,
      created_at: new Date().toISOString(),
      offline: !isOnline,
      lines: input.lines.map((l) => ({ ...l, name: l.name.trim(), unit_price: money(l.unit_price) })),
      subtotal: t.subtotal,
      discount: t.discount,
      total: t.total,
      change_given: t.change,
      payments: input.payments.filter((p) => p.amount > 0),
      customer_name: input.customer_name?.trim() || undefined,
      customer_phone: input.customer_phone?.trim() || undefined,
      status: "completed",
      sync: "pending",
    };
    await localDb.sales.add(sale);
    await localDb.outbox.add({ id: sale.id, kind: "sale", payload: toServerSale(sale), created_at: sale.created_at, attempts: 0 });
    for (const l of sale.lines) {
      if (!l.product_id) continue;
      const inv = await localDb.inventory.get(l.product_id);
      if (inv) await localDb.inventory.put({ ...inv, qty: inv.qty - l.quantity });
    }
  });
  await refreshCounts();
  void syncNow(); // try straight away; harmless if offline
  return sale;
};

const toServerSale = (s: LocalSale) => ({
  id: s.id,
  receipt_no: s.receipt_no,
  store_id: s.store_id,
  device_id: s.device_id,
  cashier_id: s.cashier_id,
  created_at: s.created_at,
  offline: s.offline,
  discount: s.discount,
  lines: s.lines,
  payments: s.payments,
  customer_name: s.customer_name ?? "",
  customer_phone: s.customer_phone ?? "",
});

export const openShift = async (cashier_id: string, opening_cash: number) => {
  const device = await getDevice();
  if (!device) throw new Error("This till is not set up yet.");
  const shift: LocalShift = { id: crypto.randomUUID(), cashier_id, opened_at: new Date().toISOString(), opening_cash: money(opening_cash) };
  await localDb.transaction("rw", localDb.shifts, localDb.outbox, async () => {
    await localDb.shifts.add(shift);
    await localDb.outbox.add({ id: shift.id, kind: "shift", payload: { ...shift, store_id: device.store_id, device_id: device.device_id }, created_at: shift.opened_at, attempts: 0 });
  });
  await refreshCounts();
  void syncNow();
  return shift;
};

/** Expected cash in the drawer for a shift, from this till's own records (works offline). */
export const expectedCash = async (shift: LocalShift, until = new Date().toISOString()) => {
  const sales = await localDb.sales.where("created_at").between(shift.opened_at, until, true, true).toArray();
  return money(
    sales
      .filter((s) => s.cashier_id === shift.cashier_id && s.status === "completed")
      .reduce((sum, s) => sum + s.payments.filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0) - s.change_given, shift.opening_cash),
  );
};

export const closeShift = async (shift: LocalShift, counted_cash: number, note?: string) => {
  const device = await getDevice();
  if (!device) throw new Error("This till is not set up yet.");
  const closed = { ...shift, closed_at: new Date().toISOString(), counted_cash: money(counted_cash) };
  const expected = await expectedCash(shift, closed.closed_at);
  await localDb.transaction("rw", localDb.shifts, localDb.outbox, async () => {
    await localDb.shifts.put(closed);
    // Shift close is sent after its sales (outbox is processed oldest first).
    await localDb.outbox.put({ id: `${shift.id}:close`, kind: "shift", payload: { ...closed, store_id: device.store_id, device_id: device.device_id, note }, created_at: closed.closed_at, attempts: 0 });
  });
  await refreshCounts();
  void syncNow();
  return { closed, expected, difference: money(closed.counted_cash - expected) };
};

// ───────────────────────── Sync ─────────────────────────

let server: PosServer | null = null;
let running: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

export const configureServer = (s: PosServer | null) => {
  server = s;
};

/** Push queued sales/shifts (oldest first), then refresh products, stock and staff. Safe to call any time. */
export const syncNow = (): Promise<void> => {
  if (running) return running;
  running = (async () => {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    if (!server) return;
    if (!online) {
      emit({ online: false, problem: "offline" });
      await refreshCounts();
      return;
    }
    emit({ online: true, syncing: true });
    try {
      const queue = await localDb.outbox.orderBy("created_at").filter((o) => !o.failed).toArray();
      let sentSales = 0;
      for (const item of queue) {
        try {
          if (item.kind === "sale") await server.submitSale(item.payload);
          else await server.saveShift(item.payload);
          await localDb.transaction("rw", localDb.outbox, localDb.sales, async () => {
            await localDb.outbox.delete(item.id);
            if (item.kind === "sale") await localDb.sales.update(item.id, { sync: "synced", sync_error: undefined });
          });
          if (item.kind === "sale") sentSales++;
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          if (e instanceof RejectedError) {
            // The server refused it (e.g. a permission problem). Keep it safely and let a manager see it; move on.
            await localDb.outbox.update(item.id, { failed: true, last_error: message, attempts: item.attempts + 1 });
            if (item.kind === "sale") await localDb.sales.update(item.id, { sync: "failed", sync_error: message });
            continue;
          }
          await localDb.outbox.update(item.id, { last_error: message, attempts: item.attempts + 1 });
          throw e; // network or sign-in problem: stop and retry later, keeping order
        }
      }
      if (sentSales) void server.notify().catch(() => undefined); // WhatsApp alerts; the server also retries on a timer
      const device = await getDevice();
      if (device) {
        const data = await server.pull(device.store_id);
        await localDb.transaction("rw", [localDb.products, localDb.inventory, localDb.staff, localDb.sales], async () => {
          // Server stock already includes synced sales; add back sales still waiting to sync so the till stays accurate.
          const pendingSales = await localDb.sales.where("sync").equals("pending").toArray();
          const pendingQty = new Map<string, number>();
          pendingSales.forEach((s) => s.lines.forEach((l) => l.product_id && pendingQty.set(l.product_id, (pendingQty.get(l.product_id) ?? 0) + l.quantity)));
          await localDb.products.clear();
          await localDb.products.bulkPut(data.products);
          await localDb.inventory.clear();
          await localDb.inventory.bulkPut(data.inventory.map((i) => ({ ...i, qty: i.qty - (pendingQty.get(i.product_id) ?? 0) })));
          await localDb.staff.clear();
          await localDb.staff.bulkPut(data.staff);
        });
      }
      emit({ problem: "none", message: undefined, lastSyncAt: new Date().toISOString() });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      emit({ problem: e instanceof AuthError ? "auth" : e instanceof NetworkError ? "offline" : "server", message });
    } finally {
      emit({ syncing: false });
      await refreshCounts();
    }
  })().finally(() => {
    running = null;
  });
  return running;
};

/** Start background syncing: every 20s, when the internet comes back, and when the tab regains focus. */
export const startSync = () => {
  if (timer) return;
  timer = setInterval(() => void syncNow(), 20_000);
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => void syncNow());
    window.addEventListener("offline", () => emit({ online: false, problem: "offline" }));
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && void syncNow());
  }
  void syncNow();
};

/** Retry sales the server rejected (after the problem is fixed, e.g. a cashier re-activated). */
export const retryFailed = async () => {
  const all = await localDb.outbox.toArray();
  await Promise.all(all.filter((o) => o.failed).map((o) => localDb.outbox.update(o.id, { failed: false })));
  await localDb.sales.where("sync").equals("failed").modify({ sync: "pending" });
  await refreshCounts();
  return syncNow();
};

// ───────────────────────── PINs ─────────────────────────

export const hashPin = async (pin: string, staffId: string) => {
  const data = new TextEncoder().encode(`${pin}:${staffId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const checkPin = async (staff: LocalStaff, pin: string) => !!staff.pin_hash && staff.pin_hash === (await hashPin(pin, staff.id));
