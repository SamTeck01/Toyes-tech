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

/** Staff sign in with a username; Supabase Auth needs an email, so we map it to an internal address. */
export const staffEmail = (username: string) => `${username.trim().toLowerCase()}@staff.toyestech.app`;
