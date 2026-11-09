import { supabase, staffEmail } from "@/lib/supabase";
import { getMeta, setMeta, localDb, type LocalStaff } from "./localdb";
import { setDevice, syncNow, getDevice, configureServer } from "./engine";
import { supabaseServer } from "./supabaseServer";

/** The account signed in on this till (owner or store manager). Cached so the till works offline. */
export type Me = LocalStaff & { store_name?: string | null };

export const getMe = () => getMeta<Me | null>("me", null);

const friendly = (msg: string) =>
  /invalid login credentials/i.test(msg) ? "Wrong username or password."
  : /failed to fetch|network/i.test(msg) ? "No internet. The first sign-in on a till needs internet."
  : msg;

export const signIn = async (username: string, password: string): Promise<Me> => {
  if (!supabase) throw new Error("The POS isn't connected to the cloud yet.");
  const { data, error } = await supabase.auth.signInWithPassword({ email: staffEmail(username), password });
  if (error) throw new Error(friendly(error.message));
  const { data: staff, error: e2 } = await supabase.from("staff").select("id,full_name,username,role,store_id,pin_hash,active").eq("id", data.user.id).single();
  if (e2 || !staff) {
    await supabase.auth.signOut();
    throw new Error("This account isn't set up as staff yet.");
  }
  if (!staff.active) {
    await supabase.auth.signOut();
    throw new Error("This account has been deactivated.");
  }
  const me: Me = staff;
  await setMeta("me", me);
  configureServer(supabaseServer);
  return me;
};

export const listStores = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase.from("stores").select("id,code,name").eq("active", true).order("name");
  if (error) throw new Error(friendly(error.message));
  return data ?? [];
};

/** Link this laptop to a store. Needs internet once; after that the till works offline. */
export const setupTill = async (store: { id: string; code: string; name: string }, tillName: string) => {
  if (!supabase) throw new Error("Not connected.");
  const existing = await getDevice();
  const deviceId = existing?.store_id === store.id ? existing.device_id : crypto.randomUUID();
  const { data, error } = await supabase.rpc("register_device", { p_device_id: deviceId, p_store_id: store.id, p_name: tillName });
  if (error) throw new Error(friendly(error.message));
  await setDevice({ device_id: deviceId, device_code: data.code, store_id: store.id, store_code: store.code, store_name: store.name });
  await setMeta("receipt_seq", existing?.store_id === store.id ? await getMeta("receipt_seq", 0) : 0);
  await syncNow();
};

/** Sign the till out. Refuses while sales are waiting to sync, so nothing can be lost. */
export const signOutTill = async () => {
  const waiting = await localDb.outbox.count();
  if (waiting > 0) throw new Error(`${waiting} sale(s) still waiting to sync. Connect to the internet first.`);
  await supabase?.auth.signOut();
  await setMeta("me", null);
  await setMeta("cashier", null);
};

export const getCashier = () => getMeta<LocalStaff | null>("cashier", null);
export const setCashier = (s: LocalStaff | null) => setMeta("cashier", s);
