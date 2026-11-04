import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";
import ProductCard from "./ProductCard";

const DealsGrid = () => {
  const { products } = useProducts();
  const discounted = products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .sort((a, b) => (b.originalPrice! - b.price) - (a.originalPrice! - a.price));
  const deals = [...discounted, ...products.filter((p) => !discounted.includes(p))].slice(0, 5);
  if (!deals.length) return null;
  const [big, ...rest] = deals;
  const saving = big.originalPrice && big.originalPrice > big.price ? big.originalPrice - big.price : 0;

  return (
    <section className="container py-12 md:py-16">
      <div className="mb-6 flex items-end justify-between md:mb-8">
        <h2 className="text-2xl font-extrabold md:text-3xl">Deals this week</h2>
        <Link to="/shop?sort=price-asc" className="text-sm font-semibold text-primary hover:underline underline-offset-4">See all</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Link to={`/product/${big.id}`} className="group relative block min-h-[420px] overflow-hidden rounded-[28px] bg-gray-100">
          <img src={big.images?.[1] ?? big.image} alt={big.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
            {saving > 0 && <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold">Save {formatPrice(saving)}</span>}
            <h3 className="text-3xl font-extrabold md:text-4xl">{big.name}</h3>
            <p className="mt-2 max-w-sm text-sm text-white/75">{big.description}</p>
            <p className="mt-4 text-2xl font-extrabold">{formatPrice(big.price)}</p>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6">
          {rest.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
};

export default DealsGrid;
