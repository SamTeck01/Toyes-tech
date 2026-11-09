import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useHQ } from "@/hq/HQContext";
import { fetchSales, fetchStaffNames, takings, startOfDay, type SaleRow } from "@/hq/data";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { PageHeader, Panel, StatCard, Pill, EmptyState, SkeletonRows, btn } from "@/components/hq/kit";
import { TrendingUp, CreditCard, ShoppingBag, Package, MapPin, Tag, Users } from "@/components/icons";

/** "Mr Toye" → "Mr Toye", "Tolu Ade" → "Tolu": keep titles with the name they belong to. */
const TITLES = /^(mr|mrs|ms|miss|dr|chief|engr|alhaji|alhaja|pastor|prof|barr|sir)\.?$/i;
const greetName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return TITLES.test(parts[0] ?? "") ? parts.slice(0, 2).join(" ") : parts[0] ?? "";
};

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

  const hour = new Date().getHours();
  const best = [...stores].map((st) => ({ st, total: done.filter((s) => s.store_id === st.id).reduce((t, s) => t + s.total, 0) })).sort((a, b) => b.total - a.total);
  const top = best[0]?.total || 1;

  return (
    <div className="space-y-6">
      <Helmet><title>Overview | Toyes Tech HQ</title></Helmet>
      <PageHeader
        title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, ${greetName(me?.full_name ?? "")}`}
        subtitle={<span className="inline-flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>Live today across {isOwner ? "all stores" : "your store"}{updated ? ` · updated ${updated.toLocaleTimeString("en-NG", { timeStyle: "short" })}` : ""}</span>}
        actions={<Link to="/pos" className={btn.primary}><CreditCard className="h-4 w-4" /> Open POS</Link>}
      />
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {isOwner && stores.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
          <div>
            <p className="font-display text-xl font-extrabold">Let's set up your stores</p>
            <p className="mt-1 text-sm text-ink/55">Add stores → add stock → add staff with PINs → sign in on each store's laptop at /pos.</p>
          </div>
          <Link to="/admin/stores" className={btn.primary}><MapPin className="h-4 w-4" /> Add your first store</Link>
        </div>
      )}

      {/* The jobs people do every day, one tap away. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { to: "/admin/products?new=1", icon: Tag, title: "Add a product", sub: "Photo, price and stock" },
          { to: "/admin/inventory", icon: Package, title: "Stock arrived", sub: "Add new deliveries" },
          { to: "/admin/staff?new=1", icon: Users, title: "Add staff", sub: "Cashier or manager" },
          { to: "/admin/sales", icon: TrendingUp, title: "Today's sales", sub: "Receipts and refunds" },
        ].map((a) => (
          <Link key={a.title} to={a.to} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><a.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="block text-[15px] font-bold leading-tight">{a.title}</span><span className="block truncate text-xs text-ink/50">{a.sub}</span></span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Revenue today" value={formatPrice(revenue)} sub={`${done.length} sale${done.length === 1 ? "" : "s"}`} icon={TrendingUp} tone="accent" />
        <StatCard label="Cash in drawers" value={formatPrice(m.cash)} sub="After change given" icon={CreditCard} tone="good" />
        <StatCard label="Transfers" value={formatPrice(m.transfer)} icon={ShoppingBag} />
        <StatCard label="Card (POS)" value={formatPrice(m.card)} icon={CreditCard} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="By store">
          {stores.length === 0 ? <p className="text-sm text-ink/50">No stores yet.</p> : (
            <ul className="space-y-4">
              {best.map(({ st, total }) => (
                <li key={st.id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">{st.name}</span>
                    <span className="font-bold tabular-nums">{formatPrice(total)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(2, (total / top) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {quickCount > 0 && <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">{quickCount} sale{quickCount === 1 ? "" : "s"} today included unlisted (quick sale) items.</p>}
        </Panel>

        <Panel title="Live sales" action={<Link to="/admin/sales" className="text-[13px] font-semibold text-primary hover:underline">View all</Link>} className="lg:col-span-2" padded={false}>
          {sales === null ? <SkeletonRows rows={4} /> : sales.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No sales yet today">Sales appear here the moment a POS rings them up.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {sales.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="hidden w-14 shrink-0 text-xs font-semibold tabular-nums text-ink/45 sm:block">{new Date(s.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.sale_lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink/50">
                      {storeName(s.store_id)} · {names.get(s.cashier_id) ?? "Staff"}
                      {s.offline && <Pill tone="neutral">Made offline</Pill>}
                      {s.status === "refunded" && <Pill tone="bad">Refunded</Pill>}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${s.status === "refunded" ? "text-ink/35 line-through" : ""}`}>{formatPrice(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Stock to watch" action={<Link to="/admin/inventory" className="text-[13px] font-semibold text-primary hover:underline">Inventory</Link>}>
        {lowStock.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-ink/55"><Package className="h-4 w-4" /> Nothing running low.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 12).map((i, k) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm">
                <span className="min-w-0"><span className="block truncate font-semibold">{i.products?.name}</span><span className="text-xs text-ink/50">{storeName(i.store_id)}</span></span>
                <Pill tone={i.qty < 0 ? "bad" : i.qty === 0 ? "warn" : "neutral"}>{i.qty < 0 ? `${i.qty} · check` : `${i.qty} left`}</Pill>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default Overview;
