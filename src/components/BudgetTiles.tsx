import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductContext";
import { PRICE_RANGES } from "@/lib/budgets";

const notes: Record<string, string> = {
  "0-50000": "Earbuds, chargers, keyboards, fitness bands",
  "50000-200000": "Speakers, headphones, controllers, smartwatches",
  "200000-500000": "UK-used phones, school laptops, premium audio",
  "500000-1000000": "Flagship phones, business laptops, VR",
  "1000000-": "Latest iPhones, Galaxy Ultras, MacBook Pro",
};

/** Lets shoppers (especially students) start from what they can spend. */
const BudgetTiles = () => {
  const { products } = useProducts();
  const bands = PRICE_RANGES.filter((r) => r.id);
  return (
    <section className="container py-12 md:py-16" aria-labelledby="budget-heading">
      <h2 id="budget-heading" className="text-2xl font-extrabold md:text-3xl">Shop by budget</h2>
      <p className="mt-1 text-sm text-black/55">Pick what you want to spend and we'll show you everything that fits.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {bands.map((b, i) => {
          const count = products.filter((p) => p.price >= b.min && p.price < b.max).length;
          return (
            <Link
              key={b.id}
              to={`/shop?price=${b.id}&sort=price-asc`}
              className={`group flex flex-col justify-between rounded-2xl border p-4 transition md:min-h-[170px] md:p-5 ${
                i === 0 ? "border-primary bg-primary text-white" : "border-gray-200 bg-white hover:border-black/40"
              } ${i === bands.length - 1 ? "col-span-2 md:col-span-1" : ""}`}
            >
              <div>
                <p className={`font-display text-xl font-extrabold leading-tight md:text-2xl`}>{b.label}</p>
                <p className={`mt-2 text-xs leading-snug ${i === 0 ? "text-white/80" : "text-black/55"}`}>{notes[b.id]}</p>
              </div>
              <p className={`mt-4 text-sm font-semibold ${i === 0 ? "text-white" : "text-primary"}`}>{count} products</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default BudgetTiles;
