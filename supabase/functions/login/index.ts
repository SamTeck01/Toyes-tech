// Staff sign-in by username OR their own email. The browser never learns anyone's email from a username,
// and wrong passwords lock that login for 15 minutes after 20 tries.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "./cors.ts";

const URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const MAX_FAILS = 20;
const LOCK_MINUTES = 15;
const keyOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const WRONG = "Wrong username or password.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { login, password } = await req.json().catch(() => ({}));
    const raw = String(login ?? "").trim().toLowerCase();
    if (!raw || !password) return json({ error: "Enter your username or email and password." }, 400);
    if (/\s/.test(raw)) return json({ error: "Usernames and emails can't have spaces." }, 400);

    // Find the account: by email if it looks like one, otherwise by username.
    const isEmail = raw.includes("@");
    const { data: staff } = isEmail
      ? await admin.from("staff").select("id,username,active").eq("email", raw).maybeSingle()
      : await admin.from("staff").select("id,username,active").eq("username", keyOf(raw)).maybeSingle();
    // Lock per account AND network, so someone elsewhere can't lock a staff member out of the shop.
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const lockKey = `${staff?.id ?? (isEmail ? raw : keyOf(raw))}|${ip}`;

    const { data: attempt } = await admin.from("login_attempts").select("*").eq("login", lockKey).maybeSingle();
    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(attempt.locked_until).getTime() - Date.now()) / 60000);
      return json({ error: `Too many wrong tries. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or ask the owner to reset your password.` }, 429);
    }

    let session = null;
    if (staff?.active) {
      const { data: u } = await admin.auth.admin.getUserById(staff.id);
      const email = u.user?.email;
      if (email) {
        const anon = createClient(URL, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
        const { data } = await anon.auth.signInWithPassword({ email, password });
        session = data.session;
      }
    } else if (!staff && !isEmail) {
      // Unknown username: do the same work as a real sign-in so timing doesn't reveal which usernames exist.
      const anon = createClient(URL, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
      await anon.auth.signInWithPassword({ email: `${keyOf(raw) || "x"}@staff.toyestech.app`, password });
    } else if (!staff && isEmail) {
      // The owner account created before staff emails existed signs in with its own auth email.
      const anon = createClient(URL, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
      const { data } = await anon.auth.signInWithPassword({ email: raw, password });
      session = data.session;
    }

    if (!session) {
      const fails = (attempt?.fails ?? 0) + 1;
      const locked = fails >= MAX_FAILS;
      await admin.from("login_attempts").upsert({
        login: lockKey, fails: locked ? 0 : fails, updated_at: new Date().toISOString(),
        locked_until: locked ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null,
      });
      return json({ error: locked ? `Too many wrong tries. Try again in ${LOCK_MINUTES} minutes.` : WRONG }, 401);
    }
    if (attempt) await admin.from("login_attempts").delete().eq("login", lockKey);
    return json({ access_token: session.access_token, refresh_token: session.refresh_token });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
