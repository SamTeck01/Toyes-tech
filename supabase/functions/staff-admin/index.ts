// Creates and manages staff accounts. Needs the service role (server-only), so it lives here,
// never in the browser. Every action re-checks the caller's role from the database.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "./cors.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

// Usernames: no spaces allowed; capitals and symbols are ignored when matching ("Tolu-Ade" = "toluade").
const keyOf = (name: string) => String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Every account has a username. The person's own email is optional; when given, it is the account's sign-in
 * email (so they can log in with it too). Without one, an internal address is used that nobody ever sees or types.
 */
const loginFor = (body: { username?: string; email?: string }) => {
  const rawUser = String(body.username ?? "").trim();
  const rawEmail = String(body.email ?? "").trim().toLowerCase();
  if (/\s/.test(rawUser) || /\s/.test(rawEmail)) return null;
  const username = keyOf(rawUser.includes("@") ? rawUser.split("@")[0] : rawUser);
  if (!username) return null;
  if (rawEmail && !EMAIL.test(rawEmail)) return null;
  const realEmail = rawEmail || (rawUser.includes("@") && EMAIL.test(rawUser.toLowerCase()) ? rawUser.toLowerCase() : "");
  return { username, realEmail: realEmail || null, authEmail: realEmail || `${username}@staff.toyestech.app` };
};

const usernameTaken = async (username: string, exceptId?: string) => {
  const { data } = await admin.from("staff").select("id").eq("username", username);
  return (data ?? []).some((r) => r.id !== exceptId);
};

const hashPin = async (pin: string, id: string) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${pin}:${id}`));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const fail = (message: string, status = 400) => json({ error: message }, status);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const action = body.action as string;

    // One-time: create the owner's account. Only works while no super admin exists.
    if (action === "bootstrap_owner") {
      const { count } = await admin.from("staff").select("id", { count: "exact", head: true }).eq("role", "super_admin");
      if ((count ?? 0) > 0) return fail("The owner account already exists.", 409);
      const login = loginFor(body);
      if (!login) return fail("Enter a username with no spaces (and a valid email, if you add one).");
      if (String(body.password ?? "").length < 8) return fail("Password must be at least 8 characters.");
      const { authEmail, realEmail, username } = login;
      const { data, error } = await admin.auth.admin.createUser({ email: authEmail, password: body.password, email_confirm: true });
      if (error) return fail(error.message);
      const { error: e2 } = await admin.from("staff").insert({ id: data.user.id, full_name: body.full_name, username, email: realEmail, role: "super_admin" });
      if (e2) {
        await admin.auth.admin.deleteUser(data.user.id);
        return fail(e2.message);
      }
      return json({ ok: true });
    }

    // Everything else needs a signed-in owner or manager.
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: who } = await admin.auth.getUser(jwt ?? "");
    if (!who.user) return fail("Please sign in again.", 401);
    const { data: me } = await admin.from("staff").select("*").eq("id", who.user.id).eq("active", true).single();
    if (!me || me.role === "cashier") return fail("Only the owner or a manager can manage staff.", 403);
    const isOwner = me.role === "super_admin";

    if (action === "create_staff") {
      const login = loginFor(body);
      const role = body.role as string;
      const storeId = isOwner ? body.store_id : me.store_id;
      if (!login) return fail("Enter a username with no spaces (and a valid email, if you add one).");
      const { authEmail, realEmail, username } = login;
      if (await usernameTaken(username)) return fail("That username is already used. Try adding a number.");
      if (!["manager", "cashier"].includes(role)) return fail("Choose manager or cashier.");
      if (!isOwner && role !== "cashier") return fail("Managers can only add cashiers.", 403);
      if (!storeId) return fail("Choose a store.");
      if (String(body.password ?? "").length < 8) return fail("Password must be at least 8 characters.");
      if (body.pin && !/^\d{4,6}$/.test(body.pin)) return fail("PIN must be 4 to 6 digits.");
      const { data, error } = await admin.auth.admin.createUser({ email: authEmail, password: body.password, email_confirm: true });
      if (error) return fail(/already/i.test(error.message) ? "That email is already used by another account." : error.message);
      const pin_hash = body.pin ? await hashPin(body.pin, data.user.id) : null;
      const { error: e2 } = await admin.from("staff").insert({ id: data.user.id, full_name: body.full_name, username, email: realEmail, role, store_id: storeId, pin_hash });
      if (e2) {
        await admin.auth.admin.deleteUser(data.user.id);
        return fail(e2.message);
      }
      await admin.from("audit_log").insert({ staff_id: me.id, store_id: storeId, action: "create_staff", details: { username, role } });
      return json({ ok: true, id: data.user.id });
    }

    if (action === "update_staff") {
      const { data: target } = await admin.from("staff").select("*").eq("id", body.id).single();
      if (!target) return fail("Staff member not found.", 404);
      if (target.role === "super_admin" && target.id !== me.id) return fail("The owner account can't be changed here.", 403);
      if (!isOwner && (target.store_id !== me.store_id || target.role !== "cashier")) return fail("Managers can only manage their own cashiers.", 403);
      const patch: Record<string, unknown> = {};
      if (typeof body.active === "boolean") patch.active = body.active;
      if (typeof body.full_name === "string" && body.full_name.trim()) patch.full_name = body.full_name.trim();
      if (isOwner && ["manager", "cashier"].includes(body.role) && target.role !== "super_admin") patch.role = body.role;
      if (isOwner && body.store_id && target.role !== "super_admin") patch.store_id = body.store_id;
      if (body.pin) {
        if (!/^\d{4,6}$/.test(body.pin)) return fail("PIN must be 4 to 6 digits.");
        patch.pin_hash = await hashPin(body.pin, target.id);
      }
      if (typeof body.email === "string" && body.email.trim().toLowerCase() !== (target.email ?? "")) {
        const e = body.email.trim().toLowerCase();
        if (e && !EMAIL.test(e)) return fail("That email doesn't look right.");
        const { error } = await admin.auth.admin.updateUserById(target.id, { email: e || `${target.username}@staff.toyestech.app`, email_confirm: true });
        if (error) return fail(/already/i.test(error.message) ? "That email is already used by another account." : error.message);
        patch.email = e || null;
      }
      if (body.password) {
        if (String(body.password).length < 8) return fail("Password must be at least 8 characters.");
        const { error } = await admin.auth.admin.updateUserById(target.id, { password: body.password });
        if (error) return fail(error.message);
      }
      if (Object.keys(patch).length) {
        const { error } = await admin.from("staff").update(patch).eq("id", target.id);
        if (error) return fail(error.message);
      }
      if (patch.active === false) await admin.auth.admin.signOut(target.id).catch(() => undefined);
      await admin.from("audit_log").insert({
        staff_id: me.id, store_id: target.store_id, action: "update_staff",
        details: { id: target.id, ...patch, pin_hash: patch.pin_hash ? "changed" : undefined, password: body.password ? "changed" : undefined },
      });
      return json({ ok: true });
    }

    return fail("Unknown action.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unexpected error", 500);
  }
});
