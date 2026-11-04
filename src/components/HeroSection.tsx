import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { ArrowUpRight } from "@/components/icons";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const slides = [
  {
    dept: "Gadgets",
    title: "Gadgets for\nevery day",
    blurb: "Speakers, earbuds, smartwatches, gaming gear and chargers.",
    image: "/images/products/hero-gadgets-wide.jpg",
    position: "50% 50%",
  },
  {
    dept: "Phones",
    title: "Pristine\nphones",
    blurb: "iPhone, Samsung and Google. New and tested UK-used.",
    image: "/images/products/hero-phones-wide.jpg",
    position: "50% 35%",
  },
  {
    dept: "Laptops",
    title: "Laptops for\nschool and work",
    blurb: "MacBook, ThinkPad, HP and Dell for lectures, projects and play.",
    image: "/images/products/hero-laptops-wide.jpg",
    position: "50% 30%",
  },
];

const sidePanels = [
  {
    eyebrow: "Grade A condition",
    title: "Tested UK-used",
    cta: "Shop UK-used",
    to: "/shop?condition=UK%20Used",
    image: "/images/products/l5.jpg",
  },
  {
    eyebrow: "Student budget",
    title: "Gadgets under ₦50k",
    cta: "Shop deals",
    to: "/shop?category=Gadgets&price=0-50000&sort=price-asc",
    image: "/images/headphones-gold.jpg",
  },
];

/**
 * Bento hero: a large carousel that rotates gadgets, phones and laptops equally,
 * with two stacked promo panels beside it.
 */
const HeroSection = () => {
  const { products } = useProducts();
  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);

  const meta = (dept: string) => {
    const items = products.filter((p) => p.category === dept);
    return { count: items.length, from: items.length ? Math.min(...items.map((p) => p.price)) : 0 };
  };

  return (
    <section className="container pt-5 pb-8 md:pt-8 md:pb-12">
      <div className="grid gap-3 md:h-[520px] md:grid-cols-3 md:gap-5">
        {/* Main carousel */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative h-[420px] overflow-hidden rounded-[24px] bg-black sm:h-[460px] md:col-span-2 md:h-full"
        >
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            loop
            autoplay={{ delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            onSwiper={(s) => (swiperRef.current = s)}
            onSlideChange={(s) => setActive(s.realIndex)}
            className="h-full w-full"
          >
            {slides.map((s, i) => {
              const m = meta(s.dept);
              return (
                <SwiperSlide key={s.dept} className="relative h-full">
                  <img
                    src={s.image}
                    alt=""
                    style={{ objectPosition: s.position }}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 md:bg-gradient-to-r md:from-black/75 md:via-black/35 md:to-transparent" />
                  <div className="relative z-10 flex h-full flex-col justify-end p-6 pb-20 text-white md:max-w-md md:justify-center md:p-12 md:pb-12">
                    <p className="text-sm text-white/80">
                      {m.count} {s.dept.toLowerCase()}{m.from ? ` · from ${formatPrice(m.from)}` : ""}
                    </p>
                    <h1 className="mt-2 whitespace-pre-line font-display text-[2.6rem] font-extrabold leading-[0.98] md:text-6xl">
                      {s.title}
                    </h1>
                    <p className="mt-3 max-w-xs text-sm text-white/80 md:text-base">{s.blurb}</p>
                    <div className="mt-6">
                      <Link
                        to={`/shop?category=${s.dept}`}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
                      >
                        Shop {s.dept.toLowerCase()} <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Department tabs double as carousel pagination, so all three are always visible. */}
          <div role="tablist" aria-label="Departments" className="absolute bottom-4 left-4 right-4 z-20 flex gap-1.5 md:bottom-6 md:left-12 md:right-auto">
            {slides.map((s, i) => (
              <button
                key={s.dept}
                role="tab"
                aria-selected={active === i}
                onClick={() => swiperRef.current?.slideToLoop(i)}
                className={`flex-1 rounded-full px-4 py-2 text-xs font-bold backdrop-blur transition md:flex-none md:text-sm ${
                  active === i ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {s.dept}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Side panels */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:grid-rows-2 md:gap-5">
          {sidePanels.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="md:h-full"
            >
              <Link to={p.to} className="group relative flex h-[190px] flex-col justify-end overflow-hidden rounded-[24px] bg-gray-200 p-4 text-white sm:h-[220px] md:h-full md:p-7">
                <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative">
                  <p className="text-[11px] text-white/75 md:text-xs">{p.eyebrow}</p>
                  <h2 className="mt-1 text-lg font-extrabold leading-tight md:text-2xl">{p.title}</h2>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white/90 group-hover:text-white md:mt-3 md:text-sm">
                    {p.cta} <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
