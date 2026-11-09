import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHQ, staffAdmin, type Staff as S } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";

const input = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:border-primary";
type Form = { id?: string; full_name: string; username: string; password: string; role: "manager" | "cashier"; store_id: string; pin: string; active: boolean };

const Staff = () => {
  const { me, stores, isOwner } = useHQ();
  const [list, setList] = useState<(S & { pin_hash: string | null })[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase!.from("staff").select("id,full_name,username,role,store_id,active,pin_hash").order("full_name");
    setList((data ?? []) as (S & { pin_hash: string | null })[]);
  };
  useEffect(() => void load(), []);

  const save = async () => {
    if (!form) return;
    if (!form.id && /\s/.test(form.username.trim())) return toast.error("Usernames can't have spaces. Remove the space and try again.");
    setBusy(true);
    try {
      if (form.id) {
        await staffAdmin({ action: "update_staff", id: form.id, full_name: form.full_name, role: form.role, store_id: form.store_id, active: form.active, pin: form.pin || undefined, password: form.password || undefined });
      } else {
        await staffAdmin({ action: "create_staff", ...form });
      }
      toast.success(form.id ? "Staff updated" : `${form.full_name} added. They can now unlock a till with their PIN.`);
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
        <div><h1 className="text-3xl font-extrabold">Staff</h1><p className="text-sm text-black/55">Cashiers unlock a till with their PIN. Managers can also sign in here.</p></div>
        <button onClick={() => setForm({ full_name: "", username: "", password: "", role: "cashier", store_id: visibleStores[0]?.id ?? "", pin: "", active: true })} disabled={!visibleStores.length} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">+ Add staff</button>
      </div>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {list === null ? <p className="p-6 text-sm text-black/50">Loading…</p> : (
          <ul className="divide-y divide-gray-100">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{s.full_name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${s.active ? "" : "text-black/40 line-through"}`}>{s.full_name}</p>
                  <p className="text-xs capitalize text-black/50">{s.role.replace("_", " ")} · {storeName(s.store_id)}{!s.pin_hash && s.role !== "super_admin" ? " · no PIN" : ""}</p>
                </div>
                {s.role !== "super_admin" && (isOwner || s.role === "cashier") && (
                  <button onClick={() => setForm({ id: s.id, full_name: s.full_name, username: s.username, password: "", role: s.role as "manager" | "cashier", store_id: s.store_id ?? "", pin: "", active: s.active })} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-100">Edit</button>
                )}
                {s.role === "super_admin" && s.id === me?.id && (
                  <button onClick={() => setForm({ id: s.id, full_name: s.full_name, username: s.username, password: "", role: "manager", store_id: "", pin: "", active: true })} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-100">Set my PIN</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.id ? `Edit ${form.full_name}` : "Add staff"}</DialogTitle>
            <DialogDescription>{form?.id ? "Leave PIN and password blank to keep them." : "They sign in with this username and password, and use the PIN on the till."}</DialogDescription>
          </DialogHeader>
          {form && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(); }}>
              <label className="block text-sm font-semibold">Full name<input autoFocus required className={`${input} mt-1`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
              {!form.id && <label className="block text-sm font-semibold">Username<input required className={`${input} mt-1`} autoCapitalize="none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. Tolu" /></label>}
              {!(form.id === me?.id) && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-sm font-semibold">Role
                    <select className={`${input} mt-1`} value={form.role} disabled={!isOwner} onChange={(e) => setForm({ ...form, role: e.target.value as Form["role"] })}>
                      <option value="cashier">Cashier</option>{isOwner && <option value="manager">Manager</option>}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">Store
                    <select required className={`${input} mt-1`} value={form.store_id} disabled={!isOwner} onChange={(e) => setForm({ ...form, store_id: e.target.value })}>
                      {visibleStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm font-semibold">Till PIN (4–6 digits)<input inputMode="numeric" maxLength={6} className={`${input} mt-1 tracking-widest`} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} required={!form.id} /></label>
                <label className="block text-sm font-semibold">{form.id ? "New password" : "Password"}<input type="password" minLength={8} autoComplete="new-password" className={`${input} mt-1`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!form.id} placeholder="8+ characters" /></label>
              </div>
              {form.id && form.id !== me?.id && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" /> Active (untick when someone leaves)</label>}
              <p className="text-xs text-black/50">Tills pick up new staff and PIN changes next time they're online.</p>
              <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
