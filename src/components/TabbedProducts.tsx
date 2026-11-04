import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/context/ProductContext";
import { categories } from "@/data/products";
import ProductCard from "./ProductCard";

const TabbedProducts = () => {
  const { products } = useProducts();
  const [activeTab, setActiveTab] = useState("Phones");
  const filtered = products.filter(p => p.category === activeTab);

  return (
    <section className="container py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 mb-3 block">Market Overview</span>
          <h2 className="text-4xl font-bold tracking-tighter">Explore Our Selection</h2>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto pb-2 border-b border-gray-50">
          {["Phones", "Laptops", "Watches", "Accessories", "Audio"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`text-xs font-bold uppercase tracking-widest px-6 py-3 transition-all ${
                activeTab === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-gray-50 text-black/40 hover:bg-gray-100 hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-10 gap-y-10 sm:gap-y-16">
        <AnimatePresence mode="wait">
          {filtered.slice(0, 8).map((product, i) => (
            <motion.div
              key={product.id + activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={product} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TabbedProducts;
