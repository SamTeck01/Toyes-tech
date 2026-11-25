// Sends queued alerts (sales, refunds, low stock, cash shortages, daily summary) to the owner by email
// using Resend (resend.com). Safe to call often: it only processes what is still pending.
// Triggered by tills after they sync, and every minute by pg_cron as a safety net.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  API key from resend.com
//   EMAIL_FROM      optional sender, e.g. "Toyes Tech <alerts@toyestech.com>" (needs that domain verified in Resend).
//                   Without it, Resend's test sender is used, which only delivers to the Resend account's own email.
// Recipients and which alerts to send are set by the owner in the admin (app_settings.email).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "./cors.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("EMAIL_FROM") ?? "Toyes Tech <onboarding@resend.dev>";

type Settings = { enabled: boolean; recipients: string[]; kinds: Record<string, boolean> };
const DEFAULT_KINDS = { sale: true, quick_sale: true, refund: true, low_stock: true, negative_stock: true, shift_short: true, daily_summary: true };

const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

const send = async (to: string[], message: string) => {
  const subject = message.split("\n")[0].replace(/^[^\p{L}\p{N}₦]+/u, "").slice(0, 120) || "Toyes Tech alert";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to, subject, text: message,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">${esc(message).replace(/\n/g, "<br>")}<p style="color:#888;font-size:12px;margin-top:16px">Toyes Tech POS</p></div>`,
    }),
  });
  if (!res.ok) throw new Error(`Email ${res.status}: ${(await res.text()).slice(0, 300)}`);
};

const dailySummary = async () => {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  today.setHours(0, 0, 0, 0);
  const since = new Date(today.getTime() - 60 * 60 * 1000).toISOString(); // Lagos is UTC+1
  const { data: stores } = await db.from("stores").select("id,name").eq("active", true);
  const { data: sales } = await db.from("sales").select("store_id,total,status,payments,change_given").gte("created_at", since);
  const lines = (stores ?? []).map((s) => {
    const mine = (sales ?? []).filter((x) => x.store_id === s.id && x.status === "completed");
    const total = mine.reduce((t, x) => t + Number(x.total), 0);
    return `${s.name}: ${naira(total)} (${mine.length} sales)`;
  });
  const grand = (sales ?? []).filter((x) => x.status === "completed").reduce((t, x) => t + Number(x.total), 0);
  const refunds = (sales ?? []).filter((x) => x.status === "refunded").length;
  await db.from("notifications").insert({
    kind: "daily_summary",
    message: `📊 Today's sales\n${lines.join("\n")}\nTotal: ${naira(grand)}${refunds ? `\nRefunds: ${refunds}` : ""}`,
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Allowed callers: the database scheduler (shared secret from Vault) or a signed-in staff member.
    const cronSecret = req.headers.get("x-cron-secret");
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    const fromCron = cronSecret ? (await db.rpc("check_cron_secret", { p: cronSecret })).data === true : false;
    const fromStaff = !fromCron && jwt ? Boolean((await db.auth.getUser(jwt)).data.user) : false;
    if (!fromCron && !fromStaff) return json({ error: "Not allowed" }, 401);

    const body = await req.json().catch(() => ({}));
    if (body.summary && fromCron) await dailySummary(); // only the scheduler makes the daily summary

    const { data: row } = await db.from("app_settings").select("value").eq("key", "email").maybeSingle();
    const settings: Settings = { enabled: false, recipients: [], kinds: DEFAULT_KINDS, ...(row?.value ?? {}) };
    const configured = Boolean(KEY) && settings.enabled && settings.recipients.length > 0;

    // Anything older than 2 days that never went out is marked skipped so a backlog never floods the owner.
    await db.from("notifications").update({ status: "skipped", error: "Expired before email was set up" })
      .eq("status", "pending").lt("created_at", new Date(Date.now() - 2 * 864e5).toISOString());
    if (!configured) return json({ ok: true, sent: 0, note: "Email isn't connected yet; alerts stay queued for 2 days." });

    const { data: pending } = await db.from("notifications").select("*").eq("status", "pending").order("created_at").limit(40);
    let sent = 0;
    for (const n of pending ?? []) {
      if (settings.kinds[n.kind] === false) {
        await db.from("notifications").update({ status: "skipped" }).eq("id", n.id);
        continue;
      }
      // Claim it first so two runs at once can't send the same alert twice.
      const { data: claimed } = await db.from("notifications").update({ attempts: n.attempts + 1 }).eq("id", n.id).eq("status", "pending").eq("attempts", n.attempts).select("id");
      if (!claimed?.length) continue;
      try {
        await send(settings.recipients, n.message);
        await db.from("notifications").update({ status: "sent", sent_at: new Date().toISOString(), error: null }).eq("id", n.id);
        sent++;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        await db.from("notifications").update({ status: n.attempts + 1 >= 5 ? "failed" : "pending", error }).eq("id", n.id);
      }
    }
    return json({ ok: true, sent });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
