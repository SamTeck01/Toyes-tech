import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthError, NetworkError, RejectedError, type PosServer } from "./engine";
import type { LocalInventory, LocalProduct, LocalStaff } from "./localdb";

/** Turn a Supabase error into the engine's three kinds: retry later, sign in again, or rejected. */
export const classify = (error: Pick<PostgrestError, "code" | "message"> & { status?: number }) => {
  const msg = error.message || "Unknown error";
  if (typeof navigator !== "undefined" && !navigator.onLine) return new NetworkError(msg);
  if (/failed to fetch|network|load failed|timeout|fetch failed/i.test(msg) || (!error.code && !error.status)) return new NetworkError(msg);
  if (error.code?.startsWith("PGRST3") || error.status === 401 || /jwt|not signed in/i.test(msg)) return new AuthError(msg);
  if (error.status && error.status >= 500) return new NetworkError(msg); // server hiccup: retry later
  return new RejectedError(msg);
};

const needClient = () => {
  if (!supabase) throw new NetworkError("Cloud is not configured");
  return supabase;
};

const call = async (fn: string, args: Record<string, unknown>) => {
  const sb = needClient();
  const { data: session } = await sb.auth.getSession();
  if (!session.session) throw new AuthError("Not signed in");
  const { error, status } = await sb.rpc(fn, args);
  if (error) throw classify({ ...error, status });
};

export const supabaseServer: PosServer = {
  submitSale: (p) => call("submit_sale", { p }),
  saveShift: (p) => call("save_shift", { p }),
  async pull(storeId) {
    const sb = needClient();
    const [products, inventory, staff] = await Promise.all([
      // This store's own products plus shared ones (the owner can see every store's, so filter explicitly).
      sb.from("products").select("id,name,brand,category,subcategory,condition,base_price,image,barcode").eq("active", true).or(`store_id.is.null,store_id.eq.${storeId}`),
      sb.from("inventory").select("product_id,qty,price,low_stock_at").eq("store_id", storeId),
      sb.from("staff").select("id,full_name,username,role,store_id,pin_hash").eq("active", true).or(`store_id.eq.${storeId},role.eq.super_admin`),
    ]);
    // If the per-store products update isn't on the server yet, fall back to loading products without the store filter.
    if (products.error && /store_id/i.test(products.error.message)) {
      const legacy = await sb.from("products").select("id,name,brand,category,subcategory,condition,base_price,image,barcode").eq("active", true);
      Object.assign(products, legacy);
    }
    for (const r of [products, inventory, staff]) if (r.error) throw classify({ ...r.error, status: r.status });
    return {
      products: (products.data ?? []).map((p) => ({ ...p, base_price: Number(p.base_price) })) as LocalProduct[],
      inventory: (inventory.data ?? []).map((i) => ({ ...i, price: i.price == null ? null : Number(i.price) })) as LocalInventory[],
      staff: (staff.data ?? []) as LocalStaff[],
    };
  },
  async notify() {
    const sb = needClient();
    await sb.functions.invoke("notify", { body: {} });
  },
};
