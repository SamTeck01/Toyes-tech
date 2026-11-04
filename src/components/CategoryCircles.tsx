import { Link } from "react-router-dom";
import { useProducts } from "@/context/ProductContext";

const tiles = [
  { name: "Phones", image: "/images/products/p4.jpg" },
  { name: "Laptops", image: "/images/products/l1.jpg" },
  { name: "Watches", image: "/images/products/w2.jpg" },
  { name: "Audio", image: "/images/products/au2.jpg" },
  { name: "Accessories", image: "/images/products/a2.jpg" },
];

/** Photo tiles linking to each shop category. */
const CategoryCircles = () => {
  const { products } = useProducts();
  return (
    <section className="container pb-6 md:pb-10" aria-labelledby="cat-heading">
      <h2 id="cat-heading" className="mb-5 text-2xl font-extrabold md:text-3xl">Shop by category</h2>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0">
        {tiles.map((t) => {
          const count = products.filter((p) => p.category === t.name).length;
          return (
            <Link key={t.name} to={`/shop?category=${t.name}`} className="group relative block aspect-[4/5] w-[42%] shrink-0 snap-start overflow-hidden rounded-2xl bg-gray-100 sm:w-[30%] md:w-auto">
              <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <p className="text-lg font-bold leading-tight">{t.name}</p>
                <p className="text-xs text-white/75">{count} {count === 1 ? "product" : "products"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryCircles;
