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

/** Staff sign in with their email. (Older accounts created with a username still work.) */
export const staffEmail = (login: string) => {
  const v = login.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@staff.toyestech.app`;
};
