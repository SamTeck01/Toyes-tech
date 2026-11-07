import type { LocalSale } from "@/pos/localdb";
import { STORE } from "@/config/store";
import { formatPrice } from "@/lib/format";

const METHOD = { cash: "Cash", transfer: "Bank transfer", card: "Card (POS)" } as const;

/** 80mm thermal receipt; printed on its own via the .print-area rules in index.css. */
const PosReceipt = ({ sale }: { sale: LocalSale }) => (
  <div className="receipt mx-auto w-[300px] bg-white p-4 font-mono text-[12px] leading-snug text-black">
    <div className="text-center">
      <p className="text-base font-bold">{STORE.name}</p>
      <p>{sale.store_name}</p>
      <p>{STORE.phoneDisplay}</p>
    </div>
    <div className="my-2 border-t border-dashed border-black" />
    <p>Receipt: {sale.receipt_no}</p>
    <p>{new Date(sale.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
    <p>Cashier: {sale.cashier_name}</p>
    {sale.customer_name && <p>Customer: {sale.customer_name}{sale.customer_phone ? ` (${sale.customer_phone})` : ""}</p>}
    <div className="my-2 border-t border-dashed border-black" />
    {sale.lines.map((l, i) => (
      <div key={i} className="mb-1">
        <p>{l.name}</p>
        <div className="flex justify-between"><span>{l.quantity} x {formatPrice(l.unit_price)}</span><span>{formatPrice(l.unit_price * l.quantity)}</span></div>
      </div>
    ))}
    <div className="my-2 border-t border-dashed border-black" />
    <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(sale.subtotal)}</span></div>
    {sale.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(sale.discount)}</span></div>}
    <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatPrice(sale.total)}</span></div>
    {sale.payments.map((p, i) => <div key={i} className="flex justify-between"><span>{METHOD[p.method]}</span><span>{formatPrice(p.amount)}</span></div>)}
    {sale.change_given > 0 && <div className="flex justify-between"><span>Change</span><span>{formatPrice(sale.change_given)}</span></div>}
    {sale.status === "refunded" && <p className="mt-2 text-center font-bold">*** REFUNDED ***</p>}
    <div className="my-2 border-t border-dashed border-black" />
    <p className="text-center">Thank you for shopping with us!</p>
    <p className="text-center">Warranty applies. Keep this receipt.</p>
  </div>
);

export default PosReceipt;
