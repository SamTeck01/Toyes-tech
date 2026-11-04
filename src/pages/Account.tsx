import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LogOut, Package, Heart, MapPin, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const AuthForms = () => {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") await signIn(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(mode === "signin" ? "Welcome back!" : "Account created. Welcome to Toyes Tech!");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-extrabold tracking-tight">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-2 text-sm text-black/60">
        {mode === "signin" ? "Track orders, save your address and check out faster." : "It takes less than a minute."}
      </p>
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold">
        {(["signin", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); }}
            className={`rounded-lg py-2 transition ${mode === m ? "bg-white shadow-sm" : "text-black/50"}`}
          >
            {m === "signin" ? "Sign in" : "Register"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "register" && (
          <label className="block text-sm font-medium">Full name
            <input required className={`${inputCls} mt-1.5`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </label>
        )}
        <label className="block text-sm font-medium">Email
          <input required type="email" className={`${inputCls} mt-1.5`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">Password
          <input required type="password" minLength={6} className={`${inputCls} mt-1.5`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
};

const Dashboard = () => {
  const { user, updateProfile, signOut } = useAuth();
  const { orders } = useOrders();
  const { wishlistItems } = useWishlist();
  const [profile, setProfile] = useState({
    name: user!.name, phone: user!.phone ?? "", address: user!.address ?? "", city: user!.city ?? "", state: user!.state ?? "",
  });
  const myOrders = orders.filter((o) => o.customer.email.toLowerCase() === user!.email);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-black/50">My account</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Hello, {user!.name.split(" ")[0]}</h1>
        </div>
        <button onClick={() => { signOut(); toast("Signed out"); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <section className="lg:col-span-2 rounded-2xl border border-gray-100 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Package className="h-5 w-5 text-primary" /> Recent orders</h2>
          <Link to="/orders" className="text-sm font-semibold text-primary">View all</Link>
        </div>
        {myOrders.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <p className="text-sm text-black/60">You haven't placed any orders yet.</p>
            <Link to="/shop" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Start shopping</Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myOrders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link to={`/track/${o.id}`} className="flex items-center justify-between gap-4 py-3 hover:opacity-80">
                  <div>
                    <p className="text-sm font-bold">#{o.id}</p>
                    <p className="text-xs text-black/50">{new Date(o.date).toLocaleDateString()} · {o.items.length} item(s)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{o.status}</span>
                    <span className="text-sm font-bold">{formatPrice(o.total)}</span>
                    <ChevronRight className="h-4 w-4 text-black/50" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/wishlist" className="rounded-2xl border border-gray-100 p-6 transition hover:border-primary/40">
        <Heart className="h-6 w-6 text-primary" />
        <p className="mt-4 text-3xl font-extrabold">{wishlistItems.length}</p>
        <p className="text-sm text-black/60">Saved items in your wishlist</p>
      </Link>

      <form
        className="lg:col-span-3 rounded-2xl border border-gray-100 p-6"
        onSubmit={(e) => { e.preventDefault(); updateProfile(profile); toast.success("Profile saved"); }}
      >
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-primary" /> Delivery details</h2>
        <p className="mb-5 text-sm text-black/50">Saved details are filled in automatically at checkout.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["name", "Full name"], ["phone", "Phone number"], ["address", "Street address"], ["city", "City"], ["state", "State"],
          ] as const).map(([k, label]) => (
            <label key={k} className={`block text-sm font-medium ${k === "address" ? "sm:col-span-2" : ""}`}>{label}
              <input className={`${inputCls} mt-1.5`} value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <button className="mt-5 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">Save details</button>
      </form>
    </div>
  );
};

const Account = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Helmet><title>My Account | Toyes Tech</title></Helmet>
      <Navbar />
      <main className="container py-12 md:py-16">{user ? <Dashboard /> : <AuthForms />}</main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Account;
