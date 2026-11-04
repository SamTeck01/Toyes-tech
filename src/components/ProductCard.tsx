import { ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/data/products";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

interface Props {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: Props) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, product.price, product.condition);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const outOfStock = !product.inStock || product.stock <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
      className="h-full"
    >
      <Link to={`/product/${product.id}`} className="group flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {discount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">-{discount}%</span>
            )}
            {product.badge && (
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-black shadow-sm">{product.badge}</span>
            )}
          </div>

          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
          >
            <Heart className={`h-4 w-4 transition-all ${wishlisted ? "fill-red-500 text-red-500" : "text-black/50"}`} />
          </button>

          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">Out of stock</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-black/50">
            <span className="font-semibold">{product.brand}</span>
            {product.condition && (
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${product.condition === "New" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {product.condition}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-black group-hover:text-primary">
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div>
              <span className="block text-base font-extrabold text-black">{formatPrice(product.price)}</span>
              {discount > 0 && (
                <span className="text-xs text-black/40 line-through">{formatPrice(product.originalPrice!)}</span>
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/20 transition hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
