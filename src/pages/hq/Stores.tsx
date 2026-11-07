import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHQ, rpc, type Store } from "@/hq/HQContext";

const input = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 outline-none focus:border-primary";

const Stores = () => {
  const { stores, reloadStores } = useHQ();
  const [editing, setEditing] = useState<Partial<Store> | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await rpc("upsert_store", { p_id: editing.id ?? null, p_code: (editing.code ?? "").toUpperCase(), p_name: editing.name, p_address: editing.address ?? null, p_phone: editing.phone ?? null, p_active: editing.active ?? true });
      toast.success("Store saved");
      setEditing(null);
      await reloadStores();
    } catch (e) {
      const m = (e as Error).message;
      toast.error(/code|check/i.test(m) ? "Store code must be 2–6 capital letters or numbers, and unique." : m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Helmet><title>Stores | Toyes Tech HQ</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold">Stores</h1><p className="text-sm text-black/55">Each store has its own stock, staff and tills.</p></div>
        <button onClick={() => setEditing({ active: true })} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">+ Add store</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-2">
              <div><p className="text-lg font-extrabold">{s.name}</p><p className="text-xs text-black/45">Code {s.code}{!s.active && " · closed"}</p></div>
              <button onClick={() => setEditing(s)} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-gray-100">Edit</button>
            </div>
            {s.address && <p className="mt-2 text-sm text-black/60">{s.address}</p>}
            {s.phone && <p className="text-sm text-black/60">{s.phone}</p>}
          </div>
        ))}
        {stores.length === 0 && <p className="text-sm text-black/55">No stores yet.</p>}
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit store" : "Add store"}</DialogTitle><DialogDescription>The code appears on receipts, e.g. CMP-T1-000123.</DialogDescription></DialogHeader>
          {editing && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(); }}>
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <label className="block text-sm font-semibold">Store name<input autoFocus required className={`${input} mt-1`} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Campus store" /></label>
                <label className="block text-sm font-semibold">Code<input required maxLength={6} className={`${input} mt-1 uppercase`} value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="CMP" /></label>
              </div>
              <label className="block text-sm font-semibold">Address<input className={`${input} mt-1`} value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></label>
              <label className="block text-sm font-semibold">Phone<input className={`${input} mt-1`} value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label>
              {editing.id && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4" /> Store is open</label>}
              <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save store"}</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stores;
