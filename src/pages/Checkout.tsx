import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, ArrowRight, ShieldCheck, ChevronLeft, ChevronDown, Truck, MapPin, Lock } from "@/components/icons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/format";
import { normalisePhone } from "@/lib/phone";
import { NIGERIAN_STATES, PICKUP_LOCATIONS, FREE_DELIVERY_THRESHOLD, deliveryQuote } from "@/config/store";

type Fulfilment = "delivery" | "pickup";
type Field = "email" | "phone" | "firstName" | "lastName" | "address" | "city" | "state";

const inputCls = (invalid: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] outline-none transition focus:ring-2 ${
    invalid ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-primary focus:ring-primary/15"
  }`;

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [pickupId, setPickupId] = useState(PICKUP_LOCATIONS[0].id);
  const [form, setForm] = useState<Record<Field, string>>({
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    firstName: user?.name.split(" ")[0] ?? "",
    lastName: user?.name.split(" ").slice(1).join(" ") ?? "",
    address: user?.address ?? "",
    city: user?.city ?? "",
    state: user?.state ?? "",
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !orderId) navigate("/cart");
  }, [items, orderId, navigate]);

  const quote = form.state ? deliveryQuote(form.state, totalPrice) : null;
  const deliveryFee = fulfilment === "pickup" ? 0 : quote?.fee ?? 0;
  const grandTotal = totalPrice + deliveryFee;
  const pickup = PICKUP_LOCATIONS.find((l) => l.id === pickupId)!;

  const errors = useMemo(() => {
    const e: Partial<Record<Field, string>> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email so we can send your receipt.";
    if (!normalisePhone(form.phone)) e.phone = "Enter a Nigerian number, e.g. 0803 123 4567.";
    if (!form.firstName.trim()) e.firstName = "Enter your first name.";
    if (!form.lastName.trim()) e.lastName = "Enter your last name.";
    if (fulfilment === "delivery") {
      if (form.address.trim().length < 5) e.address = "Enter your street address.";
      if (!form.city.trim()) e.city = "Enter your city or town.";
      if (!form.state) e.state = "Choose your state.";
    }
    return e;
  }, [form, fulfilment]);

  const show = (f: Field) => (touched[f] || submitted) && errors[f];
  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = (Object.keys(errors) as Field[])[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setIsPaying(true);
    // Simulated Paystack payment — replace with Paystack Inline once live keys are added.
    setTimeout(() => {
      const id = addOrder({
        items: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          price: i.unitPrice || i.product.price,
          quantity: i.quantity,
          image: i.product.image,
          selectedStorage: i.selectedStorage,
        })),
        subtotal: totalPrice,
        deliveryFee,
        total: grandTotal,
        fulfilment,
        customer: {
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
          phone: normalisePhone(form.phone) ?? form.phone,
          address: fulfilment === "pickup" ? `Pickup: ${pickup.name}, ${pickup.address}` : `${form.address}, ${form.city}, ${form.state}`,
        },
      });
      setOrderId(id);
      clearCart();
      setIsPaying(false);
      window.scrollTo(0, 0);
    }, 1800);
  };

  if (orderId) {
    return (
      <div className="min-h-screen bg-white">
        <Helmet><title>Order confirmed | Toyes Tech</title></Helmet>
        <Navbar />
        <main className="container flex justify-center py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold md:text-4xl">Order confirmed</h1>
            <p className="mt-2 text-black/60">Thanks, {form.firstName}. Your order number is <span className="font-bold text-black">#{orderId}</span>.</p>
            <div className="mt-8 rounded-2xl bg-[#F6F6F7] p-5 text-left text-sm">
              {fulfilment === "pickup" ? (
                <p><span className="font-bold">Pick up from {pickup.name}.</span> {pickup.address}. {pickup.hours}. Bring your order number. We'll message you when it's ready.</p>
              ) : (
                <p><span className="font-bold">Delivery to {form.city}, {form.state}</span> in about {quote?.eta}. We'll send updates to {form.email}.</p>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button onClick={() => navigate(`/track/${orderId}`)} className="flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white">
                Track order <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/shop" className="rounded-full border border-gray-200 py-3.5 text-sm font-bold hover:border-black/40">Continue shopping</Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const Summary = (
    <div className="rounded-2xl bg-[#F6F6F7] p-5 md:p-6">
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.cartItemId} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0">
              <img src={i.product.image} alt="" className="h-full w-full rounded-xl object-cover" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-bold text-white">{i.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{i.product.name}</p>
              <p className="text-xs text-black/55">{[i.condition, i.selectedStorage, i.selectedColor].filter(Boolean).join(" · ")}</p>
            </div>
            <p className="text-sm font-bold">{formatPrice(i.unitPrice * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-black/60">Subtotal</dt><dd className="font-semibold">{formatPrice(totalPrice)}</dd></div>
        <div className="flex justify-between">
          <dt className="text-black/60">{fulfilment === "pickup" ? "Store pickup" : "Delivery"}</dt>
          <dd className="font-semibold">
            {fulfilment === "pickup" ? "Free" : !quote ? "Choose your state" : quote.free ? "Free" : formatPrice(quote.fee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-extrabold">{formatPrice(grandTotal)}</dd></div>
      </dl>
      {fulfilment === "delivery" && totalPrice < FREE_DELIVERY_THRESHOLD && (
        <p className="mt-3 text-xs text-black/55">Free delivery on orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}.</p>
      )}
    </div>
  );

  const Err = (f: Field) => (show(f) ? <p id={`e-${f}`} className="mt-1.5 text-xs font-medium text-red-600">{errors[f]}</p> : null);

  const Input = ({ f, label, type = "text", autoComplete, placeholder, className = "" }: { f: Field; label: string; type?: string; autoComplete?: string; placeholder?: string; className?: string }) => (
    <div className={className}>
      <label htmlFor={`f-${f}`} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input
        id={`f-${f}`}
        type={type}
        value={form[f]}
        onChange={set(f)}
        onBlur={blur(f)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={type === "tel" ? "tel" : undefined}
        aria-invalid={!!show(f)}
        aria-describedby={show(f) ? `e-${f}` : undefined}
        className={inputCls(!!show(f))}
      />
      {Err(f)}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Helmet><title>Checkout | Toyes Tech</title></Helmet>
      <Navbar />
      <main className="container pb-24 pt-8 md:pt-10">
        <Link to="/cart" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-black/55 hover:text-black">
          <ChevronLeft className="h-4 w-4" /> Back to cart
        </Link>
        <h1 className="text-3xl font-extrabold md:text-4xl">Checkout</h1>

        {/* Mobile: collapsible summary so the total is always one tap away */}
        <div className="mt-6 lg:hidden">
          <button onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3.5 text-sm font-bold" aria-expanded={summaryOpen}>
            <span>{summaryOpen ? "Hide" : "Show"} order summary ({items.length})</span>
            <span className="flex items-center gap-2">{formatPrice(grandTotal)} <ChevronDown className={`h-4 w-4 transition ${summaryOpen ? "rotate-180" : ""}`} /></span>
          </button>
          {summaryOpen && <div className="mt-3">{Summary}</div>}
        </div>

        <form onSubmit={pay} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
          <div className="space-y-10">
            <section aria-labelledby="s-contact">
              <h2 id="s-contact" className="mb-4 text-lg font-extrabold">1. Contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {Input({ f: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" })}
                {Input({ f: "phone", label: "Phone number", type: "tel", autoComplete: "tel", placeholder: "0803 123 4567" })}
                {Input({ f: "firstName", label: "First name", autoComplete: "given-name" })}
                {Input({ f: "lastName", label: "Last name", autoComplete: "family-name" })}
              </div>
              {!user && (
                <p className="mt-3 text-sm text-black/55">
                  Have an account? <Link to="/account" className="font-semibold text-primary">Sign in</Link> to fill this in automatically.
                </p>
              )}
            </section>

            <section aria-labelledby="s-fulfil">
              <h2 id="s-fulfil" className="mb-4 text-lg font-extrabold">2. Delivery or pickup</h2>
              <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                {([
                  { v: "delivery", icon: Truck, title: "Deliver to me", sub: quote ? (quote.free ? `Free · ${quote.eta}` : `${formatPrice(quote.fee)} · ${quote.eta}`) : "Fee depends on your state" },
                  { v: "pickup", icon: MapPin, title: "Pick up in store", sub: "Free · usually ready same day" },
                ] as const).map((o) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={fulfilment === o.v}
                    key={o.v}
                    onClick={() => setFulfilment(o.v)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${fulfilment === o.v ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-black/30"}`}
                  >
                    <o.icon className={`mt-0.5 h-5 w-5 ${fulfilment === o.v ? "text-primary" : "text-black/50"}`} />
                    <span>
                      <span className="block text-sm font-bold">{o.title}</span>
                      <span className="block text-xs text-black/55">{o.sub}</span>
                    </span>
                  </button>
                ))}
              </div>

              {fulfilment === "delivery" ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {Input({ f: "address", label: "Street address", autoComplete: "street-address", placeholder: "House number and street", className: "sm:col-span-2" })}
                  {Input({ f: "city", label: "City / town", autoComplete: "address-level2" })}
                  <div>
                    <label htmlFor="f-state" className="mb-1.5 block text-sm font-semibold">State</label>
                    <select
                      id="f-state"
                      value={form.state}
                      onChange={set("state")}
                      onBlur={blur("state")}
                      autoComplete="address-level1"
                      aria-invalid={!!show("state")}
                      className={inputCls(!!show("state"))}
                    >
                      <option value="">Choose a state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {Err("state")}
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {PICKUP_LOCATIONS.map((l) => (
                    <label key={l.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${pickupId === l.id ? "border-primary bg-primary/5" : "border-gray-200"}`}>
                      <input type="radio" name="pickup" checked={pickupId === l.id} onChange={() => setPickupId(l.id)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
                      <span>
                        <span className="block text-sm font-bold">{l.name}</span>
                        <span className="block text-xs text-black/55">{l.address} · {l.hours}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="s-pay">
              <h2 id="s-pay" className="mb-4 text-lg font-extrabold">3. Payment</h2>
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="flex items-center gap-2 text-sm font-bold"><Lock className="h-4 w-4 text-primary" /> Pay securely with Paystack</p>
                <p className="mt-1 text-xs text-black/55">Card, bank transfer or USSD. You'll confirm the payment in a secure Paystack window.</p>
              </div>
            </section>

            <div className="lg:hidden">
              <button disabled={isPaying} className="w-full rounded-full bg-primary py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60">
                {isPaying ? "Processing payment…" : `Pay ${formatPrice(grandTotal)}`}
              </button>
              {submitted && Object.keys(errors).length > 0 && <p className="mt-3 text-center text-sm text-red-600">Please fix the highlighted fields.</p>}
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-4">
              <h2 className="text-lg font-extrabold">Order summary</h2>
              {Summary}
              <button disabled={isPaying} className="w-full rounded-full bg-primary py-4 text-base font-bold text-white transition hover:brightness-110 disabled:opacity-60">
                {isPaying ? "Processing payment…" : `Pay ${formatPrice(grandTotal)}`}
              </button>
              {submitted && Object.keys(errors).length > 0 && <p className="text-center text-sm text-red-600">Please fix the highlighted fields.</p>}
              <p className="flex items-center justify-center gap-1.5 text-xs text-black/55"><ShieldCheck className="h-4 w-4" /> Warranty on every device · 7-day returns</p>
            </div>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
