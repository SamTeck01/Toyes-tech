import { motion } from "framer-motion";
import { Star } from "@/components/icons";
import { testimonials } from "@/data/products";

const TestimonialSection = () => {
  return (
    <section className="container py-24 bg-gray-50/30">
      <div className="text-center mb-16">
        <span className="text-xs font-bold text-black/40 mb-4 block">Community Feedback</span>
        <h2 className="text-4xl font-bold tracking-tight">Trusted by Thousands.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-100 p-10 rounded-3xl flex flex-col items-center text-center shadow-sm"
          >
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < t.rating ? "fill-black text-black" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-sm font-medium leading-relaxed mb-8 italic">"{t.text}"</p>
            <div className="flex flex-col items-center gap-3">
              <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-50" />
              <div>
                <h4 className="text-xs font-bold">{t.name}</h4>
                <p className="text-xs text-black/40 font-bold">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialSection;
