import { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductContext";
import ProductCard from "./ProductCard";

const TABS = ["Phones", "Laptops", "Watches", "Audio", "Accessories"];

const TabbedProducts = () => {
  const { products } = useProducts();
  const [active, setActive] = useState("Phones");
  const filtered = products.filter((p) => p.category === active).slice(0, 8);

  return (
    <section className="container py-14 md:py-20">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <h2 className="text-2xl font-extrabold md:text-3xl">Browse the range</h2>
        <div role="tablist" aria-label="Product categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide md:mx-0 md:px-0">
          {TABS.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={active === cat}
              onClick={() => setActive(cat)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${active === cat ? "bg-black text-white" : "bg-gray-100 text-black/65 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="mt-10 text-center">
        <Link to={`/shop?category=${active}`} className="inline-block rounded-full border border-black/15 px-7 py-3 text-sm font-bold hover:border-black/40">
          See all {active.toLowerCase()}
        </Link>
      </div>
    </section>
  );
};

export default TabbedProducts;
