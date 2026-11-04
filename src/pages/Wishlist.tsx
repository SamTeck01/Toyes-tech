import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Wishlist = () => {
  const { wishlistItems } = useWishlist();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container py-32 px-4 selection:bg-primary selection:text-primary-foreground">
        <header className="mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Your wishlist</h1>
            <p className="text-black/60 max-w-md text-sm leading-relaxed">
              Products you've saved for later.
            </p>
          </motion.div>
        </header>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-12 gap-y-12 md:gap-y-20">
            {wishlistItems.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 md:py-40 flex flex-col items-center text-center space-y-8"
          >
            <div className="w-20 h-20 rounded-full border border-black/5 flex items-center justify-center bg-gray-50/50">
              <Heart className="w-8 h-8 text-black/50" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h2>
              <p className="text-black/50 text-sm max-w-xs mx-auto">
                Tap the heart on any product to save it here.
              </p>
            </div>
            <Link 
              to="/" 
              className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all rounded-sm shadow-lg shadow-primary/10"
            >
              Start shopping
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
