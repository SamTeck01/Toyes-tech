import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useProducts } from "@/context/ProductContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, Search as SearchIcon, X } from "@/components/icons";
import { PRICE_RANGES } from "@/lib/budgets";

const SORTS = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  name: "Name: A to Z",
} as const;
type SortKey = keyof typeof SORTS;


const Shop = () => {
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const condition = searchParams.get("condition") || "";
  const brand = searchParams.get("brand") || "";
  const type = searchParams.get("type") || "";
  const price = searchParams.get("price") || "";
  const inStockOnly = searchParams.get("stock") === "1";
  const sort = (searchParams.get("sort") as SortKey) || "featured";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const categories = ["Gadgets", "Phones", "Laptops"].filter((c) => products.some((p) => p.category === c));
  const types = useMemo(() => [...new Set(products.map((p) => p.subcategory).filter(Boolean))].sort() as string[], [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const conditions = useMemo(() => [...new Set(products.map((p) => p.condition).filter(Boolean))] as string[], [products]);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();
    const range = PRICE_RANGES.find((r) => r.id === price) ?? PRICE_RANGES[0];
    const list = products.filter((p) =>
      (q === "" || [p.name, p.brand, p.category, p.subcategory ?? ""].some((v) => v.toLowerCase().includes(q))) &&
      (category === "" || p.category === category) &&
      (condition === "" || p.condition === condition) &&
      (brand === "" || p.brand === brand) &&
      (type === "" || p.subcategory === type) &&
      p.price >= range.min && p.price < range.max &&
      (!inStockOnly || (p.inStock && p.stock > 0)),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [query, category, condition, brand, type, price, inStockOnly, sort, products]);

  const activeFilters = [
    category && { key: "category", label: category },
    type && { key: "type", label: type },
    brand && { key: "brand", label: brand },
    condition && { key: "condition", label: condition },
    price && { key: "price", label: PRICE_RANGES.find((r) => r.id === price)?.label ?? price },
    inStockOnly && { key: "stock", label: "In stock" },
    query && { key: "q", label: `“${query}”` },
  ].filter(Boolean) as { key: string; label: string }[];

  const Group = ({ title, name, options }: { title: string; name: string; options: { value: string; label: string }[] }) => (
    <fieldset className="border-b border-gray-100 pb-5">
      <legend className="mb-3 text-sm font-bold">{title}</legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.value || "all"} className="flex cursor-pointer items-center gap-3 text-sm text-black/70 hover:text-black">
            <input
              type="radio"
              name={name}
              checked={(searchParams.get(name) || "") === o.value}
              onChange={() => setParam(name, o.value)}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const filterPanel = (
    <div className="space-y-5">
      <Group title="Category" name="category" options={[{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]} />
      {(category === "" || category === "Gadgets") && types.length > 0 && (
        <Group title="Gadget type" name="type" options={[{ value: "", label: "All gadgets" }, ...types.map((t) => ({ value: t, label: t }))]} />
      )}
      <Group title="Brand" name="brand" options={[{ value: "", label: "All brands" }, ...brands.map((b) => ({ value: b, label: b }))]} />
      <Group title="Condition" name="condition" options={[{ value: "", label: "Any condition" }, ...conditions.map((c) => ({ value: c, label: c }))]} />
      <Group title="Price" name="price" options={PRICE_RANGES.map((r) => ({ value: r.id, label: r.label }))} />
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={inStockOnly} onChange={(e) => setParam("stock", e.target.checked ? "1" : "")} className="h-4 w-4 accent-[hsl(var(--primary))]" />
        In stock only
      </label>
    </div>
  );

  const title = query ? `Results for “${query}”` : type || category || "All products";

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Helmet><title>{title} | Toyes Tech</title></Helmet>
      <Navbar />

      <main className="container py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Shop</p>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-black/50">{filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
            </button>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setParam("sort", e.target.value === "featured" ? "" : e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
            >
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <button key={f.key} onClick={() => setParam(f.key, "")} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15">
                {f.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={() => setSearchParams({}, { replace: true })} className="text-xs font-semibold text-black/50 underline underline-offset-4 hover:text-black">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-10">
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-32">{filterPanel}</div>
          </aside>

          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i % 6} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
                  <SearchIcon className="h-8 w-8 text-black/50" />
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight">No products found</h2>
                <p className="max-w-xs text-sm text-black/50">Try removing a filter or searching for something else.</p>
                <button onClick={() => setSearchParams({}, { replace: true })} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
            <div className="border-t border-gray-100 p-4">
              <button onClick={() => setFiltersOpen(false)} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">
                Show {filteredProducts.length} products
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Shop;
