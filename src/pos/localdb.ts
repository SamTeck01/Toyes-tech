import Dexie, { type Table } from "dexie";

/**
 * The till's own database (IndexedDB in the browser). Everything the POS needs to keep selling
 * without internet lives here; the sync engine keeps it in step with the server.
 */

export type Role = "super_admin" | "manager" | "cashier";
export type PaymentMethod = "cash" | "transfer" | "card";

export interface LocalProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  condition: string | null;
  base_price: number;
  image: string | null;
  barcode: string | null;
}

export interface LocalInventory {
  product_id: string;
  qty: number;
  price: number | null;
  low_stock_at: number;
}

export interface LocalStaff {
  id: string;
  full_name: string;
  username: string;
  role: Role;
  store_id: string | null;
  pin_hash: string | null;
}

export interface SaleLine {
  product_id: string | null; // null = quick sale (not in inventory)
  name: string;
  unit_price: number;
  quantity: number;
}

export interface LocalSale {
  id: string;
  receipt_no: string;
  store_id: string;
  store_name: string;
  device_id: string;
  cashier_id: string;
  cashier_name: string;
  created_at: string;
  offline: boolean;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  total: number;
  change_given: number;
  payments: { method: PaymentMethod; amount: number }[];
  customer_name?: string;
  customer_phone?: string;
  status: "completed" | "refunded";
  sync: "pending" | "synced" | "failed";
  sync_error?: string;
}

export interface OutboxItem {
  id: string; // same as the sale / shift id
  kind: "sale" | "shift";
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_error?: string;
  failed?: boolean; // server rejected it (not a network problem); kept for a manager to review
}

export interface LocalShift {
  id: string;
  cashier_id: string;
  opened_at: string;
  opening_cash: number;
  closed_at?: string;
  counted_cash?: number;
}

export interface Meta {
  key: string;
  value: unknown;
}

class PosDB extends Dexie {
  products!: Table<LocalProduct, string>;
  inventory!: Table<LocalInventory, string>;
  staff!: Table<LocalStaff, string>;
  sales!: Table<LocalSale, string>;
  outbox!: Table<OutboxItem, string>;
  shifts!: Table<LocalShift, string>;
  meta!: Table<Meta, string>;

  constructor(name = "toyes-pos") {
    super(name);
    this.version(1).stores({
      products: "id, name, category, barcode",
      inventory: "product_id",
      staff: "id, username, store_id",
      sales: "id, receipt_no, created_at, sync, cashier_id",
      outbox: "id, created_at",
      shifts: "id, cashier_id, opened_at",
      meta: "key",
    });
  }
}

export let localDb = new PosDB();

/** Tests use a fresh database each time. */
export const resetLocalDb = async (name?: string) => {
  localDb.close();
  localDb = new PosDB(name);
  await localDb.open();
  return localDb;
};

export const getMeta = async <T,>(key: string, fallback: T): Promise<T> =>
  ((await localDb.meta.get(key))?.value as T | undefined) ?? fallback;

export const setMeta = (key: string, value: unknown) => localDb.meta.put({ key, value });
