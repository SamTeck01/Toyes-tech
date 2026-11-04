import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Product } from "@/data/products";

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  condition?: string;
  selectedColor?: string;
  selectedStorage?: string;
  selectedRAM?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product, 
    quantity: number, 
    unitPrice: number, 
    condition?: string, 
    color?: string, 
    storage?: string, 
    ram?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [isCartOpen, setCartOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("toyes-cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("toyes-cart", JSON.stringify(items));
    } catch { /* storage unavailable */ }
  }, [items]);

  const addToCart = (
    product: Product, 
    quantity = 1, 
    unitPrice: number, 
    condition?: string, 
    color?: string, 
    storage?: string, 
    ram?: string
  ) => {
    setItems((prev) => {
      // Create a unique composite ID for this exact variant configuration
      const cartItemId = `${product.id}-${condition || 'na'}-${color || 'na'}-${storage || 'na'}-${ram || 'na'}`;
      
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { 
        cartItemId, 
        product, 
        quantity, 
        unitPrice, 
        condition, 
        selectedColor: color, 
        selectedStorage: storage, 
        selectedRAM: ram 
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

