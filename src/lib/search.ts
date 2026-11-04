import type { Product } from "@/data/products";

/** Everyday words shoppers type, mapped to words that appear in product data. */
const SYNONYMS: Record<string, string[]> = {
  earbuds: ["airpods", "earpods", "audio"],
  earphones: ["airpods", "earpods", "audio"],
  headset: ["headphones", "audio"],
  speaker: ["soundlink", "flip", "speakers", "audio"],
  charger: ["power", "charging", "adapter", "bank"],
  powerbank: ["power", "bank"],
  watch: ["watch", "smartwatches", "band"],
  game: ["gaming", "controller", "xbox"],
  games: ["gaming", "controller", "xbox"],
  pad: ["controller"],
  computer: ["laptops", "laptop", "macbook", "thinkpad"],
  notebook: ["laptops"],
  mac: ["macbook"],
  phone: ["phones"],
  cctv: ["camera", "security"],
  uk: ["uk used"],
  used: ["uk used", "used"],
  cheap: [],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Edit distance capped at 2, used to forgive one-letter typos. */
const close = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

const haystack = (p: Product) => norm([p.name, p.brand, p.category, p.subcategory ?? "", p.condition ?? ""].join(" "));

/** Score how well one product matches a query. 0 means no match. */
export const scoreProduct = (p: Product, query: string): number => {
  const q = norm(query);
  if (!q) return 1;
  const hay = haystack(p);
  const words = hay.split(" ");
  let score = 0;
  for (const token of q.split(" ")) {
    const options = [token, ...(SYNONYMS[token] ?? [])];
    let best = 0;
    for (const t of options) {
      if (!t) { best = Math.max(best, 1); continue; }
      if (norm(p.name).startsWith(t)) best = Math.max(best, 6);
      else if (words.some((w) => w.startsWith(t))) best = Math.max(best, 4);
      else if (hay.includes(t)) best = Math.max(best, 3);
      else if (t.length >= 4 && words.some((w) => close(w, t) || (w.length > t.length && close(w.slice(0, t.length), t)))) best = Math.max(best, 2);
    }
    if (best === 0) return 0; // every word the shopper typed must match something
    score += best;
  }
  return score;
};

/** Products matching the query, best matches first. */
export const searchProducts = (products: Product[], query: string) =>
  products
    .map((p) => ({ p, s: scoreProduct(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);

export const POPULAR_SEARCHES = ["iPhone", "AirPods", "JBL speaker", "ThinkPad", "Power bank", "Smartwatch", "Gaming"];
