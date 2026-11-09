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
