import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { rpc } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { mapOldPosExport, type ImportRow } from "@/hq/importCsv";
import { btn } from "@/components/hq/kit";

/**
 * Load the product list exported from the old POS into one store.
 * Safe to run again: products already imported keep their stock; only names and prices update.
 */
const ImportProducts = ({ storeId, storeName, onDone }: { storeId: string; storeName: string; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ReturnType<typeof mapOldPosExport> | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ done: number; failed: { name: string; why: string }[] } | null>(null);
  const running = !!progress && progress.done < (data?.rows.length ?? 0);

  const readFile = async (f: File) => {
    setError("");
    setProgress(null);
    try {
      setData(mapOldPosExport(await f.text()));
    } catch (e) {
      setData(null);
      setError((e as Error).message);
    }
  };

  const run = async () => {
    if (!data) return;
    const [{ data: inv }, { data: store }, { data: taken }] = await Promise.all([
      supabase!.from("inventory").select("product_id").eq("store_id", storeId),
      supabase!.from("stores").select("code").eq("id", storeId).single(),
      supabase!.from("products").select("id,store_id").in("id", data.rows.map((r) => r.id)),
    ]);
    const already = new Set((inv ?? []).map((i) => i.product_id as string));
    // A product id belongs to one store. If another branch already uses it, this branch gets its own copy
    // ("<id>-<store code>", the same naming used when products were copied to every branch).
    const ownerOf = new Map((taken ?? []).map((t) => [t.id as string, t.store_id as string | null] as const));
    const code = String(store?.code ?? "").toLowerCase();
    const idFor = (id: string) => (!ownerOf.has(id) || ownerOf.get(id) === storeId ? id : `${id}-${code}`);
    const failed: { name: string; why: string }[] = [];
    let done = 0;
    setProgress({ done, failed });
    const one = async (r: ImportRow) => {
      try {
        const id = idFor(r.id);
        await rpc("save_store_product", { p: { id, store_id: storeId, name: r.name, category: r.category, subcategory: r.type, price: r.price, add_qty: already.has(id) ? 0 : r.qty } });
        if (r.low !== null) await rpc("set_store_price", { p_store: storeId, p_product: id, p_price: r.price, p_low_stock_at: Math.max(0, Math.floor(r.low)) });
      } catch (e) {
        failed.push({ name: r.name, why: (e as Error).message });
      }
      done++;
      setProgress({ done, failed: [...failed] });
    };
    const queue = [...data.rows];
    await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await one(queue.shift()!); }));
    if (failed.length) toast.error(`${failed.length} product(s) didn't import. See the list.`);
    else toast.success(`Imported ${data.rows.length} products into ${storeName}`);
    onDone();
  };

  const totalQty = data?.rows.reduce((t, r) => t + r.qty, 0) ?? 0;

  return (
    <>
      <button onClick={() => { setOpen(true); setData(null); setProgress(null); setError(""); }} className={btn.secondary}>Import from old POS</button>
      <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
        <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import products into {storeName}</DialogTitle>
            <DialogDescription>Choose the inventory CSV exported from the old POS. Names, prices, categories and stock come across.</DialogDescription>
          </DialogHeader>
          {!progress && (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line p-6 text-center hover:border-ink/30">
              <span className="font-bold">{data ? "Choose a different file" : "Choose CSV file"}</span>
              <span className="text-xs text-ink/70">inventory-….csv</span>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
            </label>
          )}
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {data && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-stone-50 p-3"><p className="text-2xl font-extrabold">{data.rows.length}</p><p className="text-xs text-ink/70">products</p></div>
                <div className="rounded-xl bg-stone-50 p-3"><p className="text-2xl font-extrabold">{totalQty.toLocaleString("en-NG")}</p><p className="text-xs text-ink/70">items in stock</p></div>
              </div>
              {data.rows.some((r) => !r.price) && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{data.rows.filter((r) => !r.price).length} product(s) have no price. Cashiers will type the price when selling; add it later under Products.</p>}
              {data.storeColumn && <p className="text-xs text-ink/70">Stock and prices taken from “{data.storeColumn}” in the file.</p>}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-line text-sm">
                {data.rows.slice(0, 50).map((r) => (
                  <div key={r.id} className="flex justify-between gap-2 border-b border-line px-3 py-1.5 last:border-0">
                    <span className="truncate">{r.name} <span className="text-ink/70">· {r.type || r.category}</span></span>
                    <span className="shrink-0 tabular-nums">{r.price ? formatPrice(r.price) : "no price"} · {r.qty}</span>
                  </div>
                ))}
                {data.rows.length > 50 && <p className="px-3 py-1.5 text-xs text-ink/70">…and {data.rows.length - 50} more</p>}
              </div>
              {data.skipped.length > 0 && (
                <p className="text-xs text-ink/70">Left out: {data.skipped.map((s) => `${s.name} (${s.why})`).join(", ")}.</p>
              )}
              {progress ? (
                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / data.rows.length) * 100}%` }} /></div>
                  <p className="text-sm font-semibold">{running ? `Importing ${progress.done} of ${data.rows.length}…` : `Done. ${data.rows.length - progress.failed.length} imported.`}</p>
                  {progress.failed.map((f) => <p key={f.name} className="text-xs text-red-700">{f.name}: {f.why}</p>)}
                  {!running && <button onClick={() => setOpen(false)} className="w-full rounded-xl bg-primary py-3 font-bold text-white">Close</button>}
                </div>
              ) : (
                <button onClick={run} disabled={!data.rows.length} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-40">Import {data.rows.length} products into {storeName}</button>
              )}
              <p className="text-xs text-ink/70">Running it again won't double the stock. It only updates names and prices.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportProducts;
