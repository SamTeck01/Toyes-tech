import { useOrders } from "@/context/OrderContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Clock, MapPin } from "@/components/icons";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

const Orders = () => {
  const { orders } = useOrders();

  const statusColors = {
    packing: "bg-blue-50 text-blue-600",
    transporting: "bg-yellow-50 text-yellow-600",
    reached: "bg-purple-50 text-purple-600",
    completed: "bg-green-50 text-green-600",
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            
            <h1 className="text-5xl font-bold tracking-tight">Your orders</h1>
          </header>

          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-black/5 transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    {/* Info */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black/40">ID: {order.id}</span>
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-6">
                        <div className="flex -space-x-4">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="w-16 h-16 bg-white border border-gray-50 rounded-2xl p-2 shrink-0">
                               <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-16 h-16 bg-gray-50 border border-gray-50 rounded-2xl flex items-center justify-center text-xs font-bold text-black/50">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold mb-1">
                            {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
                          </p>
                          <p className="text-xs text-black/40 flex items-center gap-2">
                             <Clock className="w-3 h-3" /> {new Date(order.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col justify-between items-end gap-4 shrink-0">
                      <div className="text-right">
                         <span className="text-xs font-bold text-black/50 block mb-1">Total Amount</span>
                         <span className="text-xl font-bold">{formatPrice(order.total)}</span>
                      </div>
                      <Link 
                        to={`/track/${order.id}`}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
                      >
                        Track Shipment <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-black/50" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">No orders yet</h2>
              <p className="text-black/40 max-w-xs text-sm">Orders you place will appear here, with live tracking.</p>
              <Link to="/shop" className="mt-8 text-xs font-bold border-b border-primary text-primary pb-1">Start shopping</Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
