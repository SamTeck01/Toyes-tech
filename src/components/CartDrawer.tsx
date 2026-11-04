import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, ShoppingBag, Truck } from "@/components/icons";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

/**
 * Slide-out mini cart. Opens when something is added so shoppers see it worked
 * and can keep browsing or go straight to checkout.
 */
const CartDrawer = () => {
  const { items, isCartOpen, setCartOpen, updateQuantity, removeFromCart, totalPrice, totalItems, addToCart } = useCart();
  const { products } = useProducts();

  // Suggest cheap gadgets that pair with what's in the cart (and aren't already in it).
  const addOns = useMemo(() => {
    const inCart = new Set(items.map((i) => i.product.id));
    return products
      .filter((p) => p.category === "Gadgets" && p.price <= 60000 && !inCart.has(p.id) && p.inStock)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }, [items, products]);

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-gray-100 px-5 py-4 text-left">
          <SheetTitle className="text-lg font-extrabold">Your cart ({totalItems})</SheetTitle>
          <SheetDescription className="sr-only">Items in your cart</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-black/30" />
            <p className="font-bold">Your cart is empty</p>
            <p className="text-sm text-black/55">Add a gadget, phone or laptop and it will show up here.</p>
            <Link to="/shop" onClick={() => setCartOpen(false)} className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.cartItemId} className="flex gap-3 py-4">
                    <Link to={`/product/${item.product.id}`} onClick={() => setCartOpen(false)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-bold">{item.product.name}</p>
                      <p className="text-xs text-black/50">
                        {[item.condition, item.selectedStorage, item.selectedColor].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-gray-200">
                          <button aria-label="Decrease quantity" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button aria-label="Increase quantity" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold">{formatPrice(item.unitPrice * item.quantity)}</span>
                          <button aria-label={`Remove ${item.product.name}`} onClick={() => removeFromCart(item.cartItemId)} className="p-1 text-black/40 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {addOns.length > 0 && (
                <div className="pb-4">
                  <p className="mb-3 text-sm font-bold">Add a little extra</p>
                  <div className="grid grid-cols-3 gap-2">
                    {addOns.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p, 1, p.price, p.condition)}
                        className="group rounded-xl border border-gray-100 p-2 text-left transition hover:border-primary/40"
                      >
                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold">{p.name}</p>
                        <p className="text-xs font-extrabold">{formatPrice(p.price)}</p>
                        <span className="text-[11px] font-bold text-primary">+ Add</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-5">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-black/60">Subtotal</span>
                <span className="text-lg font-extrabold">{formatPrice(totalPrice)}</span>
              </div>
              <p className="mb-4 flex items-center gap-1.5 text-xs text-black/55"><Truck className="h-3.5 w-3.5" /> Delivery is calculated at checkout</p>
              <Link to="/checkout" onClick={() => setCartOpen(false)} className="block rounded-full bg-primary py-3.5 text-center text-sm font-bold text-white transition hover:brightness-110">
                Checkout · {formatPrice(totalPrice)}
              </Link>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/cart" onClick={() => setCartOpen(false)} className="rounded-full border border-gray-200 py-3 text-center text-sm font-bold hover:border-black/40">
                  View cart
                </Link>
                <button onClick={() => setCartOpen(false)} className="rounded-full border border-gray-200 py-3 text-sm font-bold hover:border-black/40">
                  Keep shopping
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
