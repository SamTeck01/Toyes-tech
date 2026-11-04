import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Truck, RefreshCcw, Headset, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import CategoryCircles from "@/components/CategoryCircles";
import DealsGrid from "@/components/DealsGrid";
import TabbedProducts from "@/components/TabbedProducts";
import TestimonialSection from "@/components/TestimonialSection";
import BrandStrip from "@/components/BrandStrip";
import SocialBar from "@/components/SocialBar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useProducts } from "@/context/ProductContext";
import { Product } from "@/data/products";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const Index = () => {
  const { products } = useProducts();
  
  const featuredSelection = useMemo(() => {
    // Generate a diverse list of featured products
    const targetCategories = ["Phones", "Laptops", "Watches", "Accessories", "Audio"];
    const diverseProducts: Product[] = [];
    
    // Grab 2 products from each major category
    targetCategories.forEach(cat => {
      diverseProducts.push(...products.filter(p => p.category === cat).slice(0, 2));
    });
    
    // Fill the rest up to 10 if we run short
    if (diverseProducts.length < 10) {
      const remaining = products.filter(p => !diverseProducts.some(d => d.id === p.id)).slice(0, 10 - diverseProducts.length);
      diverseProducts.push(...remaining);
    }
    
    return diverseProducts;
  }, [products]);

  const exploreSelection = useMemo(() => {
    // Return products that aren't already in featured selection to prevent immediate duplication
    return products.filter(p => !featuredSelection.some(f => f.id === p.id)).slice(0, 8);
  }, [featuredSelection, products]);

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0 font-sans">
      <Helmet><title>Toyes Tech | Phones, Laptops & Gadgets in Nigeria</title></Helmet>
      <Navbar />
      
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Popular Categories Icons */}
      <CategoryCircles />

      {/* 3. Featured Products / New Arrivals (Swiper Carousel) */}
      <section className="container py-16 md:py-24 overflow-hidden">
        <div className="flex items-end justify-between mb-16 px-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 mb-3 block">Handpicked for you</span>
            <h2 className="text-4xl font-bold tracking-tighter">Featured Products</h2>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/shop" className="hidden md:flex text-xs font-bold uppercase tracking-[0.2em] items-center gap-2 hover:opacity-50 transition-opacity">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
            <div className="flex gap-2">
              <button className="swiper-feat-prev w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-5 h-5 rotate-180 text-black/70" />
              </button>
              <button className="swiper-feat-next w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="w-5 h-5 text-black/70" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="w-full relative px-2">
          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: '.swiper-feat-prev',
              nextEl: '.swiper-feat-next',
            }}
            spaceBetween={16}
            slidesPerView={1.3}
            breakpoints={{
              540: { slidesPerView: 2.2, spaceBetween: 24 },
              768: { slidesPerView: 3.2, spaceBetween: 24 },
              1024: { slidesPerView: 4.2, spaceBetween: 32 },
              1280: { slidesPerView: 4.5, spaceBetween: 40 },
            }}
            className="w-full !overflow-visible"
          >
            {featuredSelection.map((product, i) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} index={i} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* 4. Best Deals (1 Big + 4 Small) */}
      <DealsGrid />

      {/* 5. Explore Our Selection Grid */}
      <section className="container py-16 md:py-24 bg-gray-50/70 rounded-3xl md:rounded-[48px] my-12">
        <div className="text-center mb-16 px-2">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 mb-3 block">More to love</span>
          <h2 className="text-4xl font-bold tracking-tighter">Explore Our Selection</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-10 gap-y-10 sm:gap-y-16">
          {exploreSelection.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>

      {/* 6. Testimonials */}
      <TestimonialSection />

      {/* 7. Tabbed Category Browsing (Top New Arrivals) */}
      <TabbedProducts />

      {/* 8. Flash Sale Banner (Minimalist) */}
      <section className="container py-24 px-4 overflow-hidden hidden sm:block">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary rounded-[40px] py-16 px-10 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
               <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
               <span className="text-primary-foreground text-sm font-bold uppercase tracking-[0.15em]">Limited-time deals</span>
            </div>
            <h2 className="text-primary-foreground text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">FLASH<br/>SALE.</h2>
            <p className="text-primary-foreground/80 text-lg max-w-sm mb-10 leading-relaxed font-medium">Big savings on phones, laptops and accessories while stock lasts.</p>
            <Link to="/shop" className="bg-primary-foreground text-primary px-14 py-5 rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all inline-block hover:scale-105 active:scale-95">
              Shop the sale
            </Link>
          </div>
          <div className="relative z-10 opacity-40 select-none hidden lg:block">
             <span className="text-[200px] font-black italic tracking-tighter leading-none text-white/5 whitespace-nowrap">FLASH SALE</span>
          </div>
        </motion.div>
      </section>

      {/* 9. Trust Badges & Recently Viewed (Powered by Brands) */}
      <section className="container py-24 mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 border-t border-gray-100 pt-24 mb-32">
          {[
            { icon: Truck, title: "Nationwide Delivery", desc: "Fast & secure across Nigeria" },
            { icon: ShieldCheck, title: "Warranty Included", desc: "On every device we sell" },
            { icon: RefreshCcw, title: "7-Day Returns", desc: "Hassle-free replacements" },
            { icon: Headset, title: "24/7 Support", desc: "Dedicated tech experts" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                 <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                 <h3 className="text-xs font-bold uppercase tracking-widest mb-1">{item.title}</h3>
                 <p className="text-[11px] text-black/40 font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <BrandStrip />
      </section>

      {/* 10. Social & Newsletter Bar */}
      <SocialBar />

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
