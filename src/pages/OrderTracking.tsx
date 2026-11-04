import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrders, OrderStatus } from "@/context/OrderContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus } = useOrders();
  const order = getOrderById(id || "");

  if (!order) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container py-32 text-center">
           <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
           <Link to="/orders" className="text-sm border-b border-black pb-1">Back to Orders</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const stages: { status: OrderStatus; label: string; icon: LucideIcon; desc: string }[] = [
    { 
      status: "packing", 
      label: "Packing", 
      icon: Package, 
      desc: "Order is being verified and prepared." 
    },
    { 
      status: "transporting", 
      label: "Transporting", 
      icon: Truck, 
      desc: "Package is currently with the courier." 
    },
    { 
      status: "reached", 
      label: "Reached", 
      icon: MapPin, 
      desc: "Shipment has arrived at your local center." 
    },
    { 
      status: "completed", 
      label: "Order Complete", 
      icon: CheckCircle2, 
      desc: "Delivered and confirmed." 
    },
  ];

  const currentStageIndex = stages.findIndex(s => s.status === order.status);

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      updateOrderStatus(order.id, stages[currentStageIndex + 1].status);
      toast.success(`Demo: Order moved to ${stages[currentStageIndex + 1].label}`);
    }
  };

  const handleConfirmOrder = () => {
    updateOrderStatus(order.id, "completed");
    toast.success("Order confirmed as received!");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container py-12 px-4 max-w-5xl mx-auto">
        <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors mb-12">
          <ChevronLeft className="w-3 h-3" /> Back to Orders
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Timeline & Progress */}
          <div className="lg:col-span-8">
            <header className="mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/40 mb-3 block">Live Acquisition Status</span>
              <h1 className="text-5xl font-bold tracking-tighter mb-4">Tracking ID: {order.id}</h1>
              <div className="flex items-center gap-3 text-green-600">
                 <Zap className="w-4 h-4 fill-green-600" />
                 <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Live Updates Active</span>
              </div>
            </header>

            {/* Timeline */}
            <div className="space-y-12 relative">
              {/* Vertical line background */}
              <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gray-100" />
              
              {stages.map((stage, i) => {
                const isPast = i < currentStageIndex;
                const isCurrent = i === currentStageIndex;
                const isFuture = i > currentStageIndex;

                return (
                  <motion.div 
                    key={stage.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex gap-8 relative z-10 ${isFuture ? "opacity-30" : "opacity-100"}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isPast ? "bg-primary border-primary text-primary-foreground" : 
                      isCurrent ? "bg-white border-primary text-primary scale-110 shadow-lg" : 
                      "bg-white border-gray-100 text-gray-300"
                    }`}>
                      <stage.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold tracking-tight mb-1 ${isCurrent ? "text-black" : "text-black/60"}`}>
                        {stage.label}
                      </h3>
                      <p className="text-xs text-black/40 leading-relaxed max-w-sm">
                        {isCurrent ? stage.desc : isPast ? "Step completed successfully." : "Awaiting this stage."}
                      </p>
                      {isCurrent && stage.status === "reached" && (
                        <button 
                          onClick={handleConfirmOrder}
                          className="mt-6 bg-primary text-primary-foreground px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/10"
                        >
                          Confirm Order Receipt
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4">
            <div className="space-y-8 sticky top-32">
              
              {/* Order Summary Card */}
              <div className="bg-gray-50 rounded-[40px] p-8 border border-gray-100">
                <h2 className="text-xs font-bold uppercase tracking-widest mb-8 pb-4 border-b border-gray-100">Shipment Details</h2>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-black/50 block mb-2">Deliver To</span>
                    <p className="text-xs font-bold leading-relaxed">{order.customer.name}</p>
                    <p className="text-xs text-black/50 leading-relaxed italic">{order.customer.address}</p>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-black/50 block mb-2">Package Contents</span>
                    <div className="space-y-3">
                       {order.items.map((item, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg p-1 border border-gray-100 shrink-0">
                               <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[11px] font-bold truncate">{item.name}</span>
                            <span className="text-xs text-black/50 font-bold ml-auto">x{item.quantity}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Simulation Tool (MOCK) */}
              <div className="bg-yellow-50/50 rounded-[40px] p-8 border border-yellow-100/50 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck className="w-20 h-20" />
                 </div>
                 <div className="relative z-10">
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-yellow-700/60 mb-6 font-mono italic">--- Admin Demo Mode ---</h3>
                    <p className="text-xs text-yellow-700/50 mb-6 font-medium leading-relaxed">
                      Use these controls to simulate the Admin moving the order through its lifecycle. This will trigger the "Email Sent" notifications.
                    </p>
                    <button 
                      onClick={handleNextStage}
                      disabled={currentStageIndex >= stages.length - 1}
                      className="w-full bg-yellow-700 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                    >
                      Process Stage <ArrowRight className="w-3 h-3" />
                    </button>
                    <div className="flex items-center gap-2 justify-center text-[11px] font-bold text-yellow-700/30 uppercase tracking-widest">
                       <Mail className="w-3 h-3" /> Triggers Simulated Email
                    </div>
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

export default OrderTracking;
