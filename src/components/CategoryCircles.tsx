import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductContext";

const types = [
  { name: "Audio", image: "/images/bose-revolve.jpg" },
  { name: "Smartwatches", image: "/images/smartwatch.jpg" },
  { name: "Gaming", image: "/images/game-controller.jpg" },
  { name: "Power & Charging", image: "/images/wireless-charger.jpg" },
  { name: "Computer Accessories", image: "/images/keyboard.jpg" },
  { name: "Smart Home", image: "/images/security-cam.jpg" },
];

/** Gadget types: the store's biggest department, broken down so shoppers can jump straight in. */
const CategoryCircles = () => {
  const { products } = useProducts();
  return (
    <section className="container py-10 md:py-14" aria-labelledby="gadget-types">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="gadget-types" className="text-2xl font-extrabold md:text-3xl">Gadgets for everything</h2>
        <Link to="/shop?category=Gadgets" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">All gadgets</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {types.map((t) => {
          const count = products.filter((p) => p.subcategory === t.name).length;
          return (
            <Link
              key={t.name}
              to={`/shop?category=Gadgets&type=${encodeURIComponent(t.name)}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-[#F6F6F7] transition hover:border-primary/40"
            >
              <div className="aspect-square overflow-hidden bg-white">
                <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 md:p-4">
                <p className="text-sm font-bold leading-tight">{t.name}</p>
                <p className="text-xs text-black/55">{count} {count === 1 ? "item" : "items"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryCircles;
