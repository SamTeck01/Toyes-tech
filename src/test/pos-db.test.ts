// @vitest-environment node
/**
 * Runs the real POS migration on an in-memory Postgres (PGlite) and checks every money path:
 * sales, idempotent retries, server-side totals, permissions, refunds, stock and alerts.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const MIGRATIONS = join(__dirname, "../../supabase/migrations");
let db: PGlite;

const CEO = "00000000-0000-0000-0000-00000000000a";
const MGR_A = "00000000-0000-0000-0000-00000000000b";
const CASH_A = "00000000-0000-0000-0000-00000000000c";
const CASH_B = "00000000-0000-0000-0000-00000000000d";
let storeA = "";
let storeB = "";

/** Run SQL as a signed-in user, like a request through Supabase's API would. */
const as = async <T = Record<string, unknown>>(uid: string | null, sql: string, params: unknown[] = []) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  await db.exec(uid ? "set role authenticated" : "set role anon");
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
};

const sale = (over: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  receipt_no: `A-T1-${Math.floor(Math.random() * 1e6)}`,
  store_id: storeA,
  cashier_id: CASH_A,
  created_at: new Date().toISOString(),
  offline: false,
  discount: 0,
  lines: [{ product_id: "g3", name: "JBL Flip 6", unit_price: 135000, quantity: 1 }],
  payments: [{ method: "cash", amount: 135000 }],
  ...over,
});

beforeAll(async () => {
  db = await PGlite.create({ extensions: { pgcrypto } });
  // Minimal stand-ins for what Supabase provides.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant usage on schema public to anon, authenticated;
  `);
  for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
  }
  await db.exec(`insert into auth.users values ('${CEO}'), ('${MGR_A}'), ('${CASH_A}'), ('${CASH_B}');`);
  await db.exec(`insert into public.products (id, name, base_price) values ('g3', 'JBL Flip 6', 135000), ('p1', 'iPhone 15 Pro Max', 1550000);`);
});

describe("accounts and stores", () => {
  it("lets the first user become super admin, and only once", async () => {
    const [ceo] = await as<{ role: string }>(CEO, "select * from public.claim_super_admin('Mr CEO', 'ceo')");
    expect(ceo.role).toBe("super_admin");
    await expect(as(MGR_A, "select public.claim_super_admin('Imposter', 'x')")).rejects.toThrow(/already exists/);
  });

  it("only the owner can create stores", async () => {
    await expect(as(MGR_A, "select public.upsert_store(null, 'CMP', 'Campus', null, null)")).rejects.toThrow(/Only the owner/);
    [{ id: storeA }] = await as<{ id: string }>(CEO, "select (public.upsert_store(null, 'CMP', 'Campus store', 'Campus', null)).id");
    [{ id: storeB }] = await as<{ id: string }>(CEO, "select (public.upsert_store(null, 'CTY', 'City branch', 'City', null)).id");
    await db.exec(`
      insert into public.staff (id, full_name, username, role, store_id) values
        ('${MGR_A}', 'Manager A', 'mgra', 'manager', '${storeA}'),
        ('${CASH_A}', 'Tolu', 'tolu', 'cashier', '${storeA}'),
        ('${CASH_B}', 'Bayo', 'bayo', 'cashier', '${storeB}');
    `);
  });

  it("gives each store its own inventory", async () => {
    await as(MGR_A, "select public.adjust_stock($1, 'g3', 5, 'receive', 'delivery')", [storeA]);
    await as(CEO, "select public.adjust_stock($1, 'g3', 9, 'receive')", [storeB]);
    const a = await as<{ qty: number }>(CASH_A, "select qty from public.inventory where product_id = 'g3'");
    expect(a).toEqual([{ qty: 5 }]); // cashier A sees only store A
    await expect(as(MGR_A, "select public.adjust_stock($1, 'g3', 1, 'receive')", [storeB])).rejects.toThrow(/manager or the owner/);
  });
});

describe("sales", () => {
  it("records a sale, takes it off stock and queues a WhatsApp alert", async () => {
    const s = sale();
    const [{ r }] = await as<{ r: { status: string; total: number } }>(CASH_A, "select public.submit_sale($1) as r", [s]);
    expect(r.status).toBe("created");
    const [{ qty }] = await as<{ qty: number }>(CEO, "select qty from public.inventory where store_id = $1 and product_id = 'g3'", [storeA]);
    expect(qty).toBe(4);
    const notes = await as<{ kind: string; message: string }>(CEO, "select kind, message from public.notifications where ref_id = $1", [s.id]);
    expect(notes.find((n) => n.kind === "sale")?.message).toContain("Campus store");
    expect(notes.find((n) => n.kind === "sale")?.message).toContain("135,000");
  });

  it("never duplicates a sale that is sent twice (sync retry)", async () => {
    const s = sale();
    await as(CASH_A, "select public.submit_sale($1)", [s]);
    const [{ r }] = await as<{ r: { status: string } }>(CASH_A, "select public.submit_sale($1) as r", [s]);
    expect(r.status).toBe("duplicate");
    const [{ n }] = await as<{ n: number }>(CEO, "select count(*)::int as n from public.sales where id = $1", [s.id]);
    expect(n).toBe(1);
  });

  it("recomputes money on the server and rejects underpayment", async () => {
    const tampered = sale({ subtotal: 1, total: 1, payments: [{ method: "cash", amount: 1000 }] });
    await expect(as(CASH_A, "select public.submit_sale($1)", [tampered])).rejects.toThrow(/less than total/);
    await expect(as(CASH_A, "select public.submit_sale($1)", [sale({ discount: 999999999 })])).rejects.toThrow(/Invalid discount/);
  });

  it("works out change from what the customer paid", async () => {
    const [{ r }] = await as<{ r: { change: number } }>(CASH_A, "select public.submit_sale($1) as r", [
      sale({ payments: [{ method: "cash", amount: 140000 }] }),
    ]);
    expect(Number(r.change)).toBe(5000);
  });

  it("stops a cashier selling for another store", async () => {
    await expect(as(CASH_B, "select public.submit_sale($1)", [sale({ cashier_id: CASH_B })])).rejects.toThrow(/No access/);
  });

  it("accepts quick-sale items that are not in inventory", async () => {
    const s = sale({ lines: [{ product_id: null, name: "Phone pouch", unit_price: 3000, quantity: 2 }], payments: [{ method: "transfer", amount: 6000 }] });
    await as(CASH_A, "select public.submit_sale($1)", [s]);
    const [{ kind }] = await as<{ kind: string }>(CEO, "select kind from public.notifications where ref_id = $1", [s.id]);
    expect(kind).toBe("quick_sale");
  });

  it("never blocks an offline sale even if stock runs out, but flags it", async () => {
    const s = sale({ offline: true, lines: [{ product_id: "g3", name: "JBL Flip 6", unit_price: 135000, quantity: 10 }], payments: [{ method: "cash", amount: 1350000 }] });
    await as(CASH_A, "select public.submit_sale($1)", [s]);
    const kinds = (await as<{ kind: string }>(CEO, "select kind from public.notifications where ref_id = $1", [s.id])).map((x) => x.kind);
    expect(kinds).toContain("negative_stock");
    const [{ message }] = await as<{ message: string }>(CEO, "select message from public.notifications where ref_id = $1 and kind = 'sale'", [s.id]);
    expect(message).toContain("made offline");
  });
});

describe("refunds and permissions", () => {
  it("cashiers cannot refund; managers can, and stock comes back once", async () => {
    const s = sale();
    await as(CASH_A, "select public.submit_sale($1)", [s]);
    const before = (await as<{ qty: number }>(CEO, "select qty from public.inventory where store_id = $1 and product_id = 'g3'", [storeA]))[0].qty;
    await expect(as(CASH_A, "select public.refund_sale($1, 'x')", [s.id])).rejects.toThrow(/manager or the owner/);
    await as(MGR_A, "select public.refund_sale($1, 'faulty')", [s.id]);
    await as(MGR_A, "select public.refund_sale($1, 'again')", [s.id]); // second refund is a no-op
    const after = (await as<{ qty: number }>(CEO, "select qty from public.inventory where store_id = $1 and product_id = 'g3'", [storeA]))[0].qty;
    expect(after).toBe(before + 1);
  });

  it("clients cannot write tables directly", async () => {
    await expect(as(CASH_A, "update public.inventory set qty = 999")).rejects.toThrow(/permission denied/);
    await expect(as(CASH_A, "insert into public.sales (id) values (gen_random_uuid())")).rejects.toThrow(/permission denied/);
  });

  it("other stores' sales are invisible to a cashier; the owner sees all", async () => {
    const seenByB = await as<{ n: number }>(CASH_B, "select count(*)::int as n from public.sales");
    expect(seenByB[0].n).toBe(0);
    const seenByCeo = await as<{ n: number }>(CEO, "select count(*)::int as n from public.sales");
    expect(seenByCeo[0].n).toBeGreaterThan(0);
  });

  it("only the owner moves stock between stores", async () => {
    await expect(as(MGR_A, "select public.transfer_stock($1, $2, 'g3', 1)", [storeB, storeA])).rejects.toThrow(/Only the owner/);
    await as(CEO, "select public.transfer_stock($1, $2, 'g3', 2)", [storeB, storeA]);
    const [{ qty }] = await as<{ qty: number }>(CEO, "select qty from public.inventory where store_id = $1 and product_id = 'g3'", [storeB]);
    expect(qty).toBe(7);
  });

  it("flags a cash shortage when a shift is closed", async () => {
    const id = crypto.randomUUID();
    const opened = new Date().toISOString();
    await as(CASH_A, "select public.save_shift($1)", [{ id, store_id: storeA, cashier_id: CASH_A, opened_at: opened, opening_cash: 10000 }]);
    await as(CASH_A, "select public.submit_sale($1)", [sale()]);
    const [shift] = await as<{ expected_cash: string }>(CASH_A, "select (public.save_shift($1)).expected_cash", [
      { id, store_id: storeA, cashier_id: CASH_A, opened_at: opened, closed_at: new Date(Date.now() + 1000).toISOString(), counted_cash: 100000 },
    ]);
    expect(Number(shift.expected_cash)).toBe(145000);
    const [{ n }] = await as<{ n: number }>(CEO, "select count(*)::int as n from public.notifications where kind = 'shift_short' and ref_id = $1", [id]);
    expect(n).toBe(1);
  });
});
