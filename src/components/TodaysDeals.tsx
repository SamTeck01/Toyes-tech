import { ChevronRight } from "@/components/icons";
import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const TodaysDeals = () => {
  const { products } = useProducts();
  const dealProducts = products.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 4);
  const mainDeal = dealProducts[0];
  const sideDeal = dealProducts.slice(1, 4);

  if (!mainDeal) return null;

  return (
    <section className="bg-secondary">
      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Today's Best Deals</h2>
          <Link to="/" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline">
            See All Deals <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main deal */}
          <div className="bg-background rounded-xl p-6 border border-border flex flex-col justify-between">
            <div>
              <p className="text-xs text-primary font-medium mb-1">Expand Your</p>
              <p className="text-xs text-primary font-medium mb-3">Entertainment</p>
              <p className="text-2xl font-bold text-foreground mb-4">{formatPrice(mainDeal.price)}</p>
            </div>
            <Link to={`/product/${mainDeal.id}`} className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg w-fit hover:opacity-90 transition-opacity">
              View All Items <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Side deals */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sideDeal.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="bg-background rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="aspect-square bg-secondary rounded-lg mb-3 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" loading="lazy" width={200} height={200} />
                </div>
                <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-semibold text-foreground">{formatPrice(p.price)}</span>
                  {p.originalPrice && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.originalPrice)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TodaysDeals;
