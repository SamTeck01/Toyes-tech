import { motion } from "framer-motion";

const brands = [
  "Apple", "Samsung", "Google", "Microsoft", "Sony", "Logitech", "Dell", "Asus"
];

const BrandStrip = () => {
  return (
    <section className="container py-24 border-t border-gray-50">
       <div className="flex flex-col items-center gap-12">
         <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/50">Authorized Selection Partners</span>
         <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           {brands.map((brand, i) => (
             <motion.span
               key={brand}
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               transition={{ delay: i * 0.05 }}
               className="text-xl md:text-2xl font-bold tracking-tighter"
             >
               {brand}
             </motion.span>
           ))}
         </div>
       </div>
    </section>
  );
};

export default BrandStrip;
