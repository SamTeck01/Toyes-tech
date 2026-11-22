/** Read a product export from the old POS (one row per item) into rows we can save. */

export interface ImportRow {
  id: string;
  name: string;
  category: "Gadgets" | "Phones" | "Laptops";
  type: string;
  price: number;
  qty: number;
  low: number | null;
  note?: string;
}

/** Minimal CSV parser: handles quoted fields, commas and newlines inside quotes. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
};

const num = (v: string | undefined) => {
  const n = Number((v ?? "").replace(/[^\d.-]/g, ""));
  return (v ?? "").trim() && Number.isFinite(n) ? n : null;
};

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

/** Placeholder items the old POS used for open-price sales. Quick sale replaces them. */
const PLACEHOLDERS = /^(fast sales?|repaired)$/i;

export const mapOldPosExport = (text: string): { rows: ImportRow[]; skipped: { name: string; why: string }[]; storeColumn: string | null } => {
  const [header, ...body] = parseCsv(text.replace(/^\uFEFF/, ""));
  if (!header) throw new Error("The file is empty.");
  const col = (pred: (h: string) => boolean) => header.findIndex((h) => pred(h.trim().toLowerCase()));
  const iSku = col((h) => h === "sku");
  const iName = col((h) => h === "item name" || h === "name" || h === "product");
  if (iName < 0) throw new Error("Couldn't find an \"Item Name\" column. Is this the product export from the old POS?");
  const iCat = col((h) => h === "category");
  const iVar = col((h) => h === "variation name");
  const iDefault = col((h) => h === "default sell price");
  const iMin = col((h) => h === "min sell price");
  const iMax = col((h) => h === "max sell price");
  // Per-branch columns look like "Sell Price [Branch name]". Use the first branch in the file.
  const iStorePrice = col((h) => h.startsWith("sell price ["));
  const storeColumn = iStorePrice >= 0 ? header[iStorePrice].replace(/^.*\[(.*)\].*$/, "$1") : null;
  const branch = (label: string) => col((h) => h.startsWith(`${label} [`) && (!storeColumn || h.includes(storeColumn.toLowerCase())));
  const iStoreMin = branch("min sell price");
  const iStoreMax = branch("max sell price");
  const iStock = branch("current stock");
  const iLow = branch("low stock threshold");

  const rows: ImportRow[] = [];
  const skipped: { name: string; why: string }[] = [];
  const seen = new Set<string>();
  for (const r of body) {
    const name = (r[iName] ?? "").replace(/^[\s.]+/, "").replace(/\s+/g, " ").trim();
    if (!name) continue;
    if (PLACEHOLDERS.test(name)) { skipped.push({ name, why: "placeholder item, use Quick sale instead" }); continue; }
    const variation = iVar >= 0 ? (r[iVar] ?? "").trim() : "";
    const fullName = variation && !/^regular$/i.test(variation) ? `${name} (${variation})` : name;
    // Fixed price if there is one, otherwise the lowest allowed price (cashiers can still change it at the till).
    const candidates = [num(r[iStorePrice]), num(r[iDefault]), num(r[iStoreMin]), num(r[iMin]), num(r[iStoreMax]), num(r[iMax])];
    // No price yet: imported at 0 and the cashier types the price when selling.
    const price = candidates.find((p): p is number => p !== null && p >= 50) ?? 0;
    const max = num(r[iStoreMax]) ?? num(r[iMax]);
    const rawCat = iCat >= 0 ? (r[iCat] ?? "").trim() : "";
    const lc = rawCat.toLowerCase();
    const category = lc === "phone" || lc === "phones" ? "Phones" : lc.startsWith("laptop") && !lc.includes("access") && !lc.includes("stand") ? "Laptops" : "Gadgets";
    const sku = iSku >= 0 ? (r[iSku] ?? "").trim() : "";
    const id = `old-${(sku || fullName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`.slice(0, 60);
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      name: fullName,
      category,
      type: rawCat ? titleCase(rawCat) : "",
      price,
      qty: Math.max(0, Math.floor(num(r[iStock]) ?? 0)),
      low: num(r[iLow]),
      note: max && max > price ? `up to ${max.toLocaleString("en-NG")}` : undefined,
    });
  }
  return { rows, skipped, storeColumn };
};
