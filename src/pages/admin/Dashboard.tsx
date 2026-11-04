import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Clock
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useOrders } from "@/context/OrderContext";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/format";

const AdminDashboard = () => {
  const { orders } = useOrders();
  const { products } = useProducts();

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const completedOrders = orders.filter(o => o.status === "completed").length;
    const pendingOrders = orders.filter(o => o.status !== "completed").length;

    return [
      { 
        label: "Total Sales", 
        value: formatPrice(totalRevenue), 
        change: "+12.5%", 
        increasing: true, 
        icon: DollarSign, 
        color: "bg-green-50 text-green-600" 
      },
      { 
        label: "Total Orders", 
        value: orders.length.toString(), 
        change: "+3.2%", 
        increasing: true, 
        icon: ShoppingBag, 
        color: "bg-blue-50 text-blue-600" 
      },
      { 
        label: "Stock Items", 
        value: products.length.toString(), 
        change: "-2 Items", 
        increasing: false, 
        icon: Package, 
        color: "bg-orange-50 text-orange-600" 
      },
      { 
        label: "Average Sale", 
        value: formatPrice(avgOrderValue), 
        change: "+5.1%", 
        increasing: true, 
        icon: TrendingUp, 
        color: "bg-purple-50 text-purple-600" 
      },
    ];
  }, [orders, products]);

  const recentOrders = orders.slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 uppercase-none">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Overview</h1>
            <p className="text-black/40 text-[11px] font-bold mt-1">A quick look at how the store is doing</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 italic font-medium px-6 text-sm">
             <Clock className="w-4 h-4 text-black/50" />
             <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold tracking-tight ${stat.increasing ? 'text-green-500' : 'text-red-500'}`}>
                   {stat.increasing ? (
                     <ArrowUpRight className="w-3 h-3" />
                   ) : (
                     <ArrowDownRight className="w-3 h-3" />
                   )}
                   {stat.change}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-black/50 mb-1">{stat.label}</p>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders Table */}
          <div className="lg:col-span-8 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
               <h3 className="text-sm font-bold">Recent Orders</h3>
               <button className="text-xs font-bold text-black/50 hover:text-black transition-colors">View All</button>
            </div>
            <div className="flex-1 overflow-x-auto min-h-[400px]">
              {orders.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-4 text-left text-[11px] font-black text-black/50">Order Info</th>
                      <th className="px-8 py-4 text-left text-[11px] font-black text-black/50">Customer</th>
                      <th className="px-8 py-4 text-left text-[11px] font-black text-black/50">Total</th>
                      <th className="px-8 py-4 text-left text-[11px] font-black text-black/50">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold tracking-tight">{order.id}</span>
                              <span className="text-xs text-black/50 font-medium italic mt-0.5">{new Date(order.date).toLocaleDateString()}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold">{order.customer.name}</span>
                              <span className="text-xs text-black/50 font-medium lowercase">{order.customer.email}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-[11px] font-black italic tracking-tight">
                           {formatPrice(order.total)}
                        </td>
                        <td className="px-8 py-6">
                           <span className={`px-4 py-1.5 rounded-full text-[11px] font-black ${ order.status === "completed" ? "bg-green-50 text-green-600" : order.status === "transporting" ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-black/40" }`}>
                              {order.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
                   <ShoppingBag className="w-12 h-12 mb-4" />
                   <p className="text-xs font-bold">No orders recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products / Inventory Summary */}
          <div className="lg:col-span-4 bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex flex-col">
             <div className="mb-10">
                <h3 className="text-sm font-bold mb-2">Inventory</h3>
                <p className="text-xs font-bold text-black/50">What you have in stock</p>
             </div>
             <div className="space-y-6 flex-1">
                {["Phones", "Laptops", "Watches", "Accessories", "Audio"].map((cat) => {
                  const count = products.filter(p => p.category === cat).length;
                  const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                         <span>{cat}</span>
                         <span className="text-black/50">{count} items</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${percentage}%` }}
                           transition={{ duration: 1, ease: "easeOut" }}
                           className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                         />
                      </div>
                    </div>
                  );
                })}
             </div>
             
             <div className="mt-12 bg-[#F8F9FA] rounded-[32px] p-6 text-center">
                <p className="text-xs font-bold text-black/50 mb-4 block">Total Stock Value</p>
                <p className="text-4xl font-black tracking-tight mb-4 italic">
                  {formatPrice(products.reduce((sum, p) => sum + p.price, 0))}
                </p>
                <div className="flex justify-center">
                   <span className="inline-flex items-center gap-2 bg-white px-6 py-2 rounded-full text-[11px] font-bold border border-gray-100">
                      System Status: Online
                   </span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
