import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useHQ } from "@/hq/HQContext";
import { fetchSales, fetchStaffNames, takings, startOfDay, type SaleRow } from "@/hq/data";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { PageHeader, Panel, Pill, EmptyState, SkeletonRows, btn, Segmented } from "@/components/hq/kit";
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
  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  const [sales, setSales] = useState<SaleRow[] | null>(null);
  const [prev, setPrev] = useState<SaleRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [lowStock, setLowStock] = useState<{ store_id: string; qty: number; products: { name: string } | null }[]>([]);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [s, pv, n, inv] = await Promise.all([
          fetchSales({ from: startOfDay(days - 1), limit: 5000 }),
          fetchSales({ from: startOfDay(days * 2 - 1), to: startOfDay(days - 1), limit: 5000 }),
          fetchStaffNames(),
          supabase!.from("inventory").select("store_id,qty,low_stock_at,products(name)").order("qty").limit(200),
        ]);
        if (!alive) return;
        setSales(s);
        setPrev(pv);
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
  }, [days]);

  const done = (sales ?? []).filter((s) => s.status === "completed");
  const revenue = done.reduce((t, s) => t + s.total, 0);
  const prevDone = prev.filter((x) => x.status === "completed");
  const prevRevenue = prevDone.reduce((t, x) => t + x.total, 0);
  const items = done.reduce((t, x) => t + x.sale_lines.reduce((a, l) => a + l.quantity, 0), 0);
  const discounts = done.reduce((t, x) => t + x.discount, 0);
  const avg = done.length ? revenue / done.length : 0;
  const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);
  const periodWord = range === "today" ? "yesterday" : `previous ${days} days`;

  // Revenue over time: per hour for today, per day otherwise.
  const series = useMemo(() => {
    const buckets: { label: string; key: string; revenue: number; sales: number }[] = [];
    if (range === "today") {
      for (let h = 8; h <= 21; h++) buckets.push({ key: String(h), label: `${h % 12 || 12}${h < 12 ? "am" : "pm"}`, revenue: 0, sales: 0 });
    } else {
      for (let d = days - 1; d >= 0; d--) {
        const dt = new Date(startOfDay(d));
        buckets.push({ key: dt.toDateString(), label: dt.toLocaleDateString("en-NG", days > 7 ? { day: "numeric", month: "short" } : { weekday: "short" }), revenue: 0, sales: 0 });
      }
    }
    for (const x of done) {
      const dt = new Date(x.created_at);
      const k = range === "today" ? String(Math.min(21, Math.max(8, dt.getHours()))) : dt.toDateString();
      const b = buckets.find((y) => y.key === k);
      if (b) { b.revenue += x.total; b.sales += 1; }
    }
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, range]);

  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const x of done) for (const l of x.sale_lines) {
      const k = l.product_id ?? `q:${l.name}`;
      const e = m.get(k) ?? { name: l.name, qty: 0, revenue: 0 };
      e.qty += l.quantity; e.revenue += l.unit_price * l.quantity; m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales]);
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
        subtitle={<span className="inline-flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>Live across {isOwner ? "all stores" : "your store"}{updated ? ` · updated ${updated.toLocaleTimeString("en-NG", { timeStyle: "short" })}` : ""}</span>}
        actions={<Link to="/pos" className={btn.primary}><CreditCard className="h-4 w-4" /> Open POS</Link>}
      />
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {isOwner && stores.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
          <div>
            <p className="font-display text-xl font-extrabold">Let's set up your stores</p>
            <p className="mt-1 text-sm text-ink/70">Add stores → add stock → add staff → sign in on each store's laptop at /pos.</p>
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
            <span className="min-w-0"><span className="block text-[15px] font-bold leading-tight">{a.title}</span><span className="block truncate text-xs text-ink/70">{a.sub}</span></span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold">Performance</h2>
        <Segmented value={range} onChange={(v) => { setSales(null); setRange(v as typeof range); }} options={[{ value: "today", label: "Today" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }]} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[
          { label: "Revenue", value: formatPrice(revenue), delta: change(revenue, prevRevenue), hero: true },
          { label: "Sales", value: done.length.toLocaleString("en-NG"), delta: change(done.length, prevDone.length) },
          { label: "Average sale", value: formatPrice(Math.round(avg)), delta: change(avg, prevDone.length ? prevRevenue / prevDone.length : 0) },
          { label: "Items sold", value: items.toLocaleString("en-NG"), sub: discounts > 0 ? `${formatPrice(discounts)} given as discount` : "No discounts given" },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(16,16,20,0.04)] ${k.hero ? "border-transparent bg-gradient-to-br from-[#E11414] to-[#9F0E0E] text-white" : "border-line bg-white"}`}>
            <p className={`text-[13px] font-medium ${k.hero ? "text-white/75" : "text-ink/70"}`}>{k.label}</p>
            <p className="mt-2 font-display text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{sales === null ? "…" : k.value}</p>
            <p className={`mt-2.5 text-xs font-semibold ${k.hero ? "text-white/80" : "text-ink/70"}`}>
              {"delta" in k && k.delta !== undefined
                ? k.delta === null ? `No sales in the ${periodWord}` : <><span className={k.hero ? "" : k.delta >= 0 ? "text-emerald-700" : "text-red-600"}>{k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}%</span> vs {periodWord}</>
                : k.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={range === "today" ? "Revenue by hour" : "Revenue by day"} className="lg:col-span-2">
          {sales === null ? <SkeletonRows rows={5} /> : (
            <div className="h-64" role="img" aria-label={`Revenue chart: ${series.map((b) => `${b.label} ${formatPrice(b.revenue)}`).join(", ")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="#EEECEA" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6B6B70" }} interval={days > 7 ? 3 : 0} />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: "#6B6B70" }} tickFormatter={(v: number) => (v >= 1e6 ? `₦${(v / 1e6).toFixed(1)}m` : v >= 1000 ? `₦${Math.round(v / 1000)}k` : `₦${v}`)} />
                  <Tooltip cursor={{ fill: "rgba(17,17,20,0.04)" }} content={({ active, payload }) => active && payload?.length ? (
                    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="font-bold">{payload[0].payload.label}</p>
                      <p className="tabular-nums">{formatPrice(payload[0].payload.revenue)} · {payload[0].payload.sales} sale{payload[0].payload.sales === 1 ? "" : "s"}</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="revenue" fill="#E11414" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel title="Top products" action={<span className="text-xs text-ink/70">by revenue</span>} padded={false}>
          {topProducts.length === 0 ? <EmptyState icon={Tag} title="No sales in this period">Best sellers show here.</EmptyState> : (
            <ol className="divide-y divide-line">
              {topProducts.map((t, i) => (
                <li key={t.name + i} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-ink/70">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{t.name}</span><span className="text-xs text-ink/70">{t.qty} sold</span></span>
                  <span className="text-sm font-bold tabular-nums">{formatPrice(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title={range === "today" ? "By store · today" : `By store · ${days} days`}>
          {stores.length === 0 ? <p className="text-sm text-ink/70">No stores yet.</p> : (
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
          {quickCount > 0 && <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">{quickCount} sale{quickCount === 1 ? "" : "s"} in this period included unlisted (quick sale) items.</p>}
        </Panel>

        <Panel title="Latest sales" action={<Link to="/admin/sales" className="text-[13px] font-semibold text-primary hover:underline">View all</Link>} className="lg:col-span-2" padded={false}>
          {sales === null ? <SkeletonRows rows={4} /> : sales.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No sales in this period">Sales appear here the moment a POS rings them up.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {sales.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="hidden w-14 shrink-0 text-xs font-semibold tabular-nums text-ink/70 sm:block">{new Date(s.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.sale_lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink/70">
                      {storeName(s.store_id)} · {names.get(s.cashier_id) ?? "Staff"}
                      
                      {s.status === "refunded" && <Pill tone="bad">Refunded</Pill>}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${s.status === "refunded" ? "text-ink/70 line-through" : ""}`}>{formatPrice(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Stock to watch" action={<Link to="/admin/inventory" className="text-[13px] font-semibold text-primary hover:underline">Inventory</Link>}>
        {lowStock.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-ink/70"><Package className="h-4 w-4" /> Nothing running low.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 12).map((i, k) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-sm">
                <span className="min-w-0"><span className="block truncate font-semibold">{i.products?.name}</span><span className="text-xs text-ink/70">{storeName(i.store_id)}</span></span>
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
