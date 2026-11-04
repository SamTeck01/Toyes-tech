import { motion } from "framer-motion";
import { Smartphone, Laptop, MousePointer2, Watch, Home, Headphones } from "lucide-react";

import { useNavigate } from "react-router-dom";

const cats = [
  { name: "Phones", icon: Smartphone },
  { name: "Laptops", icon: Laptop },
  { name: "Watches", icon: Watch },
  { name: "Accessories", icon: MousePointer2 },
  { name: "Audio", icon: Headphones },
];

const CategoryCircles = () => {
  const navigate = useNavigate();

  return (
    <section className="container py-8 md:py-12">
      <h3 className="text-xl font-bold tracking-tighter mb-4 md:hidden">Featured Categories</h3>
      <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-between gap-6 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cats.map((cat, i) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            onClick={() => navigate(`/shop?category=${cat.name}`)}
            className="flex flex-col items-center gap-4 group min-w-[100px]"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
              <cat.icon className="w-8 h-8 text-black/40 group-hover:text-primary-foreground transition-colors" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-black/40 group-hover:text-primary transition-colors">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default CategoryCircles;
