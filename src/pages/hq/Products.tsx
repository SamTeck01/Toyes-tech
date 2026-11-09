import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { rpc } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { products as websiteCatalogue } from "@/data/products";

interface P { id: string; name: string; brand: string | null; category: string; subcategory: string | null; condition: string | null; base_price: number; image: string | null; barcode: string | null; active: boolean }
const blank: P = { id: "", name: "", brand: "", category: "Gadgets", subcategory: "", condition: "New", base_price: 0, image: "", barcode: "", active: true };
const input = "w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const Products = () => {
  const [list, setList] = useState<P[] | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<P | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase!.from("products").select("*").order("name");
    setList((data ?? []).map((p) => ({ ...p, base_price: Number(p.base_price) })) as P[]);
  };
  useEffect(() => void load(), []);

  const save = async (p: P) => {
    if (!p.name.trim()) return toast.error("Enter a product name.");
    setBusy(true);
    try {
      const id = p.id || `${slug(p.name)}-${Math.random().toString(36).slice(2, 6)}`;
      await rpc("upsert_product", { p: { ...p, id, barcode: p.barcode || null, image: p.image || null } });
      toast.success("Product saved");
      setEditing(null);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const importWebsite = async () => {
    if (!window.confirm(`Add the ${websiteCatalogue.length} products from the website to the POS catalogue? Existing ones are updated.`)) return;
    setBusy(true);
    try {
      for (const p of websiteCatalogue) {
        await rpc("upsert_product", { p: { id: p.id, name: p.name, brand: p.brand, category: p.category, subcategory: p.subcategory ?? null, condition: p.condition ?? null, base_price: p.price, image: p.image, active: true } });
      }
      toast.success("Website products imported. Add stock per store under Inventory.");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shown = (list ?? []).filter((p) => !q || `${p.name} ${p.brand} ${p.barcode} ${p.id}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <Helmet><title>Products | Toyes Tech HQ</title></Helmet>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-[28px] font-extrabold tracking-tight md:text-[32px]">Products</h1><p className="text-sm text-ink/55">One catalogue for all stores. Stock and store prices are set under Inventory.</p></div>
        <div className="flex gap-2">
          <button disabled={busy} onClick={importWebsite} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:border-ink/25 hover:bg-stone-50 disabled:opacity-40 disabled:opacity-50">Import website products</button>
          <button onClick={() => setEditing({ ...blank })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(225,20,20,0.3)] transition hover:brightness-110 disabled:opacity-50">+ Add product</button>
        </div>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full rounded-full bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-black/10 focus:ring-primary" />
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
        {list === null ? <p className="p-6 text-sm text-ink/50">Loading…</p> : shown.length === 0 ? (
          <div className="p-10 text-center"><p className="font-bold">No products yet</p><p className="mt-1 text-sm text-ink/55">Import the website's products or add your own.</p></div>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-semibold ${p.active ? "" : "text-ink/40 line-through"}`}>{p.name}</p>
                  <p className="text-xs text-ink/45">{[p.brand, p.category, p.subcategory, p.condition, p.barcode && `Barcode ${p.barcode}`].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="font-bold tabular-nums">{formatPrice(p.base_price)}</span>
                <button onClick={() => setEditing(p)} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-stone-100">Edit</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit product" : "Add product"}</DialogTitle><DialogDescription>Shared by all stores.</DialogDescription></DialogHeader>
          {editing && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void save(editing); }}>
              <label className="block text-sm font-semibold">Name<input autoFocus required className={`${input} mt-1`} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm font-semibold">Brand<input className={`${input} mt-1`} value={editing.brand ?? ""} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></label>
                <label className="block text-sm font-semibold">Default price (₦)<input inputMode="numeric" className={`${input} mt-1`} value={editing.base_price || ""} onChange={(e) => setEditing({ ...editing, base_price: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></label>
                <label className="block text-sm font-semibold">Department
                  <select className={`${input} mt-1`} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{["Gadgets", "Phones", "Laptops"].map((c) => <option key={c}>{c}</option>)}</select>
                </label>
                <label className="block text-sm font-semibold">Condition
                  <select className={`${input} mt-1`} value={editing.condition ?? ""} onChange={(e) => setEditing({ ...editing, condition: e.target.value })}>{["New", "UK Used", "Used"].map((c) => <option key={c}>{c}</option>)}</select>
                </label>
              </div>
              <label className="block text-sm font-semibold">Type (for gadgets, e.g. Audio)<input className={`${input} mt-1`} value={editing.subcategory ?? ""} onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })} /></label>
              <label className="block text-sm font-semibold">Barcode (scan it into this box)<input className={`${input} mt-1`} value={editing.barcode ?? ""} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} /></label>
              <label className="block text-sm font-semibold">Photo link<input className={`${input} mt-1`} value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://…" /></label>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4" /> On sale (untick to hide from tills)</label>
              <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save product"}</button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
