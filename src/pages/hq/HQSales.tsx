import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHQ, rpc } from "@/hq/HQContext";
import { fetchSales, fetchStaffNames, takings, startOfDay, asReceipt, type SaleRow } from "@/hq/data";
import { formatPrice } from "@/lib/format";
import PosReceipt from "@/pages/pos/PosReceipt";
import { Pill } from "@/components/hq/kit";

const RANGES = { today: ["Today", 0], yesterday: ["Yesterday", 1], week: ["Last 7 days", 6], month: ["Last 30 days", 29] } as const;
type Range = keyof typeof RANGES;
const METHOD = { cash: "Cash", transfer: "Transfer", card: "Card" } as const;
const card = "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)] p-5";

const HQSales = () => {
  const { stores, canManage, isOwner } = useHQ();
  const [range, setRange] = useState<Range>("today");
  const [storeId, setStoreId] = useState("");
  const [sales, setSales] = useState<SaleRow[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [viewing, setViewing] = useState<SaleRow | null>(null);
  const [refunding, setRefunding] = useState<SaleRow | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const days = RANGES[range][1];
      const [s, n] = await Promise.all([
        fetchSales({ from: startOfDay(days), to: range === "yesterday" ? startOfDay(0) : undefined, storeId: storeId || undefined }),
        fetchStaffNames(),
      ]);
      setSales(s);
      setNames(n);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    setSales(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, storeId]);

  const done = (sales ?? []).filter((s) => s.status === "completed");
  const revenue = done.reduce((t, s) => t + s.total, 0);
  const m = takings(sales ?? []);
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? "Store";

  const byCashier = useMemo(() => {
    const map = new Map<string, { n: number; total: number }>();
    done.forEach((s) => {
      const c = map.get(s.cashier_id) ?? { n: 0, total: 0 };
      map.set(s.cashier_id, { n: c.n + 1, total: c.total + s.total });
    });
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [done]);

  const quickItems = useMemo(() => done.flatMap((s) => s.sale_lines.filter((l) => !l.product_id).map((l) => ({ ...l, store: s.store_id, at: s.created_at }))), [done]);

  const exportCsv = () => {
    const rows = [["Receipt", "Date", "Store", "Cashier", "Items", "Subtotal", "Discount", "Total", "Paid by", "Status", "Made offline"],
      ...(sales ?? []).map((s) => [s.receipt_no, new Date(s.created_at).toLocaleString("en-NG"), storeName(s.store_id), names.get(s.cashier_id) ?? "", s.sale_lines.map((l) => `${l.quantity}x ${l.name}${l.product_id ? "" : " (quick)"}`).join("; "), s.subtotal, s.discount, s.total, s.payments.map((p) => `${METHOD[p.method]} ${p.amount}`).join("; "), s.status, s.offline ? "yes" : "no"])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `toyes-sales-${range}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Sales | Toyes Tech HQ</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[28px] font-extrabold tracking-tight md:text-[32px]">Sales</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:border-ink/25 hover:bg-stone-50 disabled:opacity-40">Print</button>
          <button onClick={exportCsv} disabled={!sales?.length} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:border-ink/25 hover:bg-stone-50 disabled:opacity-40 disabled:opacity-40">Export to Excel (CSV)</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGES) as Range[]).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`rounded-full px-4 py-2 text-sm font-bold ${range === r ? "bg-ink text-white shadow-sm" : "border border-line bg-white"}`}>{RANGES[r][0]}</button>
        ))}
        {isOwner && (
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10">
            <option value="">All stores</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="print-area space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className={card}><p className="text-sm text-ink/55">Revenue</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{formatPrice(revenue)}</p><p className="text-xs text-ink/45">{done.length} sales</p></div>
          <div className={card}><p className="text-sm text-ink/55">Cash (net)</p><p className="mt-1 text-xl font-extrabold tabular-nums">{formatPrice(m.cash)}</p></div>
          <div className={card}><p className="text-sm text-ink/55">Transfer</p><p className="mt-1 text-xl font-extrabold tabular-nums">{formatPrice(m.transfer)}</p></div>
          <div className={card}><p className="text-sm text-ink/55">Card</p><p className="mt-1 text-xl font-extrabold tabular-nums">{formatPrice(m.card)}</p></div>
          <div className={card}><p className="text-sm text-ink/55">Refunds</p><p className="mt-1 text-xl font-extrabold">{(sales ?? []).filter((s) => s.status === "refunded").length}</p></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="mb-2 font-bold">By cashier</h2>
            {byCashier.length === 0 ? <p className="text-sm text-ink/50">No sales.</p> : byCashier.map(([id, c]) => (
              <div key={id} className="flex justify-between border-t border-line py-2 text-sm"><span>{names.get(id) ?? "Staff"} <span className="text-ink/45">({c.n})</span></span><b>{formatPrice(c.total)}</b></div>
            ))}
          </section>
          <section className={card}>
            <h2 className="mb-2 font-bold">Unlisted items sold (quick sale)</h2>
            {quickItems.length === 0 ? <p className="text-sm text-ink/50">None.</p> : quickItems.slice(0, 12).map((q, i) => (
              <div key={i} className="flex justify-between gap-2 border-t border-line py-2 text-sm"><span className="truncate">{q.quantity}× {q.name} <span className="text-ink/45">· {storeName(q.store)}</span></span><b>{formatPrice(q.unit_price * q.quantity)}</b></div>
            ))}
          </section>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
        {sales === null ? <p className="p-6 text-sm text-ink/50">Loading…</p> : sales.length === 0 ? <p className="p-10 text-center text-sm text-ink/50">No sales in this period.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs font-semibold text-ink/50"><tr><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Cashier</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Paid by</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-line">
                {sales.map((s) => (
                  <tr key={s.id} className={s.status === "refunded" ? "text-ink/40" : ""}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{s.receipt_no}<span className="ml-2 inline-flex gap-1 align-middle">{s.status === "refunded" && <Pill tone="bad">Refunded</Pill>}{s.offline && <Pill>Offline</Pill>}</span></td>
                    <td className="whitespace-nowrap px-4 py-3">{new Date(s.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="whitespace-nowrap px-4 py-3">{names.get(s.cashier_id)}<span className="block text-xs text-ink/45">{storeName(s.store_id)}</span></td>
                    <td className="max-w-[220px] truncate px-4 py-3">{s.sale_lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}</td>
                    <td className="whitespace-nowrap px-4 py-3">{s.payments.map((p) => METHOD[p.method]).join(" + ")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold tabular-nums">{formatPrice(s.total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button onClick={() => setViewing(s)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-stone-100">Receipt</button>
                      {canManage && s.status === "completed" && <button onClick={() => { setRefunding(s); setReason(""); }} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Refund</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[92dvh] max-w-sm overflow-y-auto">
          <DialogHeader><DialogTitle>Receipt {viewing?.receipt_no}</DialogTitle><DialogDescription>Reprint for the customer.</DialogDescription></DialogHeader>
          {viewing && <div className="print-area rounded-xl border border-line"><PosReceipt sale={asReceipt(viewing, storeName(viewing.store_id), names.get(viewing.cashier_id) ?? "")} /></div>}
          <button onClick={() => window.print()} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white">Print receipt</button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!refunding} onOpenChange={(o) => !o && setRefunding(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Refund {refunding?.receipt_no}?</DialogTitle>
            <DialogDescription>Give back {refunding && formatPrice(refunding.total)}. Listed items go back into stock. The owner gets a WhatsApp alert. This can't be undone.</DialogDescription>
          </DialogHeader>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (e.g. faulty, changed mind)" className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setRefunding(null)} className="rounded-xl border border-line py-3 text-sm font-bold">Cancel</button>
            <button
              disabled={!reason.trim()}
              onClick={async () => {
                try {
                  await rpc("refund_sale", { p_sale: refunding!.id, p_reason: reason.trim() });
                  toast.success(`Refunded ${refunding!.receipt_no}`);
                  setRefunding(null);
                  void load();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              Refund
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HQSales;
