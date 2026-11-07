import { supabase } from "@/lib/supabase";
import type { LocalSale } from "@/pos/localdb";

export interface SaleRow {
  id: string;
  receipt_no: string;
  store_id: string;
  cashier_id: string;
  created_at: string;
  synced_at: string;
  offline: boolean;
  subtotal: number;
  discount: number;
  total: number;
  change_given: number;
  payments: { method: "cash" | "transfer" | "card"; amount: number }[];
  customer_name: string | null;
  customer_phone: string | null;
  status: "completed" | "refunded";
  refund_reason: string | null;
  sale_lines: { product_id: string | null; name: string; unit_price: number; quantity: number }[];
}

const num = (x: unknown) => Number(x ?? 0);

export const fetchSales = async (opts: { from: string; to?: string; storeId?: string; limit?: number }) => {
  let q = supabase!
    .from("sales")
    .select("*, sale_lines(product_id,name,unit_price,quantity)")
    .gte("created_at", opts.from)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 1000);
  if (opts.to) q = q.lt("created_at", opts.to);
  if (opts.storeId) q = q.eq("store_id", opts.storeId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    ...s,
    subtotal: num(s.subtotal),
    discount: num(s.discount),
    total: num(s.total),
    change_given: num(s.change_given),
    payments: (s.payments ?? []).map((p: { method: string; amount: unknown }) => ({ ...p, amount: num(p.amount) })),
    sale_lines: (s.sale_lines ?? []).map((l: { unit_price: unknown }) => ({ ...l, unit_price: num(l.unit_price) })),
  })) as SaleRow[];
};

export const fetchStaffNames = async () => {
  const { data } = await supabase!.from("staff").select("id,full_name");
  return new Map((data ?? []).map((s) => [s.id as string, s.full_name as string] as const));
};

/** Net takings per payment method (cash is net of change given). */
export const takings = (sales: SaleRow[]) => {
  const out = { cash: 0, transfer: 0, card: 0 };
  sales.filter((s) => s.status === "completed").forEach((s) => {
    s.payments.forEach((p) => (out[p.method] += p.amount));
    out.cash -= s.change_given;
  });
  return out;
};

/** Shape a server sale like a till sale so the same receipt component can print it. */
export const asReceipt = (s: SaleRow, storeName: string, cashierName: string): LocalSale => ({
  id: s.id,
  receipt_no: s.receipt_no,
  store_id: s.store_id,
  store_name: storeName,
  device_id: "",
  cashier_id: s.cashier_id,
  cashier_name: cashierName,
  created_at: s.created_at,
  offline: s.offline,
  lines: s.sale_lines,
  subtotal: s.subtotal,
  discount: s.discount,
  total: s.total,
  change_given: s.change_given,
  payments: s.payments,
  customer_name: s.customer_name ?? undefined,
  customer_phone: s.customer_phone ?? undefined,
  status: s.status,
  sync: "synced",
});

export const startOfDay = (daysAgo = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};
