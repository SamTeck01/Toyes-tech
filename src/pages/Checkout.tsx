import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, ShieldCheck, ChevronLeft, CreditCard, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/format";

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    firstName: user?.name.split(" ")[0] ?? "",
    lastName: user?.name.split(" ").slice(1).join(" ") ?? "",
    address: user?.address ?? "",
    city: user?.city ?? "",
    state: user?.state ?? ""
  });

  // Redirect if empty cart and haven't succeeded
  useEffect(() => {
    if (items.length === 0 && !isSuccess) {
      navigate('/cart');
    }
  }, [items, isSuccess, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock Paystack Processing Delay
    setTimeout(() => {
      const newOrderId = addOrder({
        items: items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.unitPrice || item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          selectedStorage: item.selectedStorage
        })),
        total: totalPrice,
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          address: `${formData.address}, ${formData.city}, ${formData.state}`
        }
      });

      setOrderId(newOrderId);
      setIsSubmitting(false);
      setIsSuccess(true);
      clearCart();
      toast.success("Payment processed successfully via Paystack");
      window.scrollTo(0, 0);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container flex flex-col items-center justify-center py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-md w-full"
          >
            <div className="flex justify-center mb-10">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tighter mb-4">You're All Set.</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/50 mb-8">Order ID: {orderId}</p>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-12 text-left">
              <div className="flex items-center gap-3 mb-4 text-green-600">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Confirmation Sent</span>
              </div>
              <p className="text-[11px] text-black/50 leading-relaxed italic">
                A digital receipt and tracking link have been dispatched to <span className="text-black font-bold uppercase tracking-tight">{formData.email}</span>. Please check your inbox shortly.
              </p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => navigate(`/track/${orderId}`)}
                className="block w-full bg-primary text-primary-foreground py-4 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10"
              >
                Track Live Status <ArrowRight className="w-3 h-3" />
              </button>
              <Link 
                to="/orders" 
                className="block w-full border border-gray-100 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                View Order History
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container pt-10 pb-32">
        <div className="mb-12">
          <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors mb-6">
            <ChevronLeft className="w-3 h-3" /> Back to Cart
          </Link>
          <h1 className="text-4xl font-bold tracking-tighter">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* Contact Info */}
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Email Address</label>
                    <input required name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Phone Number</label>
                    <input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+234 XXX XXXX" className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
              </section>

              {/* Delivery Details */}
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4">Delivery Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">First Name</label>
                    <input required name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Last Name</label>
                    <input required name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">Street Address</label>
                    <input required name="address" type="text" value={formData.address} onChange={handleInputChange} placeholder="House number and street name" className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">City</label>
                    <input required name="city" type="text" value={formData.city} onChange={handleInputChange} className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40">State / Region</label>
                    <select required name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-gray-200 p-4 text-xs focus:outline-none focus:border-primary transition-colors bg-white appearance-none">
                      <option value="" disabled selected>Select State</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Oyo">Oyo</option>
                      <option value="Other">Other Region</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-100 pb-4">Payment Method</h2>
                
                <div className="border border-primary rounded-lg p-6 bg-gray-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CreditCard className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-[5px] border-primary flex items-center justify-center"></div>
                        <span className="font-bold">Paystack Secure Payment</span>
                      </div>
                      <span className="bg-[#0BA4DB]/10 text-[#0BA4DB] text-xs font-bold uppercase tracking-widest px-2 py-1 rounded">Paystack</span>
                    </div>
                    <p className="text-xs text-black/60 pl-8 mb-4 line-clamp-2">
                      After clicking "Pay Now", you will be securely redirected to Paystack to complete your purchase via Card, USSD, or Bank Transfer.
                    </p>
                    <div className="pl-8 flex gap-2">
                       <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold text-black/40">VISA</div>
                       <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold text-black/40">MASTERCARD</div>
                       <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-bold text-black/40">TRANSFER</div>
                    </div>
                  </div>
                </div>

              </section>

              {/* Submit / Pay Now */}
              <div className="pt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground py-5 text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-primary/10"
                >
                  {isSubmitting ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>Pay {formatPrice(totalPrice)} Securely</>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-black/50 uppercase tracking-widest mt-6">
                   <ShieldCheck className="w-4 h-4" /> End-to-end encrypted by Paystack
                </div>
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-gray-50 rounded-3xl p-8 sticky top-32">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 pb-4 border-b border-gray-100">Order Summary</h2>
              
              <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="w-16 h-20 bg-white rounded-lg p-2 shrink-0 relative flex items-center justify-center">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain mix-blend-multiply" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 py-1 flex flex-col justify-between">
                      <h3 className="text-xs font-bold leading-tight">{item.product.name}</h3>
                      <div className="text-[11px] text-black/50 font-medium space-x-1">
                        {item.selectedStorage && <span>{item.selectedStorage}</span>}
                        {item.condition && <span>• {item.condition}</span>}
                      </div>
                      <p className="text-xs font-bold">{formatPrice((item.unitPrice || item.product.price) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm mb-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-black/60 font-medium text-xs">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-black/60 font-medium text-xs">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold uppercase tracking-widest">Free</span>
                </div>
                <div className="flex justify-between text-base font-bold tracking-tight pt-4 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
