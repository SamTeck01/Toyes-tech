import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHQ, rpc } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import MoneyInput from "@/components/MoneyInput";

interface Row { id: string; name: string; category: string; base_price: number; barcode: string | null; qty: number; price: number | null; low: number }
type Action = { kind: "receive" | "count" | "price" | "transfer"; row: Row };
const toNumber = (v: string) => Number(v.replace(/[^\d.-]/g, "")) || 0;
const input = "w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5";

const Inventory = () => {
  const { me, stores, isOwner } = useHQ();
  const myStores = isOwner ? stores : stores.filter((s) => s.id === me?.store_id);
  const [storeId, setStoreId] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [action, setAction] = useState<Action | null>(null);
  const [a, setA] = useState({ qty: "", price: "", low: "", note: "", to: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!storeId && myStores[0]) setStoreId(myStores[0].id);
  }, [myStores, storeId]);

  const load = async () => {
    if (!storeId) return;
    const [p, inv] = await Promise.all([
      supabase!.from("products").select("id,name,category,base_price,barcode").eq("active", true).order("name"),
      supabase!.from("inventory").select("product_id,qty,price,low_stock_at").eq("store_id", storeId),
    ]);
    const map = new Map((inv.data ?? []).map((i) => [i.product_id as string, i] as const));
    setRows((p.data ?? []).map((x) => {
      const i = map.get(x.id);
      return { ...x, base_price: Number(x.base_price), qty: i?.qty ?? 0, price: i?.price == null ? null : Number(i.price), low: i?.low_stock_at ?? 2 } as Row;
    }));
  };
  useEffect(() => {
    setRows(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const shown = useMemo(() => (rows ?? []).filter((r) =>
    (!q || `${r.name} ${r.barcode ?? ""} ${r.id}`.toLowerCase().includes(q.toLowerCase())) &&
    (filter === "all" || (filter === "low" ? r.qty <= r.low && r.qty > 0 : r.qty <= 0))), [rows, q, filter]);
  const value = (rows ?? []).reduce((t, r) => t + Math.max(0, r.qty) * (r.price ?? r.base_price), 0);

  const open = (kind: Action["kind"], row: Row) => {
    setAction({ kind, row });
    setA({ qty: kind === "count" ? String(row.qty) : "", price: String(row.price ?? row.base_price), low: String(row.low), note: "", to: "" });
  };

  const save = async () => {
    if (!action) return;
    const { kind, row } = action;
    setBusy(true);
    try {
      if (kind === "receive") {
        const n = Math.floor(toNumber(a.qty));
        if (n <= 0) throw new Error("Enter how many arrived.");
        await rpc("adjust_stock", { p_store: storeId, p_product: row.id, p_delta: n, p_reason: "receive", p_note: a.note || null });
        toast.success(`Added ${n} ${row.name}`);
      } else if (kind === "count") {
        const counted = Math.floor(toNumber(a.qty));
        const delta = counted - row.qty;
        if (delta !== 0) await rpc("adjust_stock", { p_store: storeId, p_product: row.id, p_delta: delta, p_reason: "adjust", p_note: a.note || "Stock count" });
        toast.success(delta === 0 ? "Count matches" : `Stock set to ${counted}`);
      } else if (kind === "price") {
        await rpc("set_store_price", { p_store: storeId, p_product: row.id, p_price: toNumber(a.price), p_low_stock_at: Math.max(0, Math.floor(toNumber(a.low))) });
        toast.success("Price saved");
      } else {
        const n = Math.floor(toNumber(a.qty));
        if (n <= 0 || !a.to) throw new Error("Choose a store and quantity.");
        await rpc("transfer_stock", { p_from: storeId, p_to: a.to, p_product: row.id, p_qty: n, p_note: a.note || null });
        toast.success(`Moved ${n} ${row.name}`);
      }
      setAction(null);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Helmet><title>Inventory | Toyes Tech HQ</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight md:text-[32px]">Inventory</h1>
          <p className="text-sm text-ink/55">Each store has its own stock. Stock value: {formatPrice(value)}</p>
        </div>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:border-ink/25 hover:bg-stone-50 disabled:opacity-40">
          {myStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or barcode" className="min-w-[220px] flex-1 rounded-full bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-primary" />
        {(["all", "low", "out"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-bold ${filter === f ? "bg-ink text-white shadow-sm" : "border border-line bg-white"}`}>{f === "all" ? "All" : f === "low" ? "Running low" : "Out / negative"}</button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
        {rows === null ? <p className="p-6 text-sm text-ink/50">{myStores.length ? "Loading…" : "Add a store first."}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs font-semibold text-ink/50"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">In stock</th><th className="px-4 py-3 text-right">Price here</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3"><p className="font-semibold">{r.name}</p><p className="text-xs text-ink/45">{r.category} · {r.barcode ?? r.id}</p></td>
                    <td className={`px-4 py-3 text-right font-extrabold ${r.qty < 0 ? "text-red-600" : r.qty <= r.low ? "text-amber-600" : ""}`}>{r.qty}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(r.price ?? r.base_price)}{r.price != null && r.price !== r.base_price && <span className="block text-[11px] text-ink/45">store price</span>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button onClick={() => open("receive", r)} className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">+ Stock in</button>
                      <button onClick={() => open("count", r)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-stone-100">Count</button>
                      <button onClick={() => open("price", r)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-stone-100">Price</button>
                      {isOwner && stores.length > 1 && <button onClick={() => open("transfer", r)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-stone-100">Move</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="p-8 text-center text-sm text-ink/50">{rows.length ? "Nothing matches." : "No products yet. The owner adds them under Products."}</p>}
          </div>
        )}
      </section>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{action?.kind === "receive" ? "Stock in" : action?.kind === "count" ? "Stock count" : action?.kind === "price" ? "Price at this store" : "Move to another store"}</DialogTitle>
            <DialogDescription>{action?.row.name} · now {action?.row.qty} in stock</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            {action?.kind === "price" ? (
              <>
                <MoneyInput label="Selling price" autoFocus value={toNumber(a.price)} onChange={(n) => setA({ ...a, price: String(n || "") })} />
                <label className="block text-sm font-semibold">Warn me when stock is at or below<input inputMode="numeric" className={`${input} mt-1.5`} value={a.low} onChange={(e) => setA({ ...a, low: e.target.value })} /></label>
              </>
            ) : (
              <>
                {action?.kind === "transfer" && (
                  <label className="block text-sm font-semibold">To store
                    <select required className={`${input} mt-1.5`} value={a.to} onChange={(e) => setA({ ...a, to: e.target.value })}>
                      <option value="">Choose…</option>
                      {stores.filter((s) => s.id !== storeId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="block text-sm font-semibold">{action?.kind === "count" ? "How many are actually on the shelf?" : "Quantity"}
                  <input autoFocus required inputMode="numeric" className={`${input} mt-1.5 text-right text-lg font-bold`} value={a.qty} onChange={(e) => setA({ ...a, qty: e.target.value })} />
                </label>
                <input className={input} placeholder={action?.kind === "receive" ? "Supplier / note (optional)" : "Note (optional)"} value={a.note} onChange={(e) => setA({ ...a, note: e.target.value })} />
              </>
            )}
            <button disabled={busy} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
