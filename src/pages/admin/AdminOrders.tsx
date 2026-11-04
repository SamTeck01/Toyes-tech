import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  CheckCircle2, 
  Truck, 
  Package, 
  XCircle,
  Mail,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  User,
  Star
} from "@/components/icons";
import AdminLayout from "@/components/admin/AdminLayout";
import { useOrders, OrderStatus, Order } from "@/context/OrderContext";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

const AdminOrders = () => {
  const { orders, updateOrderStatus } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} updated to ${newStatus.toUpperCase()}`);
    if (selectedOrder?.id === orderId) {
       setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "packing": return "bg-blue-50 text-blue-600";
      case "transporting": return "bg-orange-50 text-orange-600";
      case "reached": return "bg-indigo-50 text-indigo-600";
      case "completed": return "bg-green-50 text-green-600";
      default: return "bg-gray-100 text-black/40";
    }
  };

  const dashboardStats = [
    { label: "Pending", count: orders.filter(o => o.status === "packing").length, color: "text-blue-500" },
    { label: "Transit", count: orders.filter(o => o.status === "transporting").length, color: "text-orange-500" },
    { label: "Reached", count: orders.filter(o => o.status === "reached").length, color: "text-indigo-500" },
    { label: "Completed", count: orders.filter(o => o.status === "completed").length, color: "text-green-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 uppercase-none">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-black/40 text-[11px] font-bold mt-1">Track and manage customer orders</p>
          </div>
          
          <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm overflow-hidden min-w-[320px]">
             {dashboardStats.map((stat, i) => (
               <div key={stat.label} className={`flex-1 flex flex-col items-center py-3 px-4 ${i !== 0 ? 'border-l border-gray-50' : ''}`}>
                  <span className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.count}</span>
                  <span className="text-[11px] font-black text-black/50 tracking-tight">{stat.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
            <input 
              type="text"
              placeholder="Search by ID, Customer Name or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50/50 border border-transparent focus:border-black/10 focus:bg-white outline-none rounded-2xl py-4 flex items-center px-14 text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50/50 border border-transparent focus:border-black/10 px-8 py-4 outline-none rounded-2xl text-xs font-bold text-black/40 w-full cursor-pointer transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="packing">Packing</option>
              <option value="transporting">In Transit</option>
              <option value="reached">Reached Gateway</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table Sections */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-primary/5 overflow-hidden flex flex-col min-h-[600px]">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-10 py-6 text-left text-[11px] font-black text-black/50">Order Info</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-black/50">Customer</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-black/50">Price</th>
                  <th className="px-10 py-6 text-left text-[11px] font-black text-black/50">Status</th>
                  <th className="px-10 py-6 text-right text-[11px] font-black text-black/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((order, i) => (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedOrder(order)}
                    className="group border-b border-gray-50 last:border-none transition-all cursor-pointer hover:bg-gray-50/80"
                  >
                    <td className="px-10 py-8">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold tracking-tight">{order.id}</span>
                          <span className="text-xs text-black/50 font-bold mt-0.5">{new Date(order.date).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xs font-bold text-black/40">
                             {order.customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[11px] font-bold">{order.customer.name}</span>
                             <span className="text-xs text-black/50 font-medium lowercase italic">{order.customer.email}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <span className="text-[11px] font-black italic tracking-tight">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3">
                          <span className={`px-5 py-2 rounded-full text-[11px] font-black ${getStatusColor(order.status)}`}>
                             {order.status}
                          </span>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                         <div className="w-10 h-10 rounded-2xl bg-gray-50 text-black/50 flex items-center justify-center transition-all">
                            <ChevronRight className="w-4 h-4" />
                         </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-32 opacity-20">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                  <Filter className="w-8 h-8" />
               </div>
                <p className="text-xs font-bold">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedOrder(null)}
               className="fixed inset-0 bg-black/40 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                {/* Modal Header */}
                <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
                         <ShoppingBag className="w-6 h-6" />
                      </div>
                       <div>
                          <h2 className="text-2xl font-black tracking-tight uppercase-none">Order: {selectedOrder.id}</h2>
                          <p className="text-xs font-bold text-black/50">Full Order Details</p>
                       </div>
                   </div>
                   <button 
                     onClick={() => setSelectedOrder(null)}
                     className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
                   >
                      <XCircle className="w-6 h-6" />
                   </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div>
                             <span className="text-xs font-bold text-black/50 mb-6 block">Customer Info</span>
                            <div className="bg-gray-50 rounded-[32px] p-8 space-y-4 border border-gray-100/50">
                               <div className="flex items-center gap-4 border-b border-gray-200/50 pb-4">
                                  <User className="w-5 h-5 text-black/50" />
                                  <span className="text-sm font-bold tracking-tight">{selectedOrder.customer.name}</span>
                               </div>
                               <div className="flex items-center gap-4 border-b border-gray-200/50 pb-4">
                                  <Mail className="w-5 h-5 text-black/50" />
                                  <span className="text-sm font-medium italic">{selectedOrder.customer.email}</span>
                               </div>
                               <div className="flex items-start gap-4">
                                  <Package className="w-5 h-5 text-black/50 mt-1" />
                                  <span className="text-sm text-black/50 leading-relaxed font-medium">{selectedOrder.customer.address}</span>
                               </div>
                            </div>
                         </div>

                         <div>
                            <span className="text-xs font-bold text-black/50 mb-6 block">Order Items</span>
                            <div className="space-y-4">
                               {selectedOrder.items.map((item, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[20px]">
                                    <div className="flex items-center gap-4">
                                       <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden p-2">
                                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                       </div>
                                       <div>
                                          <p className="text-xs font-bold leading-none mb-1">{item.name}</p>
                                          <p className="text-xs font-bold text-black/50">Qty: {item.quantity}</p>
                                       </div>
                                    </div>
                                    <span className="text-xs font-bold tracking-tight italic">{formatPrice(item.price * item.quantity)}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div>
                             <span className="text-xs font-bold text-black/50 mb-6 block">Update Status</span>
                            <div className="space-y-3">
                               {(['packing', 'transporting', 'reached', 'completed'] as OrderStatus[]).map((status) => (
                                 <button
                                   key={status}
                                   onClick={() => handleStatusChange(selectedOrder.id, status)}
                                   className={`w-full flex items-center justify-between p-5 rounded-[24px] border transition-all text-left ${
                                     selectedOrder.status === status 
                                       ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]" 
                                       : "border-gray-100 bg-white text-black/40 hover:border-primary/20"
                                   }`}
                                 >
                                    <div className="flex items-center gap-4">
                                       {status === "packing" && <Package className="w-5 h-5" />}
                                       {status === "transporting" && <Truck className="w-5 h-5" />}
                                       {status === "reached" && <CheckCircle2 className="w-5 h-5" />}
                                       {status === "completed" && <Star className="w-5 h-5" />}
                                       <span className="text-[11px] font-bold">{status}</span>
                                    </div>
                                    {selectedOrder.status === status && <CheckCircle2 className="w-4 h-4 text-white" />}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="bg-primary rounded-[32px] p-8 text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.05] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                             <div className="relative z-10">
                               <span className="text-[11px] font-bold text-primary-foreground/30 mb-4 block">Total Amount</span>
                               <div className="flex items-baseline gap-2">
                                  <span className="text-5xl font-black italic tracking-tight">{formatPrice(selectedOrder.total)}</span>
                                  <span className="text-primary-foreground/20 text-xs font-bold">NGN</span>
                               </div>
                               <p className="text-xs font-bold text-primary-foreground/20 mt-6 bg-white/[0.05] w-fit px-4 py-2 rounded-full border border-white/10 uppercase-none italic">
                                 Paid via secure checkout
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminOrders;
