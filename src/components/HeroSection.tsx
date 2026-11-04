import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw } from "@/components/icons";
import { motion } from "framer-motion";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const HeroSection = () => {
  const { products } = useProducts();
  const hero = products.find((p) => p.id === "p1") ?? products[0];

  return (
    <section className="container pt-6 pb-10 md:pt-10 md:pb-16">
      <div className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-[#F4F3F1] md:grid-cols-[1.05fr_1fr] md:gap-0">
        <div className="order-2 px-6 pb-8 md:order-1 md:py-16 md:pl-14 md:pr-6 lg:pl-16">
          <h1 className="font-display text-[2.5rem] font-extrabold leading-[0.98] text-black sm:text-5xl lg:text-[4.25rem]">
            Phones and gadgets, checked before they reach you.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-black/65 md:text-lg">
            New and UK-used phones, laptops, smartwatches, earbuds and accessories from Apple, Samsung, Google and more. Every one is tested, covered by warranty and delivered across Nigeria.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop?category=Phones" className="rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110">
              Shop phones
            </Link>
            <Link to="/shop" className="rounded-full border border-black/15 bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:border-black/40">
              Shop gadgets
            </Link>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-black/70 sm:grid-cols-3 sm:gap-4">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> Warranty on every device</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-primary" /> Nationwide delivery</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 shrink-0 text-primary" /> 7-day returns</li>
          </ul>
        </div>

        {hero && (
          <Link to={`/product/${hero.id}`} className="group relative order-1 block h-[340px] sm:h-[420px] md:order-2 md:h-full md:min-h-[560px]">
            <motion.img
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              src={hero.image}
              alt={hero.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur md:bottom-8 md:left-8">
              <p className="text-xs text-black/55">{hero.name}</p>
              <p className="text-lg font-extrabold text-black">
                {formatPrice(hero.price)}
                {hero.originalPrice && hero.originalPrice > hero.price && (
                  <span className="ml-2 text-sm font-semibold text-black/40 line-through">{formatPrice(hero.originalPrice)}</span>
                )}
              </p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
