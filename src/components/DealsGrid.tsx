import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const DealsGrid = () => {
  const { products } = useProducts();
  const bigDeal = products.find(p => p.id === "p1") || products[0];
  const smallDeals = products.slice(1, 4);
  const extraDeal = products[4] || products[0];

  if (!products.length) return null;

  return (
    <section className="container py-24">
      <div className="flex items-end justify-between mb-12">
        <h2 className="text-3xl font-bold tracking-tighter">Today's Best Deals</h2>
        <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black">View All Deals</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Big Card */}
        <Link to={`/product/${bigDeal.id}`} className="lg:col-span-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="h-full bg-gray-50 rounded-3xl p-10 flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4 block">Premium Selection</span>
              <h3 className="text-4xl font-bold tracking-tighter mb-4">{bigDeal.name}</h3>
              <p className="text-black/40 text-sm max-w-xs">{bigDeal.description}</p>
            </div>
            
            <div className="mt-8">
               <img src={bigDeal.image} alt="" className="w-full h-64 object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="flex items-center justify-between mt-10">
               <div className="flex items-center gap-3">
                 <span className="text-2xl font-bold">{formatPrice(bigDeal.price)}</span>
                 {bigDeal.originalPrice && <span className="text-sm text-black/50 line-through">{formatPrice(bigDeal.originalPrice)}</span>}
               </div>
               <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
                 <ArrowUpRight className="w-5 h-5" />
               </div>
            </div>
          </motion.div>
        </Link>

        {/* Small Cards Grid */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
          {[...smallDeals, extraDeal].map((deal, i) => (
            <Link to={`/product/${deal.id}`} key={deal.id + i}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="h-full bg-gray-50/50 border border-gray-100 rounded-3xl p-4 sm:p-6 group cursor-pointer flex flex-col"
              >
                <div className="flex-1 flex items-center justify-center mb-4 sm:mb-6">
                  <img src={deal.image} alt="" className="w-full aspect-square object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold truncate mb-1">{deal.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">{formatPrice(deal.price)}</span>
                    <div className="hidden sm:flex w-8 h-8 rounded-full border border-gray-100 items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsGrid;
