import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const slides = [
  {
    title: "Pristine \n iPhones",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=1200",
    link: "/shop?category=Phones"
  },
  {
    title: "Professional \n MacBooks",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200",
    link: "/shop?category=Laptops"
  },
  {
    title: "Premium \n Androids",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=1200",
    link: "/shop?category=Phones"
  }
];

const HeroSection = () => {
  return (
    <section className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[500px]">
        
        {/* Large Featured Panel (Left) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="md:col-span-2 relative rounded-3xl overflow-hidden bg-gray-50 flex group"
        >
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            className="w-full h-[300px] sm:h-[380px] md:h-full"
            style={{
              "--swiper-theme-color": "hsl(var(--primary))",
              "--swiper-pagination-bullet-inactive-color": "hsl(var(--primary))",
              "--swiper-pagination-bullet-inactive-opacity": "0.1",
              "--swiper-pagination-bullet-size": "6px",
              "--swiper-pagination-bottom": "24px"
            } as React.CSSProperties}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="absolute inset-0 z-0 after:absolute after:inset-0 after:bg-gradient-to-r after:from-white/90 after:via-white/50 after:to-transparent">
                  <img 
                    src={slide.image} 
                    alt={slide.title.replace(/\n/, "")} 
                    className="w-full h-full object-cover  group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
                
                <div className="relative z-10 p-10 md:p-16 max-w-sm h-full flex flex-col justify-center">
                  <span className="mb-4 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Toyes Tech · Verified quality</span>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-8 whitespace-pre-line text-black">
                    {slide.title}
                  </h1>
                  <div>
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-sm font-bold tracking-tight hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                    >
                      Shop now <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        {/* Right Stacked Panels */}
        <div className="flex flex-row md:flex-col gap-4 md:gap-6">
          
          {/* Top Panel: UK Used Devices */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 relative rounded-3xl overflow-hidden bg-primary group h-[160px] md:h-auto"
          >
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600" 
                alt="Premium UK Used" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="relative z-20 p-5 md:p-8 h-full flex flex-col justify-center">
              <span className="hidden md:block text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Grade A Condition</span>
              <h2 className="text-xl font-bold text-white mb-6">Premium UK Used</h2>
              <Link to="/shop?condition=UK Used" className="text-xs font-bold text-white/70 hover:text-white flex items-center gap-1 transition-colors">
                Shop Devices <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>

          {/* Bottom Panel: Accessories */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 relative rounded-3xl overflow-hidden bg-primary group h-[160px] md:h-auto"
          >
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=600" 
                alt="Accessories" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="relative z-20 p-5 md:p-8 h-full flex flex-col justify-center">
              <span className="hidden md:block text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Essential Add-ons</span>
              <h2 className="text-xl font-bold text-white mb-6">Watches & More</h2>
              <Link to="/shop?category=Watches" className="text-xs font-bold text-white/70 hover:text-white flex items-center gap-1 transition-colors">
                Shop Accessories <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
