import { useState, useEffect } from "react";
import { Search, ShoppingCart, Menu, X, ChevronDown, LayoutGrid, Heart, User } from "@/components/icons";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/format";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const navCategories = [
  { label: "Gadgets", to: "/shop?category=Gadgets" },
  { label: "Phones", to: "/shop?category=Phones" },
  { label: "Laptops", to: "/shop?category=Laptops" },
];

const subCategories = [
  { label: "All Categories", to: "/shop" },
  { label: "Gadgets", to: "/shop?category=Gadgets" },
  { label: "Phones", to: "/shop?category=Phones" },
  { label: "Laptops", to: "/shop?category=Laptops" },
  { label: "Audio", to: "/shop?category=Gadgets&type=Audio" },
  { label: "Gaming", to: "/shop?category=Gadgets&type=Gaming" },
  { label: "Smartwatches", to: "/shop?category=Gadgets&type=Smartwatches" },
  { label: "Chargers & Power", to: "/shop?category=Gadgets&type=Power%20%26%20Charging" }
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { totalItems } = useCart();
  const { products } = useProducts();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const suggestions = searchQuery.trim() 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setMenuOpen(false);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? "shadow-sm" : ""}`}>
      {/* Main Top Bar */}
      <div className="border-b border-gray-100">
        <div className="container flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <Logo />

          {/* Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-auto relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleSearch}
              placeholder="Search gadgets, phones, laptops..."
              className="w-full bg-gray-50 text-[13px] px-6 py-2.5 border border-transparent focus:border-black/10 focus:bg-white outline-none transition-all rounded-full"
            />
            <Search 
              className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 group-focus-within:text-black transition-colors px-0 bg-transparent cursor-pointer" 
              onClick={() => {
                if (searchQuery.trim()) {
                  navigate(`/shop?q=${searchQuery}`);
                  setShowSuggestions(false);
                }
              }} 
            />

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSuggestions(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-full mt-2 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden z-20"
                  >
                    <div className="p-2">
                       {suggestions.map((p) => (
                         <button
                           key={p.id}
                           onClick={() => handleSuggestionClick(p.id)}
                           className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                         >
                            <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                               <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                               <p className="text-[12px] font-bold tracking-tight group-hover:text-black">{p.name}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-black text-black/50">{p.brand}</span>
                                  <span className="text-[11px] font-black text-black/50">•</span>
                                  <span className="text-[11px] font-black italic tracking-tight">{formatPrice(p.price)}</span>
                               </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                               <ChevronDown className="w-4 h-4 -rotate-90 text-black/50" />
                            </div>
                         </button>
                       ))}
                       <button
                         onClick={() => {
                           navigate(`/shop?q=${searchQuery}`);
                           setShowSuggestions(false);
                         }}
                         className="w-full p-4 mt-2 border-t border-gray-50 text-xs font-black text-black/50 hover:text-black transition-colors text-center"
                       >
                          View all matching items
                       </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/account" className="hidden sm:flex items-center gap-2 text-xs font-semibold text-black/70 hover:text-black">
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">{user ? `Hi, ${user.name.split(" ")[0]}` : "Sign In"}</span>
            </Link>
            
            <Link to="/wishlist" className="hidden md:block relative group p-1 shrink-0" aria-label="Wishlist">
              <Heart className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
            </Link>
            
            <Link to="/cart" className="hidden md:block relative group p-1 shrink-0" aria-label="Cart">
              <ShoppingCart className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <motion.span 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            <button
              className="md:hidden p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden border-b border-gray-100 bg-white px-4 py-3 relative">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleSearch}
            placeholder="Search gadgets, phones, laptops..."
            className="w-full bg-gray-50 text-[13px] pl-10 pr-4 py-2.5 border border-transparent focus:border-black/10 focus:bg-white outline-none transition-all rounded-full"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 group-focus-within:text-black transition-colors" />
        </div>

        {/* Mobile Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-2xl z-[70] overflow-hidden"
            >
               <div className="p-4 space-y-4">
                  <span className="text-[11px] font-black text-black/50 block">Live Results</span>
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSuggestionClick(p.id)}
                      className="w-full flex items-center gap-4 text-left"
                    >
                       <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden">
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                       </div>
                       <div>
                          <p className="text-[11px] font-bold leading-none">{p.name}</p>
                          <p className="text-[11px] text-black/50 font-bold mt-1">{formatPrice(p.price)}</p>
                       </div>
                    </button>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Secondary Sub-Navbar (Desktop) */}
      <div className="hidden md:block border-b border-gray-100 bg-white">
        <div className="container flex items-center gap-8 h-12">
          <Link to="/shop" className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 hover:bg-black/90 transition-colors shrink-0 rounded-full">
            <LayoutGrid className="w-3 h-3" />
            All Categories
          </Link>
          
          <nav className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            {subCategories.slice(1).map((cat) => (
              <Link
                key={cat.label}
                to={cat.to}
                className="text-xs font-bold text-black/40 hover:text-black transition-colors whitespace-nowrap flex items-center gap-1"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-6">
             <Link to="/orders" className="text-xs font-bold text-black flex items-center gap-2">
               Track Order <ChevronDown className="w-3 h-3" />
             </Link>
             <Link to="/contact" className="text-xs font-bold text-black/40 hover:text-black">
               Help
             </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 top-32 bg-white z-[60] p-6 space-y-6 md:hidden overflow-y-auto"
          >
            <div className="space-y-4">
              <span className="text-xs font-bold text-black/40 block mb-4">Shop Categories</span>
              {subCategories.map((cat) => (
                <Link 
                  key={cat.label} 
                  to={cat.to} 
                  className="block text-2xl font-bold tracking-tight"
                  onClick={() => setMenuOpen(false)}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
              <Link to="/cart" className="text-xl font-bold" onClick={() => setMenuOpen(false)}>My Cart</Link>
              <Link to="/orders" className="text-xl font-bold" onClick={() => setMenuOpen(false)}>My Orders</Link>
              <Link to="/account" className="text-xl font-bold" onClick={() => setMenuOpen(false)}>{user ? "My Account" : "Login / Register"}</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
