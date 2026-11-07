import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useHQ } from "@/hq/HQContext";
import { fetchSales, fetchStaffNames, takings, startOfDay, type SaleRow } from "@/hq/data";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5";

/** Live view across all stores the signed-in person can see. Refreshes every 15 seconds. */
const Overview = () => {
  const { me, stores, isOwner } = useHQ();
  const [sales, setSales] = useState<SaleRow[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [lowStock, setLowStock] = useState<{ store_id: string; qty: number; products: { name: string } | null }[]>([]);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [s, n, inv] = await Promise.all([
          fetchSales({ from: startOfDay() }),
          fetchStaffNames(),
          supabase!.from("inventory").select("store_id,qty,low_stock_at,products(name)").order("qty").limit(200),
        ]);
        if (!alive) return;
        setSales(s);
        setNames(n);
        setLowStock(((inv.data ?? []) as unknown as { store_id: string; qty: number; low_stock_at: number; products: { name: string } | null }[]).filter((i) => i.qty <= i.low_stock_at));
        setUpdated(new Date());
        setError("");
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    void load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const done = (sales ?? []).filter((s) => s.status === "completed");
  const revenue = done.reduce((t, s) => t + s.total, 0);
  const m = takings(sales ?? []);
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? "Store";
  const quickCount = done.filter((s) => s.sale_lines.some((l) => !l.product_id)).length;

  return (
    <div className="space-y-6">
      <Helmet><title>Overview | Toyes Tech HQ</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {me?.full_name.split(" ")[0]}</h1>
          <p className="text-sm text-black/55">Today across {isOwner ? "all stores" : "your store"}{updated ? ` · updated ${updated.toLocaleTimeString("en-NG", { timeStyle: "short" })}` : ""}</p>
        </div>
        <Link to="/pos" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Open POS</Link>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {isOwner && stores.length === 0 && (
        <div className="rounded-2xl bg-amber-50 p-5 text-amber-900">
          <p className="font-bold">Let's set up your stores</p>
          <p className="mt-1 text-sm">1. Add your stores · 2. Add products and stock · 3. Add staff with PINs · 4. Sign in on each store's laptop at /pos.</p>
          <Link to="/admin/stores" className="mt-3 inline-block rounded-full bg-black px-5 py-2 text-sm font-bold text-white">Add stores</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={card}><p className="text-sm text-black/55">Revenue today</p><p className="mt-1 text-2xl font-extrabold">{formatPrice(revenue)}</p><p className="text-xs text-black/45">{done.length} sales</p></div>
        <div className={card}><p className="text-sm text-black/55">Cash (net)</p><p className="mt-1 text-2xl font-extrabold">{formatPrice(m.cash)}</p></div>
        <div className={card}><p className="text-sm text-black/55">Transfer</p><p className="mt-1 text-2xl font-extrabold">{formatPrice(m.transfer)}</p></div>
        <div className={card}><p className="text-sm text-black/55">Card</p><p className="mt-1 text-2xl font-extrabold">{formatPrice(m.card)}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-1`}>
          <h2 className="mb-3 font-bold">By store</h2>
          {stores.map((st) => {
            const mine = done.filter((s) => s.store_id === st.id);
            return (
              <div key={st.id} className="flex items-center justify-between border-t border-gray-100 py-2.5 text-sm">
                <span>{st.name} <span className="text-black/45">({mine.length})</span></span>
                <span className="font-bold">{formatPrice(mine.reduce((t, s) => t + s.total, 0))}</span>
              </div>
            );
          })}
          {quickCount > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">{quickCount} sale(s) today included unlisted (quick sale) items.</p>}
        </section>

        <section className={`${card} lg:col-span-2`}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Live sales</h2><Link to="/admin/sales" className="text-sm font-semibold text-primary">All sales</Link></div>
          {sales === null ? <p className="text-sm text-black/50">Loading…</p> : sales.length === 0 ? <p className="py-6 text-center text-sm text-black/50">No sales yet today.</p> : (
            <ul className="divide-y divide-gray-100">
              {sales.slice(0, 12).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.sale_lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}</p>
                    <p className="text-xs text-black/50">
                      {new Date(s.created_at).toLocaleTimeString("en-NG", { timeStyle: "short" })} · {storeName(s.store_id)} · {names.get(s.cashier_id) ?? "Staff"}
                      {s.offline && " · made offline"}{s.status === "refunded" && " · refunded"}
                    </p>
                  </div>
                  <span className={`shrink-0 font-extrabold ${s.status === "refunded" ? "text-black/35 line-through" : ""}`}>{formatPrice(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Low stock</h2><Link to="/admin/inventory" className="text-sm font-semibold text-primary">Inventory</Link></div>
        {lowStock.length === 0 ? <p className="text-sm text-black/50">Nothing running low.</p> : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 12).map((i, k) => (
              <div key={k} className={`rounded-xl px-3 py-2 text-sm ${i.qty < 0 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
                <b>{i.products?.name}</b> · {storeName(i.store_id)} · {i.qty < 0 ? `${i.qty} (check stock)` : `${i.qty} left`}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Overview;
