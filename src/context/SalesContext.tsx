import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useProducts } from "@/context/ProductContext";

export type PaymentMethod = "cash" | "transfer" | "card";

export interface SaleLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Sale {
  id: string; // receipt number, e.g. TT-000123
  date: string; // ISO
  branch: string;
  cashier: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  total: number;
  payments: { method: PaymentMethod; amount: number }[];
  change: number;
  customer?: { name?: string; phone?: string };
  status: "completed" | "refunded";
  refundedAt?: string;
}

export interface HeldCart {
  id: string;
  label: string;
  lines: SaleLine[];
  heldAt: string;
}

interface SalesContextType {
  sales: Sale[];
  held: HeldCart[];
  recordSale: (sale: Omit<Sale, "id" | "date" | "status">) => Sale;
  refundSale: (id: string) => void;
  holdCart: (label: string, lines: SaleLine[]) => void;
  removeHeld: (id: string) => void;
}

const SALES_KEY = "toyes_pos_sales";
const HELD_KEY = "toyes_pos_held";
const SEQ_KEY = "toyes_pos_seq";

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
};

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const { adjustStock } = useProducts();
  const [sales, setSales] = useState<Sale[]>(() => load(SALES_KEY, []));
  const [held, setHeld] = useState<HeldCart[]>(() => load(HELD_KEY, []));

  useEffect(() => save(SALES_KEY, sales), [sales]);
  useEffect(() => save(HELD_KEY, held), [held]);

  const nextReceiptNo = () => {
    const n = load<number>(SEQ_KEY, 0) + 1;
    save(SEQ_KEY, n);
    return `TT-${String(n).padStart(6, "0")}`;
  };

  const recordSale: SalesContextType["recordSale"] = (data) => {
    const sale: Sale = { ...data, id: nextReceiptNo(), date: new Date().toISOString(), status: "completed" };
    data.lines.forEach((l) => adjustStock(l.productId, -l.quantity));
    setSales((prev) => [sale, ...prev]);
    return sale;
  };

  const refundSale = (id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale || sale.status === "refunded") return;
    sale.lines.forEach((l) => adjustStock(l.productId, l.quantity)); // put items back on the shelf
    const refundedAt = new Date().toISOString();
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: "refunded", refundedAt } : s)));
  };

  const holdCart = (label: string, lines: SaleLine[]) =>
    setHeld((prev) => [{ id: crypto.randomUUID(), label, lines, heldAt: new Date().toISOString() }, ...prev]);

  const removeHeld = (id: string) => setHeld((prev) => prev.filter((h) => h.id !== id));

  return (
    <SalesContext.Provider value={{ sales, held, recordSale, refundSale, holdCart, removeHeld }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error("useSales must be used within SalesProvider");
  return ctx;
};
