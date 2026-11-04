import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

interface Props {
  id: string; // unique per row so each row's arrows control only its own carousel
  title: string;
  subtitle?: string;
  to?: string;
  linkLabel?: string;
  products: Product[];
  tone?: "plain" | "tinted";
}

/** A titled, swipeable row of product cards. */
const ProductRow = ({ id, title, subtitle, to, linkLabel = "See all", products, tone = "plain" }: Props) => {
  if (!products.length) return null;
  return (
    <section className={tone === "tinted" ? "bg-[#F6F6F7]" : ""}>
      <div className="container py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-black/55">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            {to && <Link to={to} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">{linkLabel}</Link>}
            <div className="hidden gap-2 sm:flex">
              <button aria-label={`Previous ${title}`} className={`${id}-prev flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:border-black/40 disabled:opacity-30`}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button aria-label={`Next ${title}`} className={`${id}-next flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:border-black/40 disabled:opacity-30`}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <Swiper
          modules={[Navigation]}
          navigation={{ prevEl: `.${id}-prev`, nextEl: `.${id}-next` }}
          spaceBetween={14}
          slidesPerView={1.6}
          breakpoints={{ 540: { slidesPerView: 2.4, spaceBetween: 18 }, 768: { slidesPerView: 3.3, spaceBetween: 20 }, 1100: { slidesPerView: 4.4, spaceBetween: 24 } }}
        >
          {products.map((p) => (
            <SwiperSlide key={p.id} className="!h-auto"><ProductCard product={p} /></SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ProductRow;
