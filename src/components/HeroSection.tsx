import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, RotateCcw } from "@/components/icons";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const departments = [
  { name: "Gadgets", image: "/images/products/hero-gadgets.jpg", position: "24% 50%" },
  { name: "Phones", image: "/images/products/hero-phones.jpg", position: "45% 40%" },
  { name: "Laptops", image: "/images/products/hero-laptops.jpg", position: "50% 60%" },
];

/**
 * Split hero: headline and promises on the left, and on the right three equal photo
 * strips so gadgets, phones and laptops each get a third of the showcase.
 */
const HeroSection = () => {
  const { products } = useProducts();
  const stats = departments.map((d) => {
    const items = products.filter((p) => p.category === d.name);
    return { ...d, count: items.length, from: items.length ? Math.min(...items.map((p) => p.price)) : 0 };
  });

  return (
    <section className="container pt-6 pb-10 md:pt-10 md:pb-16">
      <div className="grid overflow-hidden rounded-[28px] bg-[#F4F3F1] md:grid-cols-[1fr_1.05fr]">
        <div className="order-2 px-6 py-8 md:order-1 md:py-16 md:pl-14 md:pr-8 lg:pl-16">
          <h1 className="font-display text-[2.4rem] font-extrabold leading-[0.98] text-black sm:text-5xl lg:text-[4rem]">
            Gadgets, phones and laptops, checked before they reach you.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-black/65 md:text-lg">
            Speakers, earbuds, smartwatches and gaming gear, plus new and UK-used phones and laptops. Every one is tested, covered by warranty and delivered across Nigeria.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {stats.map((d, i) => (
              <Link
                key={d.name}
                to={`/shop?category=${d.name}`}
                className={
                  i === 0
                    ? "rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
                    : "rounded-full border border-black/15 bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:border-black/40"
                }
              >
                Shop {d.name.toLowerCase()}
              </Link>
            ))}
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-black/70 sm:grid-cols-3 sm:gap-4">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Warranty on every device</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-primary" /> Nationwide delivery</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 shrink-0 text-primary" /> 7-day returns</li>
          </ul>
        </div>

        <div className="order-1 grid h-[300px] grid-cols-3 gap-1 sm:h-[400px] md:order-2 md:h-full md:min-h-[580px]">
          {stats.map((d, i) => (
            <Link key={d.name} to={`/shop?category=${d.name}`} className="group relative block overflow-hidden" aria-label={`Shop ${d.name}`}>
              <motion.img
                initial={{ scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: i * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
                src={d.image}
                alt=""
                style={{ objectPosition: d.position }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-2 right-2 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur md:bottom-6 md:left-4 md:right-4 md:px-4 md:py-3">
                <p className="text-sm font-extrabold text-black md:text-lg">{d.name}</p>
                <p className="whitespace-nowrap text-[11px] text-black/55 md:text-xs">
                  {d.count} items<span className="hidden md:inline">{d.from ? ` · from ${formatPrice(d.from)}` : ""}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
