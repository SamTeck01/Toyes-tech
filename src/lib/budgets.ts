import { formatPrice } from "@/lib/format";

/** Shared price bands used by the shop filter and the home page budget tiles. */
export const PRICE_RANGES = [
  { id: "", label: "Any price", min: 0, max: Infinity },
  { id: "0-50000", label: `Under ${formatPrice(50000)}`, min: 0, max: 50000 },
  { id: "50000-200000", label: `${formatPrice(50000)} – ${formatPrice(200000)}`, min: 50000, max: 200000 },
  { id: "200000-500000", label: `${formatPrice(200000)} – ${formatPrice(500000)}`, min: 200000, max: 500000 },
  { id: "500000-1000000", label: `${formatPrice(500000)} – ${formatPrice(1000000)}`, min: 500000, max: 1000000 },
  { id: "1000000-", label: `Over ${formatPrice(1000000)}`, min: 1000000, max: Infinity },
];
