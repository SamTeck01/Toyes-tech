import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "super_admin" | "manager" | "cashier";
export interface Staff { id: string; full_name: string; username: string; role: Role; store_id: string | null; active: boolean; pin_hash?: string | null }
export interface Store { id: string; code: string; name: string; address: string | null; phone: string | null; active: boolean }

interface HQ {
  loading: boolean;
  me: Staff | null;
  stores: Store[];
  isOwner: boolean;
  canManage: boolean;
  reloadStores: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<HQ | null>(null);

/** Plain-English messages for errors raised by the database functions. */
export const errMsg = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/failed to fetch|network/i.test(m)) return "No internet connection. Try again when you're back online.";
  if (/jwt|not signed in/i.test(m)) return "Your session expired. Please sign in again.";
  return m;
};

/** Call a database function and throw a readable error on failure. */
export const rpc = async <T = unknown,>(fn: string, args: Record<string, unknown>) => {
  const { data, error } = await supabase!.rpc(fn, args);
  if (error) throw new Error(errMsg(error));
  return data as T;
};

/** Call the staff-admin edge function. */
export const staffAdmin = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase!.functions.invoke("staff-admin", { body });
  if (error) {
    const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(detail?.error ?? errMsg(error));
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

export const HQProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Staff | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  const reloadStores = useCallback(async () => {
    const { data } = await supabase!.from("stores").select("*").order("name");
    setStores((data ?? []) as Store[]);
  }, []);

  const load = useCallback(async () => {
    if (!supabase) return setLoading(false);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setMe(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("staff").select("id,full_name,username,role,store_id,active").eq("id", s.session.user.id).maybeSingle();
    // HQ is for the owner and managers only. Cashiers work on the till.
    const allowed = data && data.active && data.role !== "cashier";
    setMe(allowed ? (data as Staff) : null);
    if (allowed) await reloadStores();
    setLoading(false);
  }, [reloadStores]);

  useEffect(() => {
    void load();
    const { data: sub } = supabase?.auth.onAuthStateChange(() => void load()) ?? { data: null };
    return () => sub?.subscription.unsubscribe();
  }, [load]);

  const value: HQ = {
    loading,
    me,
    stores,
    isOwner: me?.role === "super_admin",
    canManage: me?.role === "super_admin" || me?.role === "manager",
    reloadStores,
    signOut: async () => {
      await supabase?.auth.signOut();
      setMe(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useHQ = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useHQ must be used inside HQProvider");
  return c;
};
