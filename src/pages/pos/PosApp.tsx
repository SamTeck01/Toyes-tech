import { useEffect, useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import { Helmet } from "react-helmet-async";
import { useLiveQuery } from "dexie-react-hooks";
import { isCloudConfigured } from "@/lib/supabase";
import { localDb, type LocalStaff } from "@/pos/localdb";
import { configureServer, getDevice, startSync } from "@/pos/engine";
import { supabaseServer } from "@/pos/supabaseServer";
import { getMe, signIn, listStores, setupTill, setCashier, getCashier, resumeFromSession } from "@/pos/session";
import { supabase } from "@/lib/supabase";
import { setMeta } from "@/pos/localdb";
import PosSell from "./PosSell";
import { LogoMark } from "@/components/Logo";

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <p className="font-display text-6xl font-extrabold tracking-tight tabular-nums">{now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</p>
      <p className="mt-1 text-sm text-ink/70">{now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}</p>
    </div>
  );
};

/** Split screen: a dark brand panel (store, clock, offline promise) beside the task at hand. */
const Shell = ({ children, store }: { children: React.ReactNode; store?: string }) => (
  <div className="grid min-h-[100dvh] bg-stone-100 lg:grid-cols-[minmax(380px,0.9fr)_1.1fr]">
    <Helmet><title>Toyes Tech POS</title></Helmet>
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-white p-10 text-ink lg:flex">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <LogoMark className="h-10 w-10" />
        <div className="leading-tight">
          <p className="text-lg font-extrabold">Toyes<span className="text-primary">Tech</span></p>
          <p className="text-xs text-ink/70">Point of sale{store ? ` · ${store}` : ""}</p>
        </div>
      </div>
      <div className="relative"><LiveClock /></div>
      <ul className="relative space-y-2.5 text-sm text-ink/65">
        <li className="flex items-center gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Keeps selling with no internet</li>
        <li className="flex items-center gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Every sale syncs automatically, once</li>
        <li className="flex items-center gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> The owner is alerted by email</li>
      </ul>
    </aside>
    <main className="flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden"><LogoMark className="h-9 w-9" /><span className="text-lg font-extrabold">Toyes<span className="text-primary">Tech</span> <span className="text-xs font-semibold text-ink/70">POS</span></span></div>
        {children}
      </div>
    </main>
  </div>
);

const inputCls = "w-full rounded-xl border border-line bg-white px-4 py-3.5 text-[15px] outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-4 focus:ring-ink/5";

const SignIn = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell>
      <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-tight">Sign in to the POS</h1>
      <p className="mt-1 text-sm text-ink/70">Same username and password as HQ. You stay signed in on this computer.</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (/\s/.test(form.username.trim())) return setError("Usernames can't have spaces. Remove the space and try again.");
          setBusy(true);
          try {
            await signIn(form.username, form.password);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <input className={inputCls} placeholder="Username or email" autoComplete="username" autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <PasswordInput className={inputCls} placeholder="Password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3.5 font-semibold text-white shadow-[0_1px_2px_rgba(225,20,20,0.3)] transition hover:brightness-110 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </Shell>
  );
};

const ChooseStore = ({ role, storeId }: { role: string; storeId: string | null }) => {
  const [stores, setStores] = useState<{ id: string; code: string; name: string }[] | null>(null);
  const [chosen, setChosen] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const start = async (store: { id: string; code: string; name: string }) => {
    setChosen(store.id);
    setBusy(true);
    setError("");
    try {
      await setupTill(store, "Front counter");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    listStores()
      .then((s) => {
        const visible = role === "super_admin" ? s : s.filter((x) => x.id === storeId);
        setStores(visible);
        if (visible.length === 1) void start(visible[0]);
      })
      .catch((e) => setError((e as Error).message));
  }, [role, storeId]);
  return (
    <Shell>
      <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-tight">Set up this POS</h1>
      <p className="mt-1 text-sm text-ink/70">Tap the store this computer sells for. You only do this once.</p>
      {stores === null && !error && <p className="mt-6 text-sm text-ink/70">Loading stores…</p>}
      {stores?.length === 0 && <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No stores yet. The owner needs to add stores in the admin first.</p>}
      {stores && stores.length > 0 && (
        <div className="mt-6 space-y-3">
          {stores.map((s) => (
            <button key={s.id} disabled={busy} onClick={() => start(s)} className={`flex w-full items-center gap-3 rounded-xl border bg-white p-4 text-left transition hover:border-ink/30 disabled:opacity-60 ${chosen === s.id ? "border-primary bg-primary/5" : "border-line"}`}>
              <span className="font-bold">{s.name}</span>
              <span className="ml-auto text-sm font-semibold text-primary">{busy && chosen === s.id ? "Setting up…" : "Sell here →"}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Shell>
  );
};

const PosApp = () => {
  const me = useLiveQuery(getMe, [], undefined);
  const device = useLiveQuery(getDevice, [], undefined);
  const cashier = useLiveQuery(getCashier, [], undefined);

  useEffect(() => {
    configureServer(supabaseServer);
    startSync();
  }, []);
  // The POS always follows who is signed in on this browser: sign out of HQ and the POS is signed out too;
  // sign in as someone else and the POS sells as them. No PINs.
  const [resuming, setResuming] = useState(true);
  useEffect(() => {
    if (!supabase) return;
    const sync = async () => {
      const { data } = await supabase!.auth.getSession();
      const uid = data.session?.user.id;
      const current = await getMe();
      if (!uid) {
        if (current) { await setMeta("me", null); await setMeta("cashier", null); }
      } else if (!current || current.id !== uid) {
        await resumeFromSession();
      }
      setResuming(false);
    };
    void sync();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event !== "TOKEN_REFRESHED") void sync(); });
    const onFocus = () => void sync();
    window.addEventListener("focus", onFocus);
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("focus", onFocus); };
  }, []);
  useEffect(() => {
    if (me && cashier !== undefined && (!cashier || cashier.id !== me.id)) void setCashier(me);
  }, [me, cashier]);

  if (!isCloudConfigured) {
    return (
      <Shell>
        <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-tight">Almost ready</h1>
        <p className="mt-2 text-sm text-ink/70">The POS isn't connected to the Toyes Tech cloud database yet. Once it's connected, sign in here to set up this POS.</p>
      </Shell>
    );
  }
  if (me === undefined || device === undefined || cashier === undefined) return <div className="min-h-[100dvh] bg-stone-100" />;
  if (!me) return resuming ? <div className="min-h-[100dvh] bg-stone-100" /> : <SignIn />;
  if (!device) return <ChooseStore role={me.role} storeId={me.store_id} />;
  if (!cashier) return <div className="min-h-[100dvh] bg-stone-100" />;
  return <PosSell device={device} cashier={cashier} me={me} />;
};

export default PosApp;
