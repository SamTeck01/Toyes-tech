import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once the Supabase project's URL and public key are set in the environment. */
export const isCloudConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "toyes-pos-auth" },
    })
  : null;

/** Usernames have no rules: case, spaces and symbols are ignored when matching ("Tolu Ade" = "toluade"). */
export const usernameKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Sign in with a username or an email. Supabase Auth needs an email, so usernames map to an internal one. */
export const staffEmail = (login: string) => {
  const v = login.trim().toLowerCase();
  return v.includes("@") ? v : `${usernameKey(v)}@staff.toyestech.app`;
};

/**
 * Sign a staff member in with their username or their own email. The check happens on the server
 * (so no one can look up emails from usernames) and locks a login for 15 minutes after 20 wrong passwords.
 */
export const signInStaff = async (login: string, password: string) => {
  if (!supabase) throw new Error("Not connected to the cloud yet.");
  const { data, error } = await supabase.functions.invoke("login", { body: { login: login.trim(), password } });
  if (error) {
    let msg = "Couldn't sign in. Check your internet and try again.";
    try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg; } catch { /* keep default */ }
    throw new Error(msg);
  }
  const { error: e2 } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (e2) throw new Error(e2.message);
  const { data: u } = await supabase.auth.getUser();
  return u.user!;
};
