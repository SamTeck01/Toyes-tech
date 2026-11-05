import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSales, type Sale, type PaymentMethod } from "@/context/SalesContext";
import { PICKUP_LOCATIONS } from "@/config/store";
import { formatPrice } from "@/lib/format";
import Receipt from "@/components/pos/Receipt";

const RANGES = { today: "Today", week: "Last 7 days", month: "Last 30 days", all: "All time" } as const;
type Range = keyof typeof RANGES;
const METHOD_LABEL: Record<PaymentMethod, string> = { cash: "Cash", transfer: "Transfer", card: "Card (POS)" };

const startOf = (r: Range) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (r === "week") d.setDate(d.getDate() - 6);
  if (r === "month") d.setDate(d.getDate() - 29);
  return r === "all" ? 0 : d.getTime();
};

/** Net amount actually kept per payment method (cash minus change given). */
const byMethod = (sales: Sale[]) => {
  const out: Record<PaymentMethod, number> = { cash: 0, transfer: 0, card: 0 };
  sales.forEach((s) => {
    s.payments.forEach((p) => (out[p.method] += p.amount));
    out.cash -= s.change;
  });
  return out;
};

const Sales = () => {
  const { sales, refundSale } = useSales();
  const [range, setRange] = useState<Range>("today");
  const [branch, setBranch] = useState("");
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<Sale | null>(null);
  const [printSummary, setPrintSummary] = useState(false);

  const inRange = useMemo(
    () => sales.filter((s) => new Date(s.date).getTime() >= startOf(range) && (!branch || s.branch === branch)),
    [sales, range, branch],
  );
  const completed = inRange.filter((s) => s.status === "completed");
  const revenue = completed.reduce((t, s) => t + s.total, 0);
  const items = completed.reduce((t, s) => t + s.lines.reduce((n, l) => n + l.quantity, 0), 0);
  const refunds = inRange.filter((s) => s.status === "refunded");
  const methods = byMethod(completed);

  const cashiers = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    completed.forEach((s) => {
      const c = m.get(s.cashier) ?? { count: 0, total: 0 };
      m.set(s.cashier, { count: c.count + 1, total: c.total + s.total });
    });
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [completed]);

  const topProducts = useMemo(() => {
    const m = new Map<string, { qty: number; total: number }>();
    completed.forEach((s) => s.lines.forEach((l) => {
      const c = m.get(l.name) ?? { qty: 0, total: 0 };
      m.set(l.name, { qty: c.qty + l.quantity, total: c.total + l.unitPrice * l.quantity });
    }));
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  }, [completed]);

  const exportCsv = () => {
    const rows = [
      ["Receipt", "Date", "Branch", "Cashier", "Items", "Subtotal", "Discount", "Total", "Payments", "Status"],
      ...inRange.map((s) => [
        s.id,
        new Date(s.date).toLocaleString("en-NG"),
        s.branch,
        s.cashier,
        s.lines.map((l) => `${l.quantity}x ${l.name}`).join("; "),
        s.subtotal,
        s.discount,
        s.total,
        s.payments.map((p) => `${METHOD_LABEL[p.method]} ${p.amount}`).join("; "),
        s.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `toyes-sales-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stat = (label: string, value: string, sub?: string) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-black/55">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-black/45">{sub}</p>}
    </div>
  );

  return (
    <AdminLayout>
      <Helmet><title>Sales | Toyes Tech Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">In-store sales</h1>
            <p className="text-sm text-black/55">Sales rung up on the point of sale, with end-of-day totals.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setPrintSummary(true); setTimeout(() => { window.print(); setPrintSummary(false); }, 100); }} className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold hover:border-black/40">Print summary</button>
            <button onClick={exportCsv} disabled={!inRange.length} className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold hover:border-black/40 disabled:opacity-40">Export CSV</button>
            <Link to="/admin/pos" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Open POS</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-full px-4 py-2 text-sm font-bold ${range === r ? "bg-black text-white" : "bg-white text-black/65 ring-1 ring-black/10"}`}>{RANGES[r]}</button>
          ))}
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10">
            <option value="">All branches</option>
            {PICKUP_LOCATIONS.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>

        {/* End-of-day summary (also what gets printed) */}
        <div className={printSummary ? "print-area" : ""}>
          {printSummary && (
            <div className="mb-4">
              <p className="text-xl font-bold">Toyes Tech · Sales summary</p>
              <p className="text-sm">{RANGES[range]} · {branch || "All branches"} · printed {new Date().toLocaleString("en-NG")}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stat("Revenue", formatPrice(revenue), `${completed.length} sales`)}
            {stat("Average sale", formatPrice(completed.length ? Math.round(revenue / completed.length) : 0))}
            {stat("Items sold", String(items))}
            {stat("Refunds", String(refunds.length), refunds.length ? formatPrice(refunds.reduce((t, s) => t + s.total, 0)) : undefined)}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 font-bold">Takings by payment</h2>
              <p className="mb-3 text-xs text-black/50">Cash is net of change given. Count the drawer against it.</p>
              {(Object.keys(methods) as PaymentMethod[]).map((m) => (
                <div key={m} className="flex justify-between border-t border-gray-100 py-2 text-sm"><span>{METHOD_LABEL[m]}</span><span className="font-bold">{formatPrice(methods[m])}</span></div>
              ))}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 font-bold">By cashier</h2>
              {cashiers.length === 0 ? <p className="text-sm text-black/50">No sales yet.</p> : cashiers.map(([name, c]) => (
                <div key={name} className="flex justify-between border-t border-gray-100 py-2 text-sm"><span>{name} <span className="text-black/45">({c.count})</span></span><span className="font-bold">{formatPrice(c.total)}</span></div>
              ))}
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="mb-3 font-bold">Top products</h2>
              {topProducts.length === 0 ? <p className="text-sm text-black/50">No sales yet.</p> : topProducts.map(([name, c]) => (
                <div key={name} className="flex justify-between gap-2 border-t border-gray-100 py-2 text-sm"><span className="truncate">{c.qty}× {name}</span><span className="shrink-0 font-bold">{formatPrice(c.total)}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-bold">Sales ({inRange.length})</h2></div>
          {inRange.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-bold">No sales in this period</p>
              <p className="mt-1 text-sm text-black/55">Sales you complete on the POS will appear here.</p>
              <Link to="/admin/pos" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Open POS</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs text-black/55">
                  <tr><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Cashier</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Paid by</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inRange.map((s) => (
                    <tr key={s.id} className={s.status === "refunded" ? "text-black/40" : ""}>
                      <td className="whitespace-nowrap px-5 py-3 font-bold">{s.id}{s.status === "refunded" && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600">Refunded</span>}</td>
                      <td className="whitespace-nowrap px-5 py-3">{new Date(s.date).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="px-5 py-3">{s.cashier}<span className="block text-xs text-black/45">{s.branch}</span></td>
                      <td className="max-w-[260px] truncate px-5 py-3">{s.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}</td>
                      <td className="whitespace-nowrap px-5 py-3">{s.payments.map((p) => METHOD_LABEL[p.method]).join(" + ")}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-extrabold">{formatPrice(s.total)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button onClick={() => setViewing(s)} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-100">Receipt</button>
                        {s.status === "completed" && <button onClick={() => setConfirmRefund(s)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Refund</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[92dvh] max-w-sm overflow-y-auto">
          <DialogHeader><DialogTitle>Receipt {viewing?.id}</DialogTitle><DialogDescription>Reprint for the customer.</DialogDescription></DialogHeader>
          {viewing && <div className="print-area rounded-xl border border-gray-200"><Receipt sale={viewing} /></div>}
          <button onClick={() => window.print()} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white">Print receipt</button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRefund} onOpenChange={(o) => !o && setConfirmRefund(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Refund {confirmRefund?.id}?</DialogTitle>
            <DialogDescription>
              Give the customer back {confirmRefund && formatPrice(confirmRefund.total)}. The items go back into stock. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmRefund(null)} className="rounded-xl border border-gray-200 py-3 text-sm font-bold">Cancel</button>
            <button
              onClick={() => { if (confirmRefund) { refundSale(confirmRefund.id); toast.success(`Refunded ${confirmRefund.id}`); } setConfirmRefund(null); }}
              className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
            >
              Refund
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Sales;
