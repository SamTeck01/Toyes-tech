import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase, staffEmail, isCloudConfigured } from "@/lib/supabase";
import { useHQ, staffAdmin, errMsg } from "@/hq/HQContext";
import { LogoMark } from "@/components/Logo";

const input = "w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

const HQLogin = () => {
  const { me, loading } = useHQ();
  const [mode, setMode] = useState<"signin" | "owner">("signin");
  const [f, setF] = useState({ full_name: "", username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && me) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (/\s/.test(f.username.trim())) return setError("Usernames can't have spaces. Remove the space and try again.");
    if (mode === "owner" && f.password !== f.confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      if (mode === "owner") await staffAdmin({ action: "bootstrap_owner", full_name: f.full_name, username: f.username, password: f.password });
      const { error: err } = await supabase!.auth.signInWithPassword({ email: staffEmail(f.username), password: f.password });
      if (err) throw new Error(/invalid login/i.test(err.message) ? "Wrong username or password." : errMsg(err));
      const { data: u } = await supabase!.auth.getUser();
      const { data: staff } = await supabase!.from("staff").select("role,active").eq("id", u.user!.id).maybeSingle();
      if (!staff || !staff.active) {
        await supabase!.auth.signOut();
        throw new Error("This account doesn't have admin access.");
      }
      if (staff.role === "cashier") {
        await supabase!.auth.signOut();
        throw new Error("Cashiers sell from the POS. Ask a manager for admin access.");
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F4F5] p-4">
      <Helmet><title>Admin sign in | Toyes Tech</title></Helmet>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
        <div className="mb-6 flex items-center gap-2.5"><LogoMark /><span className="text-xl font-extrabold">Toyes<span className="text-primary">Tech</span> <span className="text-sm font-semibold text-black/45">HQ</span></span></div>
        {!isCloudConfigured ? (
          <p className="text-sm text-black/60">The admin isn't connected to the cloud database yet.</p>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">{mode === "signin" ? "Sign in" : "Create the owner account"}</h1>
            <p className="mt-1 text-sm text-black/55">{mode === "signin" ? "For the owner and store managers." : "One time only: this account controls all stores."}</p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "owner" && <input className={input} placeholder="Your full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required />}
              <input className={input} placeholder={mode === "owner" ? "Username (no spaces)" : "Username or email"} autoComplete="username" autoCapitalize="none" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required />
              <input className={input} placeholder="Password" type="password" autoComplete={mode === "owner" ? "new-password" : "current-password"} minLength={mode === "owner" ? 8 : undefined} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
              {mode === "owner" && <input className={input} placeholder="Confirm password" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required />}
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button disabled={busy} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-60">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create owner account"}</button>
            </form>
            <button onClick={() => { setMode(mode === "signin" ? "owner" : "signin"); setError(""); }} className="mt-4 w-full text-center text-sm font-semibold text-black/50 hover:text-black">
              {mode === "signin" ? "First time setting up? Create the owner account" : "Back to sign in"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default HQLogin;
