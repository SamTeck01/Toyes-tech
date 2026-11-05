import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Star, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  User,
  CreditCard,
  TrendingUp
} from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = localStorage.getItem("toyes_admin_session");
    if (session !== "active") {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("toyes_admin_session");
    toast.info("Session terminated.");
    navigate("/admin/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin/dashboard" },
    { icon: CreditCard, label: "Point of Sale", path: "/admin/pos" },
    { icon: TrendingUp, label: "In-store sales", path: "/admin/sales" },
    { icon: ShoppingBag, label: "Online orders", path: "/admin/orders" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: Star, label: "Reviews", path: "/admin/reviews" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans">
      {/* Sidebar - Desktop */}
      <aside 
        className={`bg-white border-r border-gray-100 transition-all duration-300 hidden md:flex flex-col sticky top-0 h-screen ${
          isSidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <div className="p-8 pb-12 flex items-center justify-between">
          {isSidebarOpen ? (
            <Link to="/" className="text-xl font-black tracking-tight">Toyes<span className="text-primary">Tech</span> <span className="text-black/50 text-sm font-semibold">Admin</span></Link>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg mx-auto" />
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                location.pathname === item.path 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                  : "text-black/40 hover:bg-gray-50 hover:text-primary"
              }`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? "text-white" : "group-hover:text-black"}`} />
              {isSidebarOpen && (
                <span className="text-xs font-bold">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl text-red-500 hover:bg-red-50 transition-all group"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && (
              <span className="text-xs font-bold">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 py-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
               className="hidden md:flex p-2 hover:bg-gray-50 rounded-xl transition-colors"
             >
                <Menu className="w-5 h-5 text-black/40" />
             </button>
             <button 
               onClick={() => setIsMobileMenuOpen(true)} 
               className="md:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors"
             >
                <Menu className="w-5 h-5 text-primary" />
             </button>
             <div className="h-4 w-px bg-gray-100 mx-2 hidden md:block" />
             <h2 className="text-xs font-bold text-black/50">
               {menuItems.find(i => i.path === location.pathname)?.label || "Overview"}
             </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold">System Admin</span>
              <span className="text-[11px] text-green-500 font-bold">Online</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-4 ring-primary/5">
               <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-8 max-w-[1600px] w-full mx-auto">
           {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-[60] md:hidden p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                 <Link to="/" className="text-xl font-black tracking-tight">Toyes<span className="text-primary">Tech</span></Link>
                 <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-6 h-6 text-black/40" />
                 </button>
              </div>

              <nav className="flex-1 space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${
                      location.pathname === item.path 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                        : "bg-gray-50 text-black/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold">{item.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${location.pathname === item.path ? "text-white/40" : "text-black/10"}`} />
                  </Link>
                ))}
              </nav>

              <button 
                onClick={handleLogout}
                className="mt-auto flex items-center gap-4 px-6 py-5 w-full rounded-2xl text-red-500 bg-red-50 font-bold text-[11px]"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;
