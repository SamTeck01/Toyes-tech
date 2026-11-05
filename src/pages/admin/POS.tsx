import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { ArrowLeft, Search, Plus, Minus, Trash2, X, ShoppingCart, Clock, User, Check } from "@/components/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useProducts } from "@/context/ProductContext";
import { useSales, type PaymentMethod, type Sale, type SaleLine } from "@/context/SalesContext";
import { PICKUP_LOCATIONS } from "@/config/store";
import { searchProducts } from "@/lib/search";
import { formatPrice } from "@/lib/format";
import Receipt from "@/components/pos/Receipt";

const DEPTS = ["All", "Gadgets", "Phones", "Laptops"];
const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "transfer", label: "Transfer" },
  { id: "card", label: "Card (POS)" },
];
const SHIFT_KEY = "toyes_pos_shift";

const toNumber = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

const POS = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { recordSale, held, holdCart, removeHeld } = useSales();

  // Shift: which branch and who's on the till. Remembered on this device.
  const [shift, setShift] = useState<{ branch: string; cashier: string }>(() => {
    try {
      return JSON.parse(localStorage.getItem(SHIFT_KEY) || "") as { branch: string; cashier: string };
    } catch {
      return { branch: PICKUP_LOCATIONS[0].name, cashier: "" };
    }
  });
  const [shiftOpen, setShiftOpen] = useState(!shift.cashier);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | "split">("cash");
  const [tendered, setTendered] = useState("");
  const [split, setSplit] = useState<{ method: PaymentMethod; amount: string }[]>([
    { method: "cash", amount: "" },
    { method: "transfer", amount: "" },
  ]);
  const [completed, setCompleted] = useState<Sale | null>(null);
  const [cartSheet, setCartSheet] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localStorage.getItem("toyes_admin_session") !== "active") navigate("/admin/login");
  }, [navigate]);

  // Keyboard shortcuts: F2 search, F9 charge, Esc clears search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F9" && lines.length) { e.preventDefault(); setPayOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lines.length]);

  const visible = useMemo(() => {
    const base = query.trim() ? searchProducts(products, query) : products;
    return base.filter((p) => dept === "All" || p.category === dept);
  }, [products, query, dept]);

  const stockOf = (id: string) => products.find((p) => p.id === id)?.stock ?? 0;
  const qtyInCart = (id: string) => lines.find((l) => l.productId === id)?.quantity ?? 0;

  const add = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (qtyInCart(id) >= p.stock) {
      toast.error(`Only ${p.stock} ${p.name} in stock`);
      return;
    }
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === id);
      if (existing) return prev.map((l) => (l.productId === id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId: p.id, name: p.name, unitPrice: p.price, quantity: 1 }];
    });
  };

  const setQty = (id: string, q: number) => {
    if (q <= 0) return setLines((prev) => prev.filter((l) => l.productId !== id));
    if (q > stockOf(id)) return toast.error(`Only ${stockOf(id)} in stock`);
    setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, quantity: q } : l)));
  };

  const setPrice = (id: string, price: number) =>
    setLines((prev) => prev.map((l) => (l.productId === id ? { ...l, unitPrice: price } : l)));

  // Barcode scanners type the code then press Enter: an exact ID match adds it, otherwise add the top result.
  const onSearchEnter = () => {
    const code = query.trim().toLowerCase();
    const exact = products.find((p) => p.id.toLowerCase() === code);
    const target = exact ?? visible[0];
    if (target) {
      add(target.id);
      setQuery("");
    }
  };

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const rawDiscount = toNumber(discountInput);
  const discount = Math.min(subtotal, discountMode === "percent" ? Math.round((subtotal * Math.min(rawDiscount, 100)) / 100) : rawDiscount);
  const total = subtotal - discount;
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);

  const splitPaid = split.reduce((s, x) => s + toNumber(x.amount), 0);
  const cashGiven = toNumber(tendered);
  const canComplete =
    lines.length > 0 &&
    (method === "split" ? splitPaid >= total : method === "cash" ? cashGiven >= total : true);

  const resetSale = () => {
    setLines([]);
    setDiscountInput("");
    setCustomer({ name: "", phone: "" });
    setTendered("");
    setSplit([{ method: "cash", amount: "" }, { method: "transfer", amount: "" }]);
    setMethod("cash");
  };

  const complete = () => {
    if (!canComplete) return;
    const payments =
      method === "split"
        ? split.filter((x) => toNumber(x.amount) > 0).map((x) => ({ method: x.method, amount: toNumber(x.amount) }))
        : [{ method, amount: method === "cash" ? cashGiven : total }];
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const sale = recordSale({
      branch: shift.branch,
      cashier: shift.cashier || "Staff",
      lines,
      subtotal,
      discount,
      total,
      payments,
      change: Math.max(0, paid - total),
      customer: customer.name || customer.phone ? customer : undefined,
    });
    setPayOpen(false);
    setCartSheet(false);
    setCompleted(sale);
    resetSale();
  };

  const hold = () => {
    if (!lines.length) return;
    holdCart(customer.name || `Sale ${held.length + 1}`, lines);
    resetSale();
    toast.success("Sale put on hold");
  };

  const quickCash = [total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  const cart = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="font-bold">Current sale <span className="text-black/45">({itemCount})</span></p>
        <div className="flex gap-2">
          <button onClick={() => setHeldOpen(true)} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold hover:border-black/40">
            <Clock className="h-3.5 w-3.5" /> Held ({held.length})
          </button>
          {lines.length > 0 && (
            <button onClick={resetSale} className="rounded-full px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Clear</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-black/45">
            <ShoppingCart className="h-10 w-10" />
            <p className="text-sm">Tap a product or scan a barcode to start a sale.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {lines.map((l) => (
              <li key={l.productId} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold leading-tight">{l.name}</p>
                  <button aria-label={`Remove ${l.name}`} onClick={() => setQty(l.productId, 0)} className="text-black/35 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-full border border-gray-200">
                    <button aria-label="Decrease" onClick={() => setQty(l.productId, l.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-bold">{l.quantity}</span>
                    <button aria-label="Increase" onClick={() => setQty(l.productId, l.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <label className="flex items-center gap-1 text-xs text-black/50">
                    @
                    <input
                      aria-label={`Unit price for ${l.name}`}
                      inputMode="numeric"
                      value={l.unitPrice.toLocaleString("en-NG")}
                      onChange={(e) => setPrice(l.productId, toNumber(e.target.value))}
                      className="w-24 rounded-lg border border-transparent bg-gray-50 px-2 py-1 text-right text-sm font-semibold text-black focus:border-primary focus:outline-none"
                    />
                  </label>
                  <span className="w-24 text-right text-sm font-extrabold">{formatPrice(l.unitPrice * l.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-gray-100 p-4">
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Customer name (optional)" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          <input placeholder="Phone (optional)" inputMode="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-black/60">Discount</span>
          <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-bold">
            {(["amount", "percent"] as const).map((m) => (
              <button key={m} onClick={() => setDiscountMode(m)} className={`rounded-md px-2.5 py-1 ${discountMode === m ? "bg-white shadow-sm" : "text-black/50"}`}>{m === "amount" ? "₦" : "%"}</button>
            ))}
          </div>
          <input aria-label="Discount" inputMode="numeric" placeholder="0" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm outline-none focus:border-primary" />
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-black/60">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>-{formatPrice(discount)}</dd></div>}
          <div className="flex justify-between text-xl font-extrabold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <button onClick={hold} disabled={!lines.length} className="rounded-xl border border-gray-200 px-4 py-4 text-sm font-bold disabled:opacity-40">Hold</button>
          <button onClick={() => setPayOpen(true)} disabled={!lines.length} className="rounded-xl bg-primary py-4 text-base font-extrabold text-white transition hover:brightness-110 disabled:opacity-40">
            Charge {formatPrice(total)} <span className="ml-1 hidden text-xs font-semibold opacity-70 lg:inline">F9</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-[#F4F4F5]">
      <Helmet><title>Point of Sale | Toyes Tech</title></Helmet>

      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2.5 md:px-5">
        <Link to="/admin/dashboard" aria-label="Back to admin" className="rounded-full p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <p className="font-display text-lg font-extrabold">Toyes<span className="text-primary">Tech</span> <span className="text-sm font-semibold text-black/45">POS</span></p>
        <button onClick={() => setShiftOpen(true)} className="ml-auto flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold md:text-sm">
          <User className="h-4 w-4" />
          <span className="max-w-[160px] truncate">{shift.cashier || "Set cashier"} · {shift.branch}</span>
        </button>
        <Link to="/admin/sales" className="hidden rounded-full border border-gray-200 px-4 py-1.5 text-sm font-bold hover:border-black/40 sm:block">Sales</Link>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Products */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-3 bg-white px-3 py-3 md:px-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" />
              <input
                ref={searchRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearchEnter(); if (e.key === "Escape") setQuery(""); }}
                placeholder="Search or scan barcode (F2)"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-10 text-[15px] outline-none focus:border-primary focus:bg-white"
              />
              {query && <button aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {DEPTS.map((d) => (
                <button key={d} onClick={() => setDept(d)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${dept === d ? "bg-black text-white" : "bg-gray-100 text-black/65"}`}>{d}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 pb-24 md:p-5 lg:pb-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {visible.map((p) => {
                const left = p.stock - qtyInCart(p.id);
                const out = left <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => add(p.id)}
                    disabled={out}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:ring-primary disabled:opacity-45"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    {qtyInCart(p.id) > 0 && (
                      <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white">{qtyInCart(p.id)}</span>
                    )}
                    <div className="flex flex-1 flex-col p-3">
                      <p className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</p>
                      <p className="mt-0.5 text-[11px] text-black/45">{p.condition} · {p.id.toUpperCase()}</p>
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <span className="text-base font-extrabold">{formatPrice(p.price)}</span>
                        <span className={`text-[11px] font-semibold ${out ? "text-red-600" : left <= 3 ? "text-amber-600" : "text-black/45"}`}>
                          {out ? "Out of stock" : `${left} left`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {visible.length === 0 && <p className="py-16 text-center text-black/50">No products match “{query}”.</p>}
          </div>
        </section>

        {/* Cart (desktop/tablet) */}
        <aside className="hidden w-[400px] shrink-0 border-l border-gray-200 bg-white lg:block">{cart}</aside>
      </div>

      {/* Cart bar (phones / small tablets) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 lg:hidden">
        <button onClick={() => setCartSheet(true)} className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-4 text-white">
          <span className="font-bold">View sale ({itemCount})</span>
          <span className="text-lg font-extrabold">{formatPrice(total)}</span>
        </button>
      </div>
      <Sheet open={cartSheet} onOpenChange={setCartSheet}>
        <SheetContent side="bottom" className="h-[90dvh] p-0">
          <SheetHeader className="sr-only"><SheetTitle>Current sale</SheetTitle><SheetDescription>Items in this sale</SheetDescription></SheetHeader>
          {cart}
        </SheetContent>
      </Sheet>

      {/* Payment */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Charge {formatPrice(total)}</DialogTitle>
            <DialogDescription>{itemCount} item(s){discount > 0 ? ` · ${formatPrice(discount)} discount` : ""}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {[...METHODS, { id: "split" as const, label: "Split" }].map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-xl border px-2 py-3 text-sm font-bold ${method === m.id ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-gray-200"}`}>{m.label}</button>
            ))}
          </div>

          {method === "cash" && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Cash received
                <input autoFocus inputMode="numeric" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder="0" className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-right text-xl font-bold outline-none focus:border-primary" />
              </label>
              <div className="flex flex-wrap gap-2">
                {quickCash.map((v) => (
                  <button key={v} onClick={() => setTendered(String(v))} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold hover:bg-gray-200">{v === total ? "Exact" : formatPrice(v)}</button>
                ))}
              </div>
              <div className={`flex justify-between rounded-xl px-4 py-3 text-lg font-extrabold ${cashGiven >= total ? "bg-green-50 text-green-700" : "bg-gray-50 text-black/50"}`}>
                <span>{cashGiven >= total ? "Change" : "Still to pay"}</span>
                <span>{formatPrice(Math.abs(cashGiven - total))}</span>
              </div>
            </div>
          )}

          {(method === "transfer" || method === "card") && (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-black/65">
              {method === "transfer"
                ? `Confirm ${formatPrice(total)} has arrived in the store account before completing.`
                : `Charge ${formatPrice(total)} on the card terminal, then complete once it's approved.`}
            </p>
          )}

          {method === "split" && (
            <div className="space-y-2">
              {split.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <select value={row.method} onChange={(e) => setSplit(split.map((r, j) => (j === i ? { ...r, method: e.target.value as PaymentMethod } : r)))} className="rounded-xl border border-gray-200 px-3 text-sm font-semibold">
                    {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <input inputMode="numeric" placeholder="0" value={row.amount} onChange={(e) => setSplit(split.map((r, j) => (j === i ? { ...r, amount: e.target.value } : r)))} className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-right font-bold outline-none focus:border-primary" />
                </div>
              ))}
              <button onClick={() => setSplit([...split, { method: "card", amount: "" }])} className="text-sm font-semibold text-primary">+ Add another payment</button>
              <p className={`text-sm font-bold ${splitPaid >= total ? "text-green-700" : "text-black/55"}`}>
                Paid {formatPrice(splitPaid)} of {formatPrice(total)}{splitPaid < total ? ` · ${formatPrice(total - splitPaid)} left` : ""}
              </p>
            </div>
          )}

          <button onClick={complete} disabled={!canComplete} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-extrabold text-white disabled:opacity-40">
            <Check className="h-5 w-5" /> Complete sale
          </button>
        </DialogContent>
      </Dialog>

      {/* Sale complete + receipt */}
      <Dialog open={!!completed} onOpenChange={(o) => { if (!o) { setCompleted(null); searchRef.current?.focus(); } }}>
        <DialogContent className="max-h-[92dvh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Sale complete</DialogTitle>
            <DialogDescription>
              {completed && completed.change > 0 ? `Give change: ${formatPrice(completed.change)}` : "Payment received."}
            </DialogDescription>
          </DialogHeader>
          {completed && <div className="print-area rounded-xl border border-gray-200"><Receipt sale={completed} /></div>}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => window.print()} className="rounded-xl border border-gray-200 py-3 text-sm font-bold hover:border-black/40">Print receipt</button>
            <button onClick={() => { setCompleted(null); searchRef.current?.focus(); }} className="rounded-xl bg-primary py-3 text-sm font-bold text-white">New sale</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Held sales */}
      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Held sales</DialogTitle>
            <DialogDescription>Park a sale while a customer decides, then pick it back up.</DialogDescription>
          </DialogHeader>
          {held.length === 0 ? (
            <p className="py-6 text-center text-sm text-black/50">No sales on hold.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {held.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-bold">{h.label}</p>
                    <p className="text-xs text-black/50">
                      {h.lines.reduce((s, l) => s + l.quantity, 0)} items · {formatPrice(h.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0))} · {new Date(h.heldAt).toLocaleTimeString("en-NG", { timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => removeHeld(h.id)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
                    <button
                      onClick={() => {
                        if (lines.length) holdCart(customer.name || "Swapped sale", lines);
                        setLines(h.lines);
                        removeHeld(h.id);
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

      {/* Shift */}
      <Dialog open={shiftOpen} onOpenChange={(o) => { if (shift.cashier) setShiftOpen(o); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Start your shift</DialogTitle>
            <DialogDescription>Sales and receipts will show your name and branch.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const next = { cashier: String(data.get("cashier") || "").trim(), branch: String(data.get("branch")) };
              if (!next.cashier) return;
              setShift(next);
              localStorage.setItem(SHIFT_KEY, JSON.stringify(next));
              setShiftOpen(false);
            }}
            className="space-y-3"
          >
            <label className="block text-sm font-semibold">Your name
              <input name="cashier" required defaultValue={shift.cashier} autoFocus className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary" />
            </label>
            <label className="block text-sm font-semibold">Branch
              <select name="branch" defaultValue={shift.branch} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3">
                {PICKUP_LOCATIONS.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </label>
            <button className="w-full rounded-xl bg-primary py-3.5 font-bold text-white">Start selling</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
