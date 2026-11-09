import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useHQ, rpc } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { uploadProductPhoto } from "@/hq/upload";
import { products as websiteCatalogue, gadgetTypes } from "@/data/products";
import { PageHeader, Pill, EmptyState, btn, field, label } from "@/components/hq/kit";
import { Plus, Minus, Search, Image as ImageIcon, Tag, X, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

interface P {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  condition: string | null;
  base_price: number;
  image: string | null;
  barcode: string | null;
  active: boolean;
  store_id: string | null;
}
type Form = { id?: string; store_id: string | null; name: string; price: string; add_qty: number; category: string; condition: string; brand: string; subcategory: string; barcode: string; image: string; active: boolean };

const SHARED = "__shared__";
const blank = (store: string | null): Form => ({ store_id: store, name: "", price: "", add_qty: 1, category: "Gadgets", condition: "New", brand: "", subcategory: "", barcode: "", image: "", active: true });
const toNumber = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

const Choice = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map((o) => (
      <button
        type="button"
        key={o}
        onClick={() => onChange(o)}
        className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold transition", value === o ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/70 hover:border-ink/30")}
      >
        {o}
      </button>
    ))}
  </div>
);

const Products = () => {
  const { me, stores, isOwner } = useHQ();
  const myStores = isOwner ? stores : stores.filter((s) => s.id === me?.store_id);
  const [view, setView] = useState<string>(""); // store id, or SHARED
  const [list, setList] = useState<P[] | null>(null);
  const [stock, setStock] = useState<Map<string, number>>(new Map());
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [more, setMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!view && myStores[0]) setView(myStores[0].id);
  }, [myStores, view]);

  // Arriving from "Add a product" on the overview opens the form straight away.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (view && params.get("new") === "1") {
      openAdd();
      setParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const load = async () => {
    if (!view) return;
    const base = supabase!.from("products").select("*").order("name");
    const { data } = view === SHARED ? await base.is("store_id", null) : await base.or(`store_id.is.null,store_id.eq.${view}`);
    setList(((data ?? []) as P[]).map((p) => ({ ...p, base_price: Number(p.base_price) })));
    if (view !== SHARED) {
      const { data: inv } = await supabase!.from("inventory").select("product_id,qty").eq("store_id", view);
      setStock(new Map((inv ?? []).map((i) => [i.product_id as string, i.qty as number] as const)));
    } else setStock(new Map());
  };
  useEffect(() => {
    setList(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const shown = useMemo(
    () =>
      (list ?? [])
        .filter((p) => !q || `${p.name} ${p.brand ?? ""} ${p.barcode ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        // This store's own products first, then shared ones.
        .sort((a, b) => Number(a.store_id === null) - Number(b.store_id === null) || a.name.localeCompare(b.name)),
    [list, q],
  );
  const storeName = (id: string | null) => (id ? stores.find((s) => s.id === id)?.name ?? "Store" : "All stores");
  const canEdit = (p: P) => isOwner || (p.store_id !== null && p.store_id === me?.store_id);

  const openAdd = () => {
    setMore(false);
    setForm(blank(view === SHARED ? null : view));
  };
  const openEdit = (p: P) => {
    if (!canEdit(p)) return toast.message("This product is shared by all stores. Only the owner can change it.");
    setMore(Boolean(p.brand || p.barcode || p.subcategory));
    setForm({ id: p.id, store_id: p.store_id, name: p.name, price: String(p.base_price || ""), add_qty: 0, category: p.category, condition: p.condition ?? "New", brand: p.brand ?? "", subcategory: p.subcategory ?? "", barcode: p.barcode ?? "", image: p.image ?? "", active: p.active });
  };

  const onPhoto = async (file?: File) => {
    if (!file || !form) return;
    setUploading(true);
    try {
      const url = await uploadProductPhoto(file, form.store_id);
      setForm((f) => (f ? { ...f, image: url } : f));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Enter the product name.");
    if (!toNumber(form.price)) return toast.error("Enter the selling price.");
    setSaving(true);
    try {
      await rpc("save_store_product", {
        p: { id: form.id ?? "", store_id: form.store_id ?? "", name: form.name, price: toNumber(form.price), add_qty: form.add_qty, category: form.category, condition: form.condition, brand: form.brand, subcategory: form.category === "Gadgets" ? form.subcategory : "", barcode: form.barcode, image: form.image, active: form.active },
      });
      toast.success(form.id ? "Product updated" : `${form.name} added${form.add_qty ? ` with ${form.add_qty} in stock` : ""}`);
      setForm(null);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const importWebsite = async () => {
    if (!window.confirm(`Add the ${websiteCatalogue.length} website products as shared products (available to every store)?`)) return;
    setImporting(true);
    try {
      for (const p of websiteCatalogue) {
        await rpc("save_store_product", { p: { id: p.id, store_id: "", name: p.name, brand: p.brand, category: p.category, subcategory: p.subcategory ?? "", condition: p.condition ?? "", price: p.price, image: p.image, add_qty: 0 } });
      }
      toast.success("Website products added.");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const viewOptions = [...myStores.map((s) => ({ id: s.id, name: s.name })), ...(isOwner ? [{ id: SHARED, name: "Shared (all stores)" }] : [])];

  return (
    <div className="space-y-5">
      <Helmet><title>Products | Toyes Tech HQ</title></Helmet>
      <PageHeader
        title="Products"
        subtitle={isOwner ? "Each store has its own products. Shared products show in every store." : `Products sold at ${storeName(me?.store_id ?? null)}.`}
        actions={
          <>
            {isOwner && view === SHARED && <button disabled={importing} onClick={importWebsite} className={btn.secondary}>{importing ? "Adding…" : "Add website products"}</button>}
            <button onClick={openAdd} disabled={!view} className={btn.primary}><Plus className="h-4 w-4" /> Add product</button>
          </>
        }
      />

      {viewOptions.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {viewOptions.map((o) => (
            <button key={o.id} onClick={() => setView(o.id)} className={cn("shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition", view === o.id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/70 hover:border-ink/30")}>
              {o.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className={cn(field, "pl-11")} />
      </div>

      {list === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white">
          <EmptyState icon={Tag} title={q ? "Nothing matches your search" : "No products here yet"} action={!q && <button onClick={openAdd} className={btn.primary}><Plus className="h-4 w-4" /> Add your first product</button>}>
            {!q && "Add a product with a photo, price and how many you have. It shows on this store's POS straight away."}
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((p) => {
            const qty = view === SHARED ? undefined : stock.get(p.id) ?? 0;
            return (
              <button key={p.id} onClick={() => openEdit(p)} className={cn("group flex flex-col overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:-translate-y-0.5 hover:shadow-md", !p.active && "opacity-50")}>
                <div className="relative aspect-square shrink-0 overflow-hidden bg-stone-100">
                  {p.image ? <img src={p.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink/35"><ImageIcon className="h-7 w-7" /><span className="text-xs font-medium">No photo</span></span>
                  )}
                  {p.store_id === null && view !== SHARED && <span className="absolute left-2 top-2"><Pill tone="info">Shared</Pill></span>}
                  {!p.active && <span className="absolute left-2 top-2"><Pill tone="neutral">Hidden</Pill></span>}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</p>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <span className="font-bold tabular-nums">{formatPrice(p.base_price)}</span>
                    {qty !== undefined && <Pill tone={qty <= 0 ? "bad" : qty <= 2 ? "warn" : "good"}>{qty} in stock</Pill>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-line px-5 py-4 text-left">
            <SheetTitle className="text-lg font-bold">{form?.id ? "Edit product" : "Add product"}</SheetTitle>
            <SheetDescription>{form ? (form.store_id ? `For ${storeName(form.store_id)}` : "Shared by all stores") : ""}</SheetDescription>
          </SheetHeader>
          {form && (
            <form id="product-form" onSubmit={(e) => { e.preventDefault(); void save(); }} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Photo */}
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPhoto(e.target.files?.[0])} />
                {form.image ? (
                  <div className="relative overflow-hidden rounded-2xl border border-line">
                    <img src={form.image} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold shadow">Change photo</button>
                      <button type="button" aria-label="Remove photo" onClick={() => setForm({ ...form, image: "" })} className="rounded-lg bg-white/95 p-1.5 shadow"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); void onPhoto(e.dataTransfer.files?.[0]); }}
                    disabled={uploading}
                    className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-stone-50 text-ink/55 transition hover:border-ink/30 hover:bg-white"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"><ImageIcon className="h-6 w-6" /></span>
                    <span className="text-sm font-semibold text-ink">{uploading ? "Uploading photo…" : "Add a photo"}</span>
                    <span className="text-xs">Take a picture or choose one from your phone or computer</span>
                  </button>
                )}
                {uploading && form.image && <p className="mt-2 text-xs text-ink/55">Uploading photo…</p>}
              </div>

              <label className={label}>Product name
                <input autoFocus={!form.id} className={cn(field, "mt-1.5")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Oraimo FreePods 4" />
              </label>

              <label className={label}>Selling price
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink/45">₦</span>
                  <input inputMode="numeric" className={cn(field, "pl-8 text-lg font-bold tabular-nums")} value={form.price ? Number(toNumber(form.price)).toLocaleString("en-NG") : ""} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
                </div>
              </label>

              {form.store_id && (
                <div>
                  <p className={label}>{form.id ? "Add more stock (optional)" : "How many do you have now?"}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button type="button" aria-label="Fewer" onClick={() => setForm({ ...form, add_qty: Math.max(0, form.add_qty - 1) })} className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white hover:bg-stone-50"><Minus className="h-5 w-5" /></button>
                    <input inputMode="numeric" aria-label="Quantity" value={form.add_qty} onChange={(e) => setForm({ ...form, add_qty: Math.max(0, Math.floor(toNumber(e.target.value))) })} className={cn(field, "h-12 w-24 text-center text-lg font-bold tabular-nums")} />
                    <button type="button" aria-label="More" onClick={() => setForm({ ...form, add_qty: form.add_qty + 1 })} className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white hover:bg-stone-50"><Plus className="h-5 w-5" /></button>
                    {form.id && stock.get(form.id) !== undefined && <span className="text-sm text-ink/55">Now: {stock.get(form.id)}</span>}
                  </div>
                </div>
              )}

              <div>
                <p className={cn(label, "mb-1.5")}>Department</p>
                <Choice options={["Gadgets", "Phones", "Laptops"]} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
              </div>
              <div>
                <p className={cn(label, "mb-1.5")}>Condition</p>
                <Choice options={["New", "UK Used", "Used"]} value={form.condition} onChange={(v) => setForm({ ...form, condition: v })} />
              </div>

              <div className="rounded-2xl border border-line">
                <button type="button" onClick={() => setMore(!more)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold">
                  More details (optional) <ChevronDown className={cn("h-4 w-4 transition", more && "rotate-180")} />
                </button>
                {more && (
                  <div className="space-y-4 border-t border-line px-4 py-4">
                    <label className={label}>Brand<input className={cn(field, "mt-1.5")} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Oraimo" /></label>
                    {form.category === "Gadgets" && (
                      <label className={label}>Gadget type
                        <select className={cn(field, "mt-1.5")} value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}>
                          <option value="">Choose…</option>
                          {gadgetTypes.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                    )}
                    <label className={label}>Barcode<input className={cn(field, "mt-1.5")} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Click here, then scan the box" /></label>
                    {form.id && (
                      <label className="flex items-center gap-2.5 text-sm font-medium">
                        <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                        Show on the POS (untick to hide it)
                      </label>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}
          <div className="border-t border-line p-4">
            <button form="product-form" disabled={saving || uploading} className={cn(btn.primary, "w-full py-3.5 text-base")}>{saving ? "Saving…" : form?.id ? "Save changes" : "Add product"}</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Products;
