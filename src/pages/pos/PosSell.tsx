import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, X, ShoppingCart, Clock, Check, Menu } from "@/components/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { localDb, getMeta, setMeta, type LocalSale, type LocalStaff, type SaleLine, type PaymentMethod, type LocalShift } from "@/pos/localdb";
import { recordSale, computeTotals, subscribe, syncNow, retryFailed, openShift, closeShift, expectedCash, type Device, type SyncStatus } from "@/pos/engine";
import { setCashier, type Me } from "@/pos/session";
import { searchProducts } from "@/lib/search";
import { formatPrice } from "@/lib/format";
import PosReceipt from "./PosReceipt";
import { LogoMark } from "@/components/Logo";
import { Kbd } from "@/components/hq/kit";

/** Small live clock for the till header. */
const Clock24 = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return <>{now.toLocaleString("en-NG", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</>;
};
import type { Product } from "@/data/products";

const DEPTS = ["All", "Gadgets", "Phones", "Laptops"];
const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "transfer", label: "Transfer" },
  { id: "card", label: "Card (POS)" },
];
const toNumber = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
type Held = { id: string; label: string; lines: SaleLine[]; at: string };

const StatusPill = () => {
  const [s, setS] = useState<SyncStatus | null>(null);
  useEffect(() => {
    const off = subscribe(setS);
    return () => { off(); };
  }, []);
  if (!s) return null;
  const offline = s.problem === "offline" || !s.online;
  const tone = s.failed ? "bg-red-500/15 text-red-200 ring-red-400/30" : s.problem === "auth" || s.pending ? "bg-amber-400/15 text-amber-200 ring-amber-300/30" : offline ? "bg-white/10 text-white/80 ring-white/15" : "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30";
  const label = s.failed
    ? `${s.failed} sale(s) need attention`
    : s.problem === "auth"
      ? `Sign in again to sync · ${s.pending} waiting`
      : offline
        ? `Offline · ${s.pending} waiting · still selling`
        : s.pending
          ? s.syncing ? `Syncing ${s.pending}…` : `${s.pending} waiting to sync`
          : "Online · all synced";
  return (
    <button onClick={() => (s.failed ? retryFailed() : syncNow())} title={s.message} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition hover:brightness-125 ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${s.failed ? "bg-red-400" : offline ? "bg-white/50" : s.pending || s.problem === "auth" ? "bg-amber-300" : "bg-emerald-400"} ${s.syncing ? "animate-pulse" : ""}`} />
      <span className="max-w-[220px] truncate">{label}</span>
    </button>
  );
};

const PosSell = ({ device, cashier, me }: { device: Device; cashier: LocalStaff; me: Me }) => {
  const products = useLiveQuery(() => localDb.products.toArray(), [], []);
  const inventory = useLiveQuery(() => localDb.inventory.toArray(), [], []);
  const todaysSales = useLiveQuery(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return localDb.sales.where("created_at").aboveOrEqual(start.toISOString()).reverse().toArray();
  }, [], []);
  const held = useLiveQuery(() => getMeta<Held[]>("held", []), [], []);
  const shift = useLiveQuery(async () => (await localDb.shifts.where("cashier_id").equals(cashier.id).toArray()).find((s) => !s.closed_at) ?? null, [cashier.id], null);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | "split">("cash");
  const [tendered, setTendered] = useState("");
  const [split, setSplit] = useState<{ method: PaymentMethod; amount: string }[]>([{ method: "cash", amount: "" }, { method: "transfer", amount: "" }]);
  const [paying, setPaying] = useState(false);
  const [completed, setCompleted] = useState<LocalSale | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", price: "", qty: "1" });
  const [cartSheet, setCartSheet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [reprint, setReprint] = useState<LocalSale | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const priceOf = (id: string) => stock.get(id)?.price ?? products.find((p) => p.id === id)?.base_price ?? 0;
  const qtyLeft = (id: string) => (stock.get(id)?.qty ?? 0) - lines.filter((l) => l.product_id === id).reduce((s, l) => s + l.quantity, 0);

  const stock = useMemo(() => new Map(inventory.map((i) => [i.product_id, i] as const)), [inventory]);
  const visible = useMemo(() => {
    const asProducts = products.map((p) => ({ ...p, price: p.base_price, inStock: true, stock: 0 }) as unknown as Product);
    const base = query.trim() ? searchProducts(asProducts, query).map((p) => products.find((x) => x.id === p.id)!) : products;
    const barcodeHit = products.filter((p) => p.barcode && p.barcode === query.trim());
    const list = [...barcodeHit, ...base.filter((p) => !barcodeHit.includes(p))].filter((p) => dept === "All" || p.category === dept);
    // Items this store actually has come first; when not searching, keep them in name order.
    const inStock = (id: string) => ((stock.get(id)?.qty ?? 0) > 0 ? 0 : 1);
    return query.trim() ? list : [...list].sort((a, b) => inStock(a.id) - inStock(b.id) || a.name.localeCompare(b.name));
  }, [products, query, dept, stock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F4") { e.preventDefault(); setQuickOpen(true); }
      if (e.key === "F9" && lines.length) { e.preventDefault(); setPayOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lines.length]);

  const add = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    // Stock counts can be off (e.g. a delivery not yet entered). Warn, but let the sale happen.
    if (qtyLeft(id) <= 0 && !window.confirm(`The system shows no ${p.name} left in stock. Sell it anyway?`)) return;
    setLines((prev) => {
      const ex = prev.find((l) => l.product_id === id);
      if (ex) return prev.map((l) => (l === ex ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { product_id: id, name: p.name, unit_price: priceOf(id), quantity: 1 }];
    });
  };

  const setQty = (i: number, q: number) => setLines((prev) => (q <= 0 ? prev.filter((_, j) => j !== i) : prev.map((l, j) => (j === i ? { ...l, quantity: q } : l))));
  const setPrice = (i: number, price: number) => setLines((prev) => prev.map((l, j) => (j === i ? { ...l, unit_price: price } : l)));

  const onSearchEnter = () => {
    const code = query.trim();
    const exact = products.find((p) => p.barcode === code || p.id.toLowerCase() === code.toLowerCase());
    const target = exact ?? visible[0];
    if (target) {
      add(target.id);
      setQuery("");
    } else if (code) {
      setQuick({ name: code, price: "", qty: "1" });
      setQuickOpen(true);
    }
  };

  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const raw = toNumber(discountInput);
  const discount = Math.min(subtotal, discountMode === "percent" ? Math.round((subtotal * Math.min(raw, 100)) / 100) : raw);
  const total = subtotal - discount;
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const payments = method === "split"
    ? split.map((x) => ({ method: x.method, amount: toNumber(x.amount) })).filter((x) => x.amount > 0)
    : [{ method, amount: method === "cash" ? toNumber(tendered) : total }];
  const t = computeTotals(lines, discount, payments);
  const canComplete = lines.length > 0 && t.paid >= t.total && !paying;

  const reset = () => {
    setLines([]);
    setDiscountInput("");
    setCustomer({ name: "", phone: "" });
    setTendered("");
    setSplit([{ method: "cash", amount: "" }, { method: "transfer", amount: "" }]);
    setMethod("cash");
  };

  const complete = async () => {
    if (!canComplete) return;
    setPaying(true);
    try {
      const sale = await recordSale({ cashier, lines, discount, payments, customer_name: customer.name, customer_phone: customer.phone });
      setPayOpen(false);
      setCartSheet(false);
      setCompleted(sale);
      reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPaying(false);
    }
  };

  const holdSale = async () => {
    if (!lines.length) return;
    await setMeta("held", [{ id: crypto.randomUUID(), label: customer.name || `Sale ${held.length + 1}`, lines, at: new Date().toISOString() }, ...held]);
    reset();
    toast.success("Sale put on hold");
  };

  const quickCash = [total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  const cart = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-bold">Current sale <span className="text-ink/45">({itemCount})</span></p>
        <div className="flex gap-2">
          <button onClick={() => setHeldOpen(true)} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold"><Clock className="h-3.5 w-3.5" /> Held ({held.length})</button>
          {lines.length > 0 && <button onClick={reset} className="rounded-full px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Clear</button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-ink/45">
            <ShoppingCart className="h-10 w-10" />
            <p className="text-sm">Tap a product, scan a barcode, or use Quick sale for anything not listed.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {lines.map((l, i) => (
              <li key={`${l.product_id ?? "q"}-${i}`} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold leading-tight">{l.name}{!l.product_id && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">QUICK</span>}</p>
                  <button aria-label={`Remove ${l.name}`} onClick={() => setQty(i, 0)} className="text-ink/35 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-full border border-line">
                    <button aria-label="Decrease" onClick={() => setQty(i, l.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-bold">{l.quantity}</span>
                    <button aria-label="Increase" onClick={() => setQty(i, l.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <input aria-label={`Unit price for ${l.name}`} inputMode="numeric" value={l.unit_price.toLocaleString("en-NG")} onChange={(e) => setPrice(i, toNumber(e.target.value))} className="w-24 rounded-lg bg-stone-50 px-2 py-1 text-right text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary" />
                  <span className="w-24 text-right text-sm font-extrabold tabular-nums">{formatPrice(l.unit_price * l.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-3 border-t border-line p-4">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Customer name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
          <input placeholder="Phone" inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink/60">Discount</span>
          <div className="flex rounded-lg bg-stone-100 p-0.5 text-xs font-bold">
            {(["amount", "percent"] as const).map((m) => (
              <button key={m} onClick={() => setDiscountMode(m)} className={`rounded-md px-2.5 py-1 ${discountMode === m ? "bg-white shadow-sm" : "text-ink/50"}`}>{m === "amount" ? "₦" : "%"}</button>
            ))}
          </div>
          <input aria-label="Discount" inputMode="numeric" placeholder="0" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-line px-3 py-1.5 text-right text-sm outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
        </div>
        <div className="rounded-2xl bg-ink p-4 text-white">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between text-white/60"><dt>Subtotal · {itemCount} item{itemCount === 1 ? "" : "s"}</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald-300"><dt>Discount</dt><dd className="tabular-nums">−{formatPrice(discount)}</dd></div>}
            <div className="flex items-baseline justify-between pt-1"><dt className="text-sm font-semibold text-white/80">Total</dt><dd className="font-display text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{formatPrice(total)}</dd></div>
          </dl>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
            <button onClick={holdSale} disabled={!lines.length} className="rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-40">Hold</button>
            <button onClick={() => setPayOpen(true)} disabled={!lines.length} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none">
              Charge <span className="hidden lg:inline"><Kbd dark>F9</Kbd></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-stone-100">
      <header className="flex items-center gap-3 bg-ink px-3 py-2.5 text-white md:px-5">
        <LogoMark className="h-8 w-8" />
        <div className="hidden leading-tight sm:block">
          <p className="text-[15px] font-bold">{device.store_name}</p>
          <p className="text-[11px] text-white/45">Till {device.device_code} · <Clock24 /></p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusPill />
          <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm font-semibold transition hover:bg-white/15">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">{cashier.full_name[0]}</span>
            <span className="hidden sm:inline">{cashier.full_name.split(" ")[0]}</span>
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {!shift && (
        <button onClick={() => setShiftOpen(true)} className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-left text-sm text-amber-900 hover:bg-amber-100">
          <b>Open your shift:</b> count the cash in the drawer so the day's takings add up. Tap here.
        </button>
      )}

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-3 bg-white px-3 py-3 md:px-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40" />
                <input
                  ref={searchRef}
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onSearchEnter(); if (e.key === "Escape") setQuery(""); }}
                  placeholder="Search or scan barcode (F2)"
                  className="w-full rounded-xl border border-line bg-stone-50 py-3 pl-12 pr-10 text-[15px] outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5 focus:bg-white"
                />
                {query && <button aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><X className="h-4 w-4" /></button>}
              </div>
              <button onClick={() => { setQuick({ name: "", price: "", qty: "1" }); setQuickOpen(true); }} className="flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90">
                <Plus className="h-4 w-4" /> Quick sale <span className="hidden lg:inline"><Kbd dark>F4</Kbd></span>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {DEPTS.map((d) => (
                <button key={d} onClick={() => setDept(d)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${dept === d ? "bg-ink text-white shadow-sm" : "bg-stone-100 text-ink/65"}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 pb-24 md:p-5 lg:pb-5">
            {products.length === 0 ? (
              <div className="py-16 text-center text-ink/55">
                <p className="font-bold">No products on this till yet</p>
                <p className="mt-1 text-sm">They download automatically when the till is online. You can still sell with Quick sale.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {visible.map((p) => {
                  const left = qtyLeft(p.id);
                  const inCart = lines.filter((l) => l.product_id === p.id).reduce((s, l) => s + l.quantity, 0);
                  return (
                    <button key={p.id} onClick={() => add(p.id)} className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${inCart > 0 ? "border-primary ring-2 ring-primary/15" : "border-line hover:border-ink/20"}`}>
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        {p.image && <img src={p.image} alt="" loading="lazy" className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${left <= 0 ? "opacity-50 grayscale" : ""}`} />}
                        {left <= 0 && <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-ink/60 backdrop-blur">Not in stock here</span>}
                      </div>
                      {inCart > 0 && <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white shadow-lg shadow-primary/30">{inCart}</span>}
                      <div className="flex flex-1 flex-col p-3">
                        <p className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</p>
                        <p className="mt-0.5 text-[11px] text-ink/45">{[p.condition, p.barcode ?? p.id.toUpperCase()].filter(Boolean).join(" · ")}</p>
                        <div className="mt-auto flex items-end justify-between pt-2">
                          <span className="text-base font-extrabold tabular-nums">{formatPrice(priceOf(p.id))}</span>
                          {left > 0 && <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${left <= 3 ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-ink/55"}`}>{left} left</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {products.length > 0 && visible.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-ink/55">No products match “{query}”.</p>
                <button onClick={() => { setQuick({ name: query, price: "", qty: "1" }); setQuickOpen(true); }} className="mt-3 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">Sell “{query}” as a quick sale</button>
              </div>
            )}
          </div>
        </section>
        <aside className="hidden w-[400px] shrink-0 border-l border-line bg-white lg:block">{cart}</aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 lg:hidden">
        <button onClick={() => setCartSheet(true)} className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-4 text-white">
          <span className="font-bold">View sale ({itemCount})</span>
          <span className="text-lg font-extrabold tabular-nums">{formatPrice(total)}</span>
        </button>
      </div>
      <Sheet open={cartSheet} onOpenChange={setCartSheet}>
        <SheetContent side="bottom" className="h-[90dvh] p-0">
          <SheetHeader className="sr-only"><SheetTitle>Current sale</SheetTitle><SheetDescription>Items in this sale</SheetDescription></SheetHeader>
          {cart}
        </SheetContent>
      </Sheet>

      {/* Quick sale */}
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick sale</DialogTitle>
            <DialogDescription>Sell something that isn't in the system. It's reported to the owner as an unlisted item.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const price = toNumber(quick.price);
              const qty = Math.max(1, Math.floor(toNumber(quick.qty)));
              if (!quick.name.trim() || !price) return;
              setLines((prev) => [...prev, { product_id: null, name: quick.name.trim(), unit_price: price, quantity: qty }]);
              setQuickOpen(false);
              setQuery("");
            }}
          >
            <label className="block text-sm font-semibold">What is it?
              <input autoFocus required value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} placeholder="e.g. Phone pouch" className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
            </label>
            <div className="grid grid-cols-[1fr_90px] gap-2">
              <label className="block text-sm font-semibold">Price (₦)
                <input required inputMode="numeric" value={quick.price} onChange={(e) => setQuick({ ...quick, price: e.target.value })} className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-right font-bold outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
              </label>
              <label className="block text-sm font-semibold">Qty
                <input inputMode="numeric" value={quick.qty} onChange={(e) => setQuick({ ...quick, qty: e.target.value })} className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-right font-bold outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
              </label>
            </div>
            <button className="w-full rounded-xl bg-primary py-3.5 font-bold text-white">Add to sale</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Charge {formatPrice(total)}</DialogTitle>
            <DialogDescription>{itemCount} item(s){discount > 0 ? ` · ${formatPrice(discount)} discount` : ""}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {[...METHODS, { id: "split" as const, label: "Split" }].map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-xl border px-2 py-3 text-sm font-bold ${method === m.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-line"}`}>{m.label}</button>
            ))}
          </div>
          {method === "cash" && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Cash received
                <input autoFocus inputMode="numeric" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder="0" className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-right text-xl font-bold outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
              </label>
              <div className="flex flex-wrap gap-2">
                {quickCash.map((v) => <button key={v} onClick={() => setTendered(String(v))} className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold">{v === total ? "Exact" : formatPrice(v)}</button>)}
              </div>
              <div className={`flex justify-between rounded-xl px-4 py-3 text-lg font-extrabold ${t.paid >= total ? "bg-green-50 text-green-700" : "bg-stone-50 text-ink/50"}`}>
                <span>{t.paid >= total ? "Change" : "Still to pay"}</span>
                <span>{formatPrice(Math.abs(t.paid - total))}</span>
              </div>
            </div>
          )}
          {(method === "transfer" || method === "card") && (
            <p className="rounded-xl bg-stone-50 p-4 text-sm text-ink/65">
              {method === "transfer" ? `Confirm ${formatPrice(total)} has arrived in the store account before completing.` : `Charge ${formatPrice(total)} on the card terminal, then complete once it's approved.`}
            </p>
          )}
          {method === "split" && (
            <div className="space-y-2">
              {split.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <select value={row.method} onChange={(e) => setSplit(split.map((r, j) => (j === i ? { ...r, method: e.target.value as PaymentMethod } : r)))} className="rounded-xl border border-line px-3 text-sm font-semibold">
                    {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <input inputMode="numeric" placeholder="0" value={row.amount} onChange={(e) => setSplit(split.map((r, j) => (j === i ? { ...r, amount: e.target.value } : r)))} className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5 text-right font-bold outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
                </div>
              ))}
              <button onClick={() => setSplit([...split, { method: "card", amount: "" }])} className="text-sm font-semibold text-primary">+ Add another payment</button>
              <p className={`text-sm font-bold ${t.paid >= total ? "text-green-700" : "text-ink/55"}`}>Paid {formatPrice(t.paid)} of {formatPrice(total)}{t.paid < total ? ` · ${formatPrice(total - t.paid)} left` : ""}</p>
            </div>
          )}
          <button onClick={complete} disabled={!canComplete} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-extrabold text-white disabled:opacity-40">
            <Check className="h-5 w-5" /> {paying ? "Saving…" : "Complete sale"}
          </button>
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={!!(completed || reprint)} onOpenChange={(o) => { if (!o) { setCompleted(null); setReprint(null); searchRef.current?.focus(); } }}>
        <DialogContent className="max-h-[92dvh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">{completed ? "Sale complete" : `Receipt ${reprint?.receipt_no}`}</DialogTitle>
            <DialogDescription>{completed ? (completed.change_given > 0 ? `Give change: ${formatPrice(completed.change_given)}` : "Payment received.") : "Reprint for the customer."}</DialogDescription>
          </DialogHeader>
          {(completed || reprint) && <div className="print-area rounded-xl border border-line"><PosReceipt sale={(completed || reprint)!} /></div>}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => window.print()} className="rounded-xl border border-line py-3 text-sm font-bold">Print receipt</button>
            <button onClick={() => { setCompleted(null); setReprint(null); searchRef.current?.focus(); }} className="rounded-xl bg-primary py-3 text-sm font-bold text-white">{completed ? "New sale" : "Close"}</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Held sales */}
      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Held sales</DialogTitle><DialogDescription>Park a sale while a customer decides, then pick it back up.</DialogDescription></DialogHeader>
          {held.length === 0 ? <p className="py-6 text-center text-sm text-ink/50">No sales on hold.</p> : (
            <ul className="divide-y divide-line">
              {held.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-bold">{h.label}</p>
                    <p className="text-xs text-ink/50">{h.lines.reduce((s, l) => s + l.quantity, 0)} items · {formatPrice(h.lines.reduce((s, l) => s + l.unit_price * l.quantity, 0))}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setMeta("held", held.filter((x) => x.id !== h.id))} className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
                    <button
                      onClick={async () => {
                        const rest = held.filter((x) => x.id !== h.id);
                        await setMeta("held", lines.length ? [{ id: crypto.randomUUID(), label: customer.name || "Swapped sale", lines, at: new Date().toISOString() }, ...rest] : rest);
                        setLines(h.lines);
                        setHeldOpen(false);
                      }}
                      className="rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Resume
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-full max-w-xs">
          <SheetHeader><SheetTitle>{cashier.full_name}</SheetTitle><SheetDescription>{device.store_name} · Till {device.device_code} · signed in as {me.username}</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-2">
            {[
              { label: "Today's sales", on: () => setHistoryOpen(true) },
              { label: shift ? "Close shift / count cash" : "Open shift", on: () => setShiftOpen(true) },
              { label: "Sync now", on: () => void syncNow() },
              { label: "Switch cashier (lock)", on: () => void setCashier(null) },
            ].map((x) => (
              <button key={x.label} onClick={() => { setMenuOpen(false); x.on(); }} className="w-full rounded-xl border border-line px-4 py-3 text-left font-semibold hover:border-black/40">{x.label}</button>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink/45">Shortcuts: F2 search · F4 quick sale · F9 charge</p>
        </SheetContent>
      </Sheet>

      {/* Today's sales on this till */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Today on this till</SheetTitle>
            <SheetDescription>{todaysSales.filter((s) => s.status === "completed").length} sales · {formatPrice(todaysSales.filter((s) => s.status === "completed").reduce((t, s) => t + s.total, 0))}</SheetDescription>
          </SheetHeader>
          <ul className="mt-4 divide-y divide-line">
            {todaysSales.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{s.receipt_no} · {formatPrice(s.total)}</p>
                  <p className="truncate text-xs text-ink/50">{new Date(s.created_at).toLocaleTimeString("en-NG", { timeStyle: "short" })} · {s.cashier_name} · {s.lines.map((l) => l.name).join(", ")}</p>
                  {s.sync_error && <p className="text-xs text-red-600">{s.sync_error}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.sync === "synced" ? "bg-green-100 text-green-800" : s.sync === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-900"}`}>{s.sync === "synced" ? "Synced" : s.sync === "failed" ? "Problem" : "Waiting"}</span>
                  <button onClick={() => { setHistoryOpen(false); setReprint(s); }} className="rounded-lg px-2 py-1 text-xs font-bold hover:bg-stone-100">Receipt</button>
                </div>
              </li>
            ))}
          </ul>
          {todaysSales.length === 0 && <p className="py-10 text-center text-sm text-ink/50">No sales yet today.</p>}
          <p className="mt-4 text-xs text-ink/45">Refunds are done by a manager in the admin.</p>
        </SheetContent>
      </Sheet>

      <ShiftDialog open={shiftOpen} onOpenChange={setShiftOpen} shift={shift} cashierId={cashier.id} />
    </div>
  );
};

const ShiftDialog = ({ open, onOpenChange, shift, cashierId }: { open: boolean; onOpenChange: (o: boolean) => void; shift: LocalShift | null; cashierId: string }) => {
  const [amount, setAmount] = useState("");
  const [expected, setExpected] = useState<number | null>(null);
  const [result, setResult] = useState<{ expected: number; difference: number } | null>(null);
  useEffect(() => {
    setAmount("");
    setResult(null);
    if (open && shift) expectedCash(shift).then(setExpected);
  }, [open, shift]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{result ? "Shift closed" : shift ? "Close shift" : "Open shift"}</DialogTitle>
          <DialogDescription>{shift ? "Count all the cash in the drawer." : "How much cash is in the drawer to start (your float)?"}</DialogDescription>
        </DialogHeader>
        {result ? (
          <div className="space-y-3">
            <div className={`rounded-xl p-4 text-center ${Math.abs(result.difference) < 1 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <p className="text-sm">Expected {formatPrice(result.expected)}</p>
              <p className="text-xl font-extrabold">{Math.abs(result.difference) < 1 ? "Cash balances ✓" : result.difference < 0 ? `Short by ${formatPrice(-result.difference)}` : `Over by ${formatPrice(result.difference)}`}</p>
            </div>
            <button onClick={() => onOpenChange(false)} className="w-full rounded-xl bg-primary py-3 font-bold text-white">Done</button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const value = toNumber(amount);
              if (shift) setResult(await closeShift(shift, value));
              else {
                await openShift(cashierId, value);
                onOpenChange(false);
                toast.success("Shift opened");
              }
            }}
          >
            {shift && expected !== null && <p className="text-sm text-ink/60">Count the notes carefully, then enter the total. We'll compare it with the till.</p>}
            <input autoFocus required inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦0" className="w-full rounded-xl border border-line px-4 py-3 text-right text-xl font-bold outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
            <button className="w-full rounded-xl bg-primary py-3.5 font-bold text-white">{shift ? "Close shift" : "Open shift"}</button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PosSell;
