import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import CategoryCircles from "@/components/CategoryCircles";
import DealsGrid from "@/components/DealsGrid";
import TabbedProducts from "@/components/TabbedProducts";
import InspectionSteps from "@/components/InspectionSteps";
import BrandStrip from "@/components/BrandStrip";
import SocialBar from "@/components/SocialBar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useProducts } from "@/context/ProductContext";
import type { Product } from "@/data/products";

const SectionHeader = ({ title, to, children }: { title: string; to?: string; children?: React.ReactNode }) => (
  <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
    <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
    <div className="flex items-center gap-4">
      {to && <Link to={to} className="text-sm font-semibold text-primary hover:underline underline-offset-4">See all</Link>}
      {children}
    </div>
  </div>
);

const Index = () => {
  const { products } = useProducts();

  const featured = useMemo(() => {
    const list: Product[] = [];
    ["Phones", "Laptops", "Watches", "Audio", "Accessories"].forEach((cat) =>
      list.push(...products.filter((p) => p.category === cat).slice(0, 2)),
    );
    return list;
  }, [products]);

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Helmet><title>Toyes Tech | Phones & Gadgets in Nigeria</title></Helmet>
      <Navbar />
      <main>
        <HeroSection />
        <CategoryCircles />

        <section className="container py-12 md:py-16">
          <SectionHeader title="Popular right now" to="/shop">
            <div className="hidden gap-2 sm:flex">
              <button aria-label="Previous products" className="feat-prev flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-black/40 disabled:opacity-30">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button aria-label="Next products" className="feat-next flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-black/40 disabled:opacity-30">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </SectionHeader>
          <Swiper
            modules={[Navigation]}
            navigation={{ prevEl: ".feat-prev", nextEl: ".feat-next" }}
            spaceBetween={14}
            slidesPerView={1.6}
            breakpoints={{ 540: { slidesPerView: 2.4, spaceBetween: 18 }, 768: { slidesPerView: 3.3, spaceBetween: 20 }, 1100: { slidesPerView: 4.4, spaceBetween: 24 } }}
          >
            {featured.map((p, i) => (
              <SwiperSlide key={p.id} className="!h-auto"><ProductCard product={p} index={i} /></SwiperSlide>
            ))}
          </Swiper>
        </section>

        <DealsGrid />
        <InspectionSteps />
        <TabbedProducts />
        <BrandStrip />
      </main>
      <SocialBar />
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
