import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  const navItems = [
    { icon: Home, label: "Home", to: "/" },
    { icon: Heart, label: "Wishlist", to: "/wishlist" },
    { icon: ShoppingCart, label: "Cart", to: "/cart", badge: totalItems },
    { icon: User, label: "Account", to: "/account" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? "text-primary" : "text-black/40 hover:text-black/80"
              }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? "fill-primary" : ""}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>
              <span className={`text-[11px] font-bold ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
