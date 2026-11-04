import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container pt-10 pb-32">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors mb-4">
                <ArrowLeft className="w-3 h-3" /> Continue Shopping
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">
                Shopping Bag <span className="text-black/50 ml-2">[{totalItems}]</span>
              </h1>
            </div>
            {items.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-xs font-bold uppercase tracking-widest text-black/50 hover:text-red-500 transition-colors pb-1 border-b border-transparent hover:border-red-500"
              >
                Clear Bag
              </button>
            )}
          </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 border border-gray-100 rounded-[40px] bg-gray-50/30"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
              <ShoppingBag className="w-8 h-8 text-black/50" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-3">Your bag is empty.</h2>
            <p className="text-black/40 text-sm mb-10 max-w-xs text-center leading-relaxed">
              Looks like you haven't added anything to your selection yet. Explore our curated gadgets.
            </p>
            <Link
              to="/"
              className="bg-primary text-primary-foreground px-12 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all hover:scale-105"
            >
              Browse Selection
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="space-y-1">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.cartItemId}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group flex gap-4 sm:gap-8 py-6 sm:py-8 border-b border-gray-50 last:border-0"
                    >
                      {/* Product Image */}
                      <Link 
                        to={`/product/${item.product.id}`} 
                        className="shrink-0 bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 w-24 sm:w-40 aspect-[4/5] flex items-center justify-center relative overflow-hidden"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.condition && (
                          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-black shadow-sm">
                            {item.condition}
                          </span>
                        )}
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col pt-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-black/40 mb-0.5 sm:mb-1 block truncate">
                              {item.product.brand}
                            </span>
                            <Link to={`/product/${item.product.id}`}>
                              <h3 className="text-sm sm:text-lg font-bold tracking-tight hover:opacity-60 transition-opacity mb-2 leading-snug">
                                {item.product.name}
                              </h3>
                            </Link>
                            
                            {/* Variant Badges */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {item.selectedStorage && (
                                <span className="bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-black/60 rounded-sm">
                                  {item.selectedStorage}
                                </span>
                              )}
                              {item.selectedRAM && (
                                <span className="bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-black/60 rounded-sm">
                                  {item.selectedRAM} RAM
                                </span>
                              )}
                              {item.selectedColor && (
                                <span className="bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-[11px] font-bold uppercase tracking-widest text-black/60 rounded-sm flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-black/10 inline-block" style={{ backgroundColor: item.product.colors?.find(c => c.name === item.selectedColor)?.hex || '#ccc' }}></span>
                                  {item.selectedColor}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="p-1 text-black/50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity and Price Row */}
                        <div className="flex items-center justify-between mt-auto pt-4">
                          <div className="flex items-center border border-gray-100 rounded-sm">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              className="px-2.5 py-2 sm:px-4 sm:py-3 hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="w-6 sm:w-10 text-center text-xs sm:text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              className="px-2.5 py-2 sm:px-4 sm:py-3 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-sm sm:text-lg font-bold tracking-tight">
                              {formatPrice((item.unitPrice || item.product.price) * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <span className="text-[11px] sm:text-xs text-black/40 font-medium tracking-tight">
                                {formatPrice(item.unitPrice || item.product.price)} / unit
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Total Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
              <div className="bg-gray-50 rounded-3xl p-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 pb-4 border-b border-gray-100">Order Summary</h2>
                <div className="space-y-6 text-sm mb-12">
                  <div className="flex justify-between font-medium">
                    <span className="text-black/40">Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-black/40">Delivery</span>
                    <span className="text-green-600 font-bold uppercase text-xs tracking-widest">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold tracking-tight pt-6 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                
                <Link to="/checkout" className="block w-full bg-primary text-primary-foreground py-5 text-center text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all mb-6">
                  Checkout Now
                </Link>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-black/50 uppercase tracking-widest">
                   <ShieldCheck className="w-3 h-3" /> Secure Payment
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Mobile Checkout Bar */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 flex items-center justify-between gap-4 backdrop-blur-xl bg-white/90">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-black/40">Total Amount</span>
            <span className="text-lg font-bold tracking-tight">{formatPrice(totalPrice)}</span>
          </div>
          <Link 
            to="/checkout" 
            className="flex-1 bg-primary text-primary-foreground py-4 text-center text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            Checkout Now
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cart;
