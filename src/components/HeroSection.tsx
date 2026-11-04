import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from "@/components/icons";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const departments = [
  { name: "Gadgets", image: "/images/products/hero-gadgets.jpg", blurb: "Speakers, earbuds, smartwatches, gaming and more", cta: "Shop gadgets" },
  { name: "Phones", image: "/images/products/hero-phones.jpg", blurb: "iPhone, Samsung, Google. New and UK-used", cta: "Shop phones" },
  { name: "Laptops", image: "/images/products/hero-laptops.jpg", blurb: "MacBook, ThinkPad, HP and Dell for school and work", cta: "Shop laptops" },
];

/** Three equal departments: gadgets, phones and laptops each get a third of the hero. */
const HeroSection = () => {
  const { products } = useProducts();

  return (
    <section className="container pt-6 pb-10 md:pt-10 md:pb-14">
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <h1 className="font-display text-[2.4rem] font-extrabold leading-[1] text-black sm:text-5xl lg:text-6xl">
          Gadgets, phones and laptops.
        </h1>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-black/65 md:pb-1">
          <li className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Warranty on every device</li>
          <li className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Nationwide delivery</li>
          <li className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-primary" /> 7-day returns</li>
        </ul>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {departments.map((d, i) => {
          const items = products.filter((p) => p.category === d.name);
          const from = items.length ? Math.min(...items.map((p) => p.price)) : 0;
          return (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Link
                to={`/shop?category=${d.name}`}
                className="group relative flex h-[230px] flex-col justify-end overflow-hidden rounded-[24px] bg-gray-200 p-5 text-white sm:h-[300px] md:h-[460px] md:p-7"
              >
                <img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/0" />
                <div className="relative">
                  <p className="text-sm text-white/80">{items.length} products{from ? ` · from ${formatPrice(from)}` : ""}</p>
                  <h2 className="mt-1 text-4xl font-extrabold md:text-5xl">{d.name}</h2>
                  <p className="mt-2 max-w-xs text-sm text-white/80">{d.blurb}</p>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition group-hover:bg-primary group-hover:text-white">
                    {d.cta} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default HeroSection;
