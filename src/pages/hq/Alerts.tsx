import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { rpc } from "@/hq/HQContext";
import { supabase } from "@/lib/supabase";

const KINDS: [string, string][] = [
  ["sale", "Every sale"],
  ["quick_sale", "Sales with unlisted (quick sale) items"],
  ["refund", "Refunds"],
  ["low_stock", "Low stock"],
  ["negative_stock", "Stock went below zero (needs checking)"],
  ["shift_short", "Cash short at end of shift"],
  ["daily_summary", "End-of-day summary for every store"],
];
type Settings = { enabled: boolean; recipients: string[]; kinds: Record<string, boolean> };
type Note = { id: number; kind: string; message: string; status: string; error: string | null; created_at: string };

const Alerts = () => {
  const [s, setS] = useState<Settings>({ enabled: true, recipients: [], kinds: Object.fromEntries(KINDS.map(([k]) => [k, true])) });
  const [recipients, setRecipients] = useState("");
  const [log, setLog] = useState<Note[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: row }, { data: notes }] = await Promise.all([
      supabase!.from("app_settings").select("value").eq("key", "whatsapp").maybeSingle(),
      supabase!.from("notifications").select("*").order("created_at", { ascending: false }).limit(40),
    ]);
    if (row?.value) {
      const v = { ...s, ...(row.value as Settings) };
      setS(v);
      setRecipients(v.recipients.join("\n"));
    }
    setLog((notes ?? []) as Note[]);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const list = recipients.split(/[\n,]/).map((r) => r.replace(/\D/g, "")).filter(Boolean).map((r) => (r.startsWith("0") ? "234" + r.slice(1) : r));
    if (list.some((r) => !/^234[789][01]\d{8}$/.test(r))) return toast.error("Enter Nigerian WhatsApp numbers, e.g. 0803 123 4567.");
    setBusy(true);
    try {
      await rpc("set_setting", { p_key: "whatsapp", p_value: { ...s, recipients: list } });
      setRecipients(list.join("\n"));
      toast.success("Alert settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    try {
      await rpc("queue_test_alert", {});
      const { data } = await supabase!.functions.invoke("notify", { body: {} });
      toast.message(data?.note ?? (data?.sent ? "Test sent. Check WhatsApp." : "Queued. It will send once WhatsApp is connected."));
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Helmet><title>WhatsApp alerts | Toyes Tech HQ</title></Helmet>
      <div><h1 className="font-display text-[28px] font-extrabold tracking-tight md:text-[32px]">WhatsApp alerts</h1><p className="text-sm text-ink/55">Get a WhatsApp message when something happens in any store. Sales made offline are sent as soon as the till reconnects.</p></div>

      <section className="space-y-4 rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)] p-5">
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="h-4 w-4" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Send WhatsApp alerts</label>
        <label className="block text-sm font-semibold">Send to these WhatsApp numbers (one per line)
          <textarea rows={3} value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="0803 123 4567" className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-ink/40 focus:ring-4 focus:ring-ink/5" />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Alert me about</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {KINDS.map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={s.kinds[k] !== false} onChange={(e) => setS({ ...s, kinds: { ...s.kinds, [k]: e.target.checked } })} /> {label}</label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(225,20,20,0.3)] transition hover:brightness-110 disabled:opacity-50 disabled:opacity-60">Save</button>
          <button onClick={test} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,16,20,0.04)] transition hover:border-ink/25 hover:bg-stone-50 disabled:opacity-40">Send a test message</button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(16,16,20,0.04)] p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent alerts</h2><button onClick={load} className="text-sm font-semibold text-primary">Refresh</button></div>
        {log.length === 0 ? <p className="text-sm text-ink/50">No alerts yet.</p> : (
          <ul className="divide-y divide-line">
            {log.map((n) => (
              <li key={n.id} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink/50">{new Date(n.created_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${n.status === "sent" ? "bg-green-100 text-green-800" : n.status === "failed" ? "bg-red-100 text-red-700" : n.status === "skipped" ? "bg-stone-100 text-ink/55" : "bg-amber-100 text-amber-900"}`}>{n.status}</span>
                </div>
                <p className="mt-1 whitespace-pre-line">{n.message}</p>
                {n.error && <p className="mt-1 text-xs text-red-600">{n.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Alerts;
