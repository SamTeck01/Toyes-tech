import { forwardRef } from "react";
import type { Sale } from "@/context/SalesContext";
import { STORE } from "@/config/store";
import { formatPrice } from "@/lib/format";

const METHOD_LABEL = { cash: "Cash", transfer: "Bank transfer", card: "Card (POS)" } as const;

/**
 * 80mm thermal-printer receipt. Shown on screen in the sale-complete dialog and
 * printed on its own via the `.print-receipt` rules in index.css.
 */
const Receipt = forwardRef<HTMLDivElement, { sale: Sale }>(({ sale }, ref) => (
  <div ref={ref} className="receipt mx-auto w-[300px] bg-white p-4 font-mono text-[12px] leading-snug text-black">
    <div className="text-center">
      <p className="text-base font-bold">{STORE.name}</p>
      <p>{sale.branch}</p>
      <p>{STORE.phoneDisplay}</p>
    </div>
    <div className="my-2 border-t border-dashed border-black" />
    <p>Receipt: {sale.id}</p>
    <p>{new Date(sale.date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>
    <p>Cashier: {sale.cashier}</p>
    {sale.customer?.name && <p>Customer: {sale.customer.name}{sale.customer.phone ? ` (${sale.customer.phone})` : ""}</p>}
    <div className="my-2 border-t border-dashed border-black" />
    {sale.lines.map((l) => (
      <div key={l.productId} className="mb-1">
        <p>{l.name}</p>
        <div className="flex justify-between">
          <span>{l.quantity} x {formatPrice(l.unitPrice)}</span>
          <span>{formatPrice(l.unitPrice * l.quantity)}</span>
        </div>
      </div>
    ))}
    <div className="my-2 border-t border-dashed border-black" />
    <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(sale.subtotal)}</span></div>
    {sale.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(sale.discount)}</span></div>}
    <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatPrice(sale.total)}</span></div>
    {sale.payments.map((p, i) => (
      <div key={i} className="flex justify-between"><span>{METHOD_LABEL[p.method]}</span><span>{formatPrice(p.amount)}</span></div>
    ))}
    {sale.change > 0 && <div className="flex justify-between"><span>Change</span><span>{formatPrice(sale.change)}</span></div>}
    {sale.status === "refunded" && <p className="mt-2 text-center font-bold">*** REFUNDED ***</p>}
    <div className="my-2 border-t border-dashed border-black" />
    <p className="text-center">Thank you for shopping with us!</p>
    <p className="text-center">Warranty applies. Keep this receipt.</p>
    <p className="text-center">7-day returns with receipt.</p>
  </div>
));
Receipt.displayName = "Receipt";

export default Receipt;
