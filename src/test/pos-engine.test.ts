import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetLocalDb, localDb } from "@/pos/localdb";
import {
  configureServer, recordSale, syncNow, setDevice, getStatus, computeTotals, openShift, closeShift,
  retryFailed, hashPin, checkPin, NetworkError, AuthError, RejectedError, type PosServer,
} from "@/pos/engine";

/** A fake server we can switch between working, offline, signed-out and rejecting. */
const makeServer = () => {
  const received: Record<string, unknown>[] = [];
  const state = { mode: "ok" as "ok" | "offline" | "auth" | "reject", failAfter: Infinity, stock: 10 };
  const server: PosServer = {
    async submitSale(p) {
      if (state.mode === "offline" || received.length >= state.failAfter) throw new NetworkError("Failed to fetch");
      if (state.mode === "auth") throw new AuthError("JWT expired");
      if (state.mode === "reject") throw new RejectedError("Cashier does not belong to this store");
      if (!received.some((r) => r.id === p.id)) received.push(p); // server is idempotent on id
      const qty = (p.lines as { product_id: string | null; quantity: number }[]).reduce((s, l) => s + (l.product_id ? l.quantity : 0), 0);
      state.stock -= qty;
    },
    async saveShift() {
      if (state.mode === "offline") throw new NetworkError("Failed to fetch");
    },
    async pull() {
      return {
        products: [{ id: "g3", name: "JBL Flip 6", brand: "JBL", category: "Gadgets", subcategory: "Audio", condition: "New", base_price: 135000, image: null, barcode: "123" }],
        inventory: [{ product_id: "g3", qty: state.stock, price: null, low_stock_at: 2 }],
        staff: [{ id: "c1", full_name: "Tolu", username: "tolu", role: "cashier", store_id: "s1", pin_hash: null }],
      };
    },
    async notify() {},
  };
  return { server, received, state };
};

const cashier = { id: "c1", full_name: "Tolu" };
const jbl = { product_id: "g3", name: "JBL Flip 6", unit_price: 135000, quantity: 1 };

let fake: ReturnType<typeof makeServer>;

beforeEach(async () => {
  await resetLocalDb(`test-${crypto.randomUUID()}`);
  fake = makeServer();
  configureServer(fake.server);
  await setDevice({ device_id: "d1", device_code: "T1", store_id: "s1", store_code: "CMP", store_name: "Campus store" });
  await localDb.inventory.put({ product_id: "g3", qty: 10, price: null, low_stock_at: 2 });
});

describe("totals", () => {
  it("adds up lines, caps discount at subtotal and works out change", () => {
    const t = computeTotals([{ ...jbl, quantity: 2 }], 5000, [{ amount: 300000 }]);
    expect(t).toEqual({ subtotal: 270000, discount: 5000, total: 265000, paid: 300000, change: 35000 });
    expect(computeTotals([jbl], 999999, [{ amount: 0 }]).total).toBe(0);
  });
});

describe("selling", () => {
  it("refuses underpayment and empty sales", async () => {
    await expect(recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 1000 }] })).rejects.toThrow(/less than the total/);
    await expect(recordSale({ cashier, lines: [], discount: 0, payments: [] })).rejects.toThrow(/at least one item/);
  });

  it("numbers receipts per store and till, in order", async () => {
    const a = await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] });
    const b = await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] });
    expect(a.receipt_no).toBe("CMP-T1-000001");
    expect(b.receipt_no).toBe("CMP-T1-000002");
  });

  it("keeps selling with no internet, then syncs everything when it comes back", async () => {
    fake.state.mode = "offline";
    await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] }, false);
    await recordSale({ cashier, lines: [{ product_id: null, name: "Phone pouch", unit_price: 3000, quantity: 1 }], discount: 0, payments: [{ method: "transfer", amount: 3000 }] }, false);
    await syncNow();
    expect(getStatus().pending).toBe(2);
    expect(getStatus().problem).toBe("offline");
    expect((await localDb.inventory.get("g3"))!.qty).toBe(9); // stock already reduced on the till

    fake.state.mode = "ok";
    await syncNow();
    expect(fake.received).toHaveLength(2);
    expect(getStatus().pending).toBe(0);
    expect(getStatus().message).toBeUndefined();
    expect(getStatus().problem).toBe("none");
    expect((await localDb.sales.toArray()).every((s) => s.sync === "synced")).toBe(true);
    expect(fake.received[0].offline).toBe(true);
  });

  it("never loses or duplicates a sale when the network drops mid-sync", async () => {
    fake.state.mode = "offline";
    for (let i = 0; i < 3; i++) await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] }, false);
    fake.state.mode = "ok";
    fake.state.failAfter = 1; // connection drops after the first sale reaches the server
    await syncNow();
    expect(fake.received).toHaveLength(1);
    expect(getStatus().pending).toBe(2);
    fake.state.failAfter = Infinity;
    await syncNow();
    await syncNow();
    expect(fake.received).toHaveLength(3);
    expect(new Set(fake.received.map((r) => r.id)).size).toBe(3);
    expect(fake.received.map((r) => r.receipt_no)).toEqual(["CMP-T1-000001", "CMP-T1-000002", "CMP-T1-000003"]);
  });

  it("keeps sales queued if the sign-in expired, and says so", async () => {
    fake.state.mode = "auth";
    await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] });
    await syncNow();
    expect(getStatus().problem).toBe("auth");
    expect(getStatus().pending).toBe(1);
  });

  it("keeps a rejected sale for review instead of deleting it, and can retry", async () => {
    fake.state.mode = "reject";
    const s = await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] });
    await syncNow();
    expect(getStatus().failed).toBe(1);
    expect((await localDb.sales.get(s.id))!.sync).toBe("failed");
    fake.state.mode = "ok";
    await retryFailed();
    expect(fake.received).toHaveLength(1);
    expect(getStatus().failed).toBe(0);
  });

  it("refreshes stock from the server without double-counting unsynced sales", async () => {
    fake.state.mode = "offline";
    await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 135000 }] }, false);
    fake.state.mode = "ok";
    fake.state.failAfter = 0; // push fails, pull would not run
    await syncNow();
    fake.state.failAfter = Infinity;
    await syncNow(); // push succeeds (server stock 10→9), then pull
    expect((await localDb.inventory.get("g3"))!.qty).toBe(9);
  });
});

describe("shifts and PINs", () => {
  it("works out expected cash from opening float, cash taken and change given", async () => {
    const shift = await openShift("c1", 20000);
    await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "cash", amount: 140000 }] }); // 5,000 change
    await recordSale({ cashier, lines: [jbl], discount: 0, payments: [{ method: "transfer", amount: 135000 }] });
    const r = await closeShift(shift, 150000);
    expect(r.expected).toBe(155000);
    expect(r.difference).toBe(-5000);
  });

  it("checks cashier PINs without storing them", async () => {
    const pin_hash = await hashPin("1234", "c1");
    const staff = { id: "c1", full_name: "Tolu", username: "tolu", role: "cashier" as const, store_id: "s1", pin_hash };
    expect(await checkPin(staff, "1234")).toBe(true);
    expect(await checkPin(staff, "1235")).toBe(false);
    expect(pin_hash).not.toContain("1234");
  });
});
