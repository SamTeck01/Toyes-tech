import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import PasswordInput from "@/components/PasswordInput";
import { field, label as labelCls } from "@/components/hq/kit";
import { cn } from "@/lib/utils";
import { useHQ, staffAdmin, type Staff as S } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";

const input = field;
/** A readable random password: no look-alike letters, 10 characters. */
const makePassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const a = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(a, (n) => chars[n % chars.length]).join("");
};
const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-2xl border border-line bg-white p-4">
    <div><h3 className="text-sm font-bold">{title}</h3>{hint && <p className="mt-0.5 text-xs text-ink/50">{hint}</p>}</div>
    {children}
  </section>
);
type Form = { id?: string; full_name: string; username: string; email: string; password: string; role: "manager" | "cashier"; store_id: string; pin: string; active: boolean };

const Staff = () => {
  const { me, stores, isOwner } = useHQ();
  const [list, setList] = useState<(S & { pin_hash: string | null })[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: rows }, { data: emails }] = await Promise.all([
      supabase!.from("staff").select("id,full_name,username,role,store_id,active,pin_hash").order("full_name"),
      supabase!.rpc("staff_emails"),
    ]);
    const emailOf = new Map(((emails ?? []) as { id: string; email: string | null }[]).map((e) => [e.id, e.email] as const));
    const data = (rows ?? []).map((r) => ({ ...r, email: emailOf.get(r.id) ?? null }));
    setList((data ?? []) as (S & { pin_hash: string | null })[]);
  };
  useEffect(() => void load(), []);

  // Arriving from "Add staff" on the overview opens the form straight away.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const mine = isOwner ? stores : stores.filter((st) => st.id === me?.store_id);
    if (params.get("new") === "1" && mine.length) {
      setForm({ full_name: "", username: "", email: "", password: "", role: "cashier", store_id: mine[0].id, pin: "", active: true });
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores.length]);

  const save = async () => {
    if (!form) return;
    if ((!form.id && /\s/.test(form.username.trim())) || /\s/.test(form.email.trim())) return toast.error("Usernames and emails can't have spaces. Remove the space and try again.");
    setBusy(true);
    try {
      if (form.id) {
        await staffAdmin({ action: "update_staff", id: form.id, full_name: form.full_name, email: form.email.trim(), role: form.role, store_id: form.store_id, active: form.active, pin: form.pin || undefined, password: form.password || undefined });
      } else {
        await staffAdmin({ action: "create_staff", ...form });
      }
      toast.success(form.id ? "Staff updated" : `${form.full_name} added. They sign in with their username or email.`);
      setForm(null);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const storeName = (id: string | null) => stores.find((s) => s.id === id)?.name ?? "All stores";
  const visibleStores = isOwner ? stores : stores.filter((s) => s.id === me?.store_id);

  return (
    <div className="space-y-5">
      <Helmet><title>Staff | Toyes Tech HQ</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-[28px] font-extrabold tracking-tight md:text-[32px]">Staff</h1><p className="text-sm text-ink/55">Everyone signs in with their own username (or email) and password. Cashiers use the POS only; managers can also use HQ.</p></div>
        <button onClick={() => setForm({ full_name: "", username: "", email: "", password: "", role: "cashier", store_id: visibleStores[0]?.id ?? "", pin: "", active: true })} disabled={!visibleStores.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(225,20,20,0.3)] transition hover:brightness-110 disabled:opacity-50 disabled:opacity-40">+ Add staff</button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
        {list === null ? <p className="p-6 text-sm text-ink/50">Loading…</p> : (
          <ul className="divide-y divide-line">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{s.full_name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${s.active ? "" : "text-ink/40 line-through"}`}>{s.full_name}</p>
                  <p className="text-xs text-ink/50"><span className="capitalize">{s.role.replace("_", " ")}</span> · {storeName(s.store_id)} · @{s.username}{(s as S & { email?: string | null }).email ? ` · ${(s as S & { email?: string | null }).email}` : ""}</p>
                </div>
                {s.role !== "super_admin" && (isOwner || s.role === "cashier") && (
                  <button onClick={() => setForm({ id: s.id, full_name: s.full_name, username: s.username, email: (s as S & { email?: string | null }).email ?? "", password: "", role: s.role as "manager" | "cashier", store_id: s.store_id ?? "", pin: "", active: s.active })} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-stone-100">Edit</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-stone-50 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-line bg-white px-5 py-4 text-left">
            <SheetTitle className="font-display text-xl font-extrabold">{form?.id ? `Edit ${form.full_name}` : "Add staff"}</SheetTitle>
            <SheetDescription>{form?.id ? "Change only what you need. Leave the password empty to keep it." : "Create their account in two short steps."}</SheetDescription>
          </SheetHeader>
          {form && (
            <form className="space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); void save(); }}>
              <Section title="1. Who are they?">
                <label className={labelCls}>Full name<input autoFocus required className={`${input} mt-1.5`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Tolu Ade" /></label>
                {!(form.id === me?.id) && (
                  <>
                    <div>
                      <p className={labelCls}>Role</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-2">
                        {(["cashier", "manager"] as const).filter((r) => r === "cashier" || isOwner).map((r) => (
                          <button key={r} type="button" onClick={() => setForm({ ...form, role: r })} className={cn("rounded-xl border p-3 text-left transition", form.role === r ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/30")}>
                            <span className="block text-sm font-bold capitalize">{r}</span>
                            <span className={cn("block text-xs", form.role === r ? "text-white/70" : "text-ink/50")}>{r === "cashier" ? "Sells on the POS only" : "POS + HQ for their store"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className={labelCls}>Store
                      <select required className={`${input} mt-1.5`} value={form.store_id} disabled={!isOwner} onChange={(e) => setForm({ ...form, store_id: e.target.value })}>
                        {visibleStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </label>
                  </>
                )}
              </Section>

              <Section title="2. How they sign in" hint="They can type their username or their email, with the password.">
                {!form.id
                  ? <label className={labelCls}>Username<input required className={`${input} mt-1.5`} autoCapitalize="none" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. tolu (no spaces)" /></label>
                  : <p className="text-sm">Username: <b>@{form.username}</b></p>}
                <label className={labelCls}>Email <span className="font-normal text-ink/45">· optional</span><input type="email" autoCapitalize="none" autoComplete="off" className={`${input} mt-1.5`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. tolu@gmail.com" /></label>
                <div>
                  <div className="flex items-end justify-between">
                    <span className={labelCls}>{form.id ? "New password" : "Password"} <span className="font-normal text-ink/45">· 8+ characters</span></span>
                    <button type="button" onClick={() => setForm({ ...form, password: makePassword() })} className="text-xs font-bold text-primary hover:underline">Generate one</button>
                  </div>
                  <div className="mt-1.5"><PasswordInput minLength={8} autoComplete="new-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!form.id} placeholder={form.id ? "Leave empty to keep it" : "Type or generate a password"} /></div>
                </div>
              </Section>


              {form.id && form.id !== me?.id && (
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
                  <span><span className="block text-sm font-bold">Active</span><span className="block text-xs text-ink/50">Switch off when someone leaves. They're signed out at once.</span></span>
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-[hsl(var(--primary))]" />
                </label>
              )}
              {!form.id && form.password && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Write down or send them the password now. For security it can't be shown again later (you can always set a new one).</p>
              )}
              <div className="sticky bottom-0 -mx-5 border-t border-line bg-stone-50/95 px-5 py-4 backdrop-blur">
                <button disabled={busy} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-60">{busy ? "Saving…" : form.id ? "Save changes" : "Create account"}</button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Staff;
