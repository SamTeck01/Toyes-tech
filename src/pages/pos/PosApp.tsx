import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLiveQuery } from "dexie-react-hooks";
import { isCloudConfigured } from "@/lib/supabase";
import { localDb, type LocalStaff } from "@/pos/localdb";
import { configureServer, getDevice, startSync, checkPin } from "@/pos/engine";
import { supabaseServer } from "@/pos/supabaseServer";
import { getMe, signIn, listStores, setupTill, setCashier, getCashier, signOutTill } from "@/pos/session";
import PosSell from "./PosSell";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F4F5] p-4">
    <Helmet><title>Toyes Tech POS</title></Helmet>
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
      <p className="mb-6 font-display text-xl font-extrabold">Toyes<span className="text-primary">Tech</span> <span className="text-sm font-semibold text-black/45">POS</span></p>
      {children}
    </div>
  </div>
);

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

const SignIn = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">Sign in to this till</h1>
      <p className="mt-1 text-sm text-black/55">Use the store manager or owner account. You only need to do this once per laptop.</p>
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
        <input className={inputCls} placeholder="Password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </Shell>
  );
};

const ChooseStore = ({ role, storeId }: { role: string; storeId: string | null }) => {
  const [stores, setStores] = useState<{ id: string; code: string; name: string }[] | null>(null);
  const [chosen, setChosen] = useState("");
  const [tillName, setTillName] = useState("Front counter");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listStores()
      .then((s) => {
        const visible = role === "super_admin" ? s : s.filter((x) => x.id === storeId);
        setStores(visible);
        if (visible.length === 1) setChosen(visible[0].id);
      })
      .catch((e) => setError((e as Error).message));
  }, [role, storeId]);
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">Set up this till</h1>
      <p className="mt-1 text-sm text-black/55">Choose which store this laptop sells for. Needs internet this one time.</p>
      {stores === null && !error && <p className="mt-6 text-sm text-black/55">Loading stores…</p>}
      {stores?.length === 0 && <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No stores yet. The owner needs to add stores in the admin first.</p>}
      {stores && stores.length > 0 && (
        <div className="mt-6 space-y-3">
          {stores.map((s) => (
            <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${chosen === s.id ? "border-primary bg-primary/5" : "border-gray-200"}`}>
              <input type="radio" checked={chosen === s.id} onChange={() => setChosen(s.id)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
              <span className="font-bold">{s.name}</span>
              <span className="ml-auto text-xs text-black/45">{s.code}</span>
            </label>
          ))}
          <label className="block text-sm font-semibold">Till name
            <input className={`${inputCls} mt-1.5`} value={tillName} onChange={(e) => setTillName(e.target.value)} />
          </label>
          <button
            disabled={!chosen || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await setupTill(stores.find((s) => s.id === chosen)!, tillName);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Setting up…" : "Start using this till"}
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Shell>
  );
};

/** Cashier picks their name and enters their PIN. Works offline (PINs are checked against cached hashes). */
const Lock = ({ storeId, storeName }: { storeId: string; storeName: string }) => {
  const staff = useLiveQuery(() => localDb.staff.toArray(), []);
  const [who, setWho] = useState<LocalStaff | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState("");
  const people = (staff ?? []).filter((s) => s.store_id === storeId || s.role === "super_admin");

  const tryPin = async (value: string) => {
    if (!who) return;
    if (await checkPin(who, value)) {
      await setCashier(who);
    } else if (value.length === 6) {
      setError("Wrong PIN. Try again.");
      setPin("");
    }
  };

  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">{who ? `Hi ${who.full_name.split(" ")[0]}` : "Who's selling?"}</h1>
      <p className="mt-1 text-sm text-black/55">{storeName}</p>
      {!who ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {people.map((s) => (
              <button key={s.id} onClick={() => { setWho(s); setPin(""); setError(""); }} className="rounded-2xl border border-gray-200 p-4 text-left hover:border-primary">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{s.full_name[0]}</span>
                <span className="mt-2 block font-bold leading-tight">{s.full_name}</span>
                <span className="text-xs capitalize text-black/45">{s.role.replace("_", " ")}{!s.pin_hash ? " · no PIN set" : ""}</span>
              </button>
            ))}
          </div>
          {people.length === 0 && <p className="mt-6 text-sm text-black/55">No staff found for this store yet. Add staff in the admin, then reconnect.</p>}
          <button
            onClick={async () => { try { await signOutTill(); } catch (e) { setSigningOut((e as Error).message); } }}
            className="mt-6 w-full text-sm font-semibold text-black/50 hover:text-black"
          >
            Sign this till out
          </button>
          {signingOut && <p className="mt-2 text-center text-sm text-red-700">{signingOut}</p>}
        </>
      ) : !who.pin_hash ? (
        <div className="mt-6 space-y-3">
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{who.full_name} has no PIN yet. A manager can set one in the admin under Staff.</p>
          <button onClick={() => setWho(null)} className="w-full rounded-xl border border-gray-200 py-3 font-bold">Back</button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-4 flex justify-center gap-3" aria-label={`${pin.length} digits entered`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < pin.length ? "bg-black" : "bg-gray-200"}`} />
            ))}
          </div>
          {error && <p role="alert" className="mb-3 text-center text-sm font-semibold text-red-600">{error}</p>}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((k) => (
              <button
                key={k}
                onClick={async () => {
                  setError("");
                  if (k === "⌫") return setPin((p) => p.slice(0, -1));
                  if (k === "✓") {
                    if (await checkPin(who, pin)) await setCashier(who);
                    else { setError("Wrong PIN. Try again."); setPin(""); }
                    return;
                  }
                  const next = (pin + k).slice(0, 6);
                  setPin(next);
                  if (next.length >= 4) await tryPin(next);
                }}
                className="rounded-2xl bg-gray-100 py-4 text-xl font-bold hover:bg-gray-200 active:scale-95"
              >
                {k}
              </button>
            ))}
          </div>
          <button onClick={() => setWho(null)} className="mt-4 w-full text-sm font-semibold text-black/50">Not you?</button>
        </div>
      )}
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

  if (!isCloudConfigured) {
    return (
      <Shell>
        <h1 className="text-2xl font-extrabold">Almost ready</h1>
        <p className="mt-2 text-sm text-black/60">The POS isn't connected to the Toyes Tech cloud database yet. Once it's connected, sign in here to set up this till.</p>
      </Shell>
    );
  }
  if (me === undefined || device === undefined || cashier === undefined) return <div className="min-h-[100dvh] bg-[#F4F4F5]" />;
  if (!me) return <SignIn />;
  if (!device) return <ChooseStore role={me.role} storeId={me.store_id} />;
  if (!cashier) return <Lock storeId={device.store_id} storeName={device.store_name} />;
  return <PosSell device={device} cashier={cashier} me={me} />;
};

export default PosApp;
