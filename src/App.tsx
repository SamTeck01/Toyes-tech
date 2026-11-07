import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistProvider } from "@/context/WishlistContext";
import { OrderProvider } from "./context/OrderContext";
import { ReviewProvider } from "./context/ReviewContext";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Shop from "./pages/Shop";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";
import ScrollToTop from "./components/ScrollToTop";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import { AuthProvider } from "./context/AuthContext";

// Admin area is code-split so shoppers don't download it.
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const PosApp = lazy(() => import("./pages/pos/PosApp"));
const HQArea = lazy(() => import("./pages/hq/HQArea"));

import { ThemeProvider } from "./context/ThemeContext";
import { ThemeWatcher } from "./components/ThemeWatcher";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
          <ReviewProvider>
            <ProductProvider>
              <OrderProvider>
                <WishlistProvider>
                  <CartProvider>
                    <Toaster />
                    <Sonner position="top-right" />
                    <BrowserRouter>
                      <ThemeWatcher />
                      <ScrollToTop />
                      <CartDrawer />
                      <WhatsAppButton />
                      <Suspense fallback={<div className="min-h-screen" />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/track/:id" element={<OrderTracking />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/account" element={<Account />} />
                      
                      {/* Admin Routes */}
                      {/* Website order/review tools (owner) */}
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/reviews" element={<AdminReviews />} />
                      {/* HQ: owner and managers, backed by the cloud database */}
                      <Route path="/admin/*" element={<HQArea />} />
                      <Route path="/pos" element={<PosApp />} />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                      </Suspense>
                  </BrowserRouter>
                </CartProvider>
              </WishlistProvider>
            </OrderProvider>
          </ProductProvider>
        </ReviewProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
</HelmetProvider>
);

export default App;
