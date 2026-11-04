import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Image as ImageIcon,
  Tag,
  Box,
  CheckCircle,
  X,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  Info,
  Star,
  Minus
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useProducts } from "@/context/ProductContext";
import { Product } from "@/data/products";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

const AdminProducts = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [localStocks, setLocalStocks] = useState<Record<string, number>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    price: 0,
    stock: 0,
    category: "Phones",
    image: "",
    inStock: true,
    condition: "New" as "New" | "UK Used" | "Used",
    description: "",
    featured: false,
    badge: "",
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        brand: editingProduct.brand,
        price: editingProduct.price,
        stock: editingProduct.stock || 0,
        category: editingProduct.category,
        image: editingProduct.image,
        inStock: editingProduct.inStock,
        condition: editingProduct.condition || "New",
        description: editingProduct.description || "",
        featured: editingProduct.featured || false,
        badge: editingProduct.badge || "",
      });
    } else {
      setFormData({
        name: "",
        brand: "",
        price: 0,
        stock: 0,
        category: "Phones",
        image: "",
        inStock: true,
        condition: "New",
        description: "",
        featured: false,
        badge: "",
      });
    }
  }, [editingProduct]);

  const handleStockAdjust = (id: string, delta: number) => {
    const currentStock = localStocks[id] !== undefined 
      ? localStocks[id] 
      : (products.find(p => p.id === id)?.stock || 0);
    
    const newStock = Math.max(0, currentStock + delta);
    setLocalStocks({ ...localStocks, [id]: newStock });
    toast.success(`Stock updated to ${newStock} (Demo mode)`);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct({ ...formData, id: editingProduct.id } as Product);
      toast.success("Product optimized and updated.");
    } else {
      addProduct(formData as Omit<Product, "id">);
      toast.success("New product released to the catalog.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to decommission this asset?")) {
      deleteProduct(id);
      toast.info("Asset removed from registry.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 uppercase-none">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black uppercase-none">Products</h1>
            <p className="text-black/40 text-[11px] font-bold mt-1">Add and edit products in your store</p>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="group relative inline-flex items-center gap-4 bg-primary text-primary-foreground px-10 py-5 rounded-[24px] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
          >
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
             <span className="text-xs font-bold">Add Product</span>
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col lg:flex-row gap-6">
           <div className="flex-1 bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm flex items-center relative group">
              <Search className="absolute left-8 w-5 h-5 text-black/50 group-focus-within:text-black transition-colors" />
              <input 
                type="text"
                placeholder="Search by name or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-5 px-16 text-sm font-medium"
              />
           </div>
           
           <div className="flex gap-2 bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
              {["All", "Phones", "Laptops", "Watches", "Accessories", "Audio"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-8 py-4 rounded-3xl text-[11px] font-black transition-all whitespace-nowrap ${ categoryFilter === cat ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-black/50 hover:bg-gray-50 hover:text-primary" }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
           {filteredProducts.map((p, i) => (
             <motion.div
               key={p.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="group bg-white rounded-[24px] md:rounded-[40px] border border-gray-100 shadow-sm p-3 md:p-4 relative overflow-hidden h-full flex flex-col"
             >
                {/* Image & Badges */}
                <div className="relative aspect-square rounded-[20px] md:rounded-[32px] bg-gray-50/50 overflow-hidden mb-4 md:mb-6 flex items-center justify-center p-4 md:p-8 group-hover:bg-[#F8F9FA] transition-colors">
                   <img src={p.image} alt={p.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                   
                   <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-primary text-primary-foreground text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
                         {p.category}
                      </span>
                      {p.condition && (
                        <span className="bg-white/80 backdrop-blur-md text-black/60 text-[11px] font-black px-4 py-1.5 rounded-full shadow-sm">
                           {p.condition}
                        </span>
                      )}
                   </div>
                   
                   <div className="absolute top-4 right-4 flex gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                         onClick={() => handleOpenModal(p)}
                         className="w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                         <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => handleDelete(p.id)}
                         className="w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-red-500"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                {/* Content */}
                <div className="px-1 md:px-4 pb-2 md:pb-4 flex-1 flex flex-col">
                   <div className="flex flex-col md:flex-row md:items-start justify-between mb-2">
                      <div>
                         <span className="text-[11px] md:text-xs font-bold text-black/50 block mb-0.5 md:mb-1">{p.brand}</span>
                         <h3 className="text-sm md:text-lg font-black tracking-tight leading-tight">{p.name}</h3>
                      </div>
                      <div className="mt-1 md:mt-0">
                         <span className="text-sm md:text-lg font-black tracking-tight italic">{formatPrice(p.price)}</span>
                      </div>
                   </div>
                   
                   <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 md:gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStockAdjust(p.id, -1); }}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all group/btn"
                          >
                             <Minus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          </button>
                          
                          <div className="flex flex-col items-center">
                             <span className="text-xs md:text-[14px] font-black tracking-tight">
                                {localStocks[p.id] !== undefined ? localStocks[p.id] : p.stock}
                             </span>
                             <span className="text-[11px] md:text-[11px] font-bold text-black/50">Stock</span>
                          </div>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStockAdjust(p.id, 1); }}
                            className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-gray-50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all group/btn"
                          >
                             <Plus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          </button>
                       </div>
                      {p.featured && (
                         <div className="hidden md:flex items-center gap-1.5 bg-yellow-400/10 text-yellow-600 px-3 py-1 rounded-full text-[11px] font-black">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Featured
                         </div>
                      )}
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-40 text-center opacity-20">
             <Box className="w-16 h-16 mx-auto mb-6" />
             <p className="text-xs font-bold">No products found</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-20">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsModalOpen(false)}
               className="fixed inset-0 bg-black/40 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
             >
                <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                         <Box className="w-6 h-6" />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black tracking-tight">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                         <p className="text-xs font-bold text-black/50">Change product details</p>
                      </div>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                      <X className="w-6 h-6 text-black/40" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Basic Info */}
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-black/50 px-1">Model Name</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white p-4 rounded-2xl outline-none text-sm transition-all shadow-inner"
                              placeholder="e.g. iPhone 15 Pro Max"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-black/50 px-1">Brand</label>
                            <input 
                              type="text" 
                              required
                              value={formData.brand}
                              onChange={(e) => setFormData({...formData, brand: e.target.value})}
                              className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white p-4 rounded-2xl outline-none text-sm transition-all shadow-inner"
                              placeholder="e.g. Apple"
                            />
                         </div>
                         <div className="space-y-2">
                             <label className="text-xs font-bold text-black/50 px-1">Price (₦)</label>
                             <input 
                               type="number" 
                               required
                               value={formData.price}
                               onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                               className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white px-6 py-4 rounded-[20px] outline-none text-sm transition-all shadow-inner"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-black/50 px-1">Stock Qty</label>
                             <input 
                               type="number" 
                               required
                               value={formData.stock}
                               onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                               className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white px-6 py-4 rounded-[20px] outline-none text-sm transition-all shadow-inner"
                             />
                          </div>
                      </div>

                      {/* Attributes */}
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-black/50 px-1">Category</label>
                            <select 
                              value={formData.category}
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                              className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white p-4 rounded-2xl outline-none text-xs font-bold transition-all shadow-inner cursor-pointer"
                            >
                               {["Phones", "Laptops", "Watches", "Accessories", "Audio"].map(c => (
                                 <option key={c} value={c}>{c}</option>
                               ))}
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-black/50 px-1">Condition</label>
                            <select 
                              value={formData.condition}
                              onChange={(e) => setFormData({...formData, condition: e.target.value as any})}
                              className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white p-4 rounded-2xl outline-none text-xs font-bold transition-all shadow-inner cursor-pointer"
                            >
                               <option value="New">New / Sealed</option>
                               <option value="UK Used">Grade A - UK Used</option>
                               <option value="Used">Consumer Used</option>
                            </select>
                         </div>
                         <div className="pt-4 flex items-center gap-8">
                            <label className="flex items-center gap-3 cursor-pointer group">
                               <div className="relative w-6 h-6">
                                  <input 
                                    type="checkbox" 
                                    className="peer hidden"
                                    checked={formData.inStock}
                                    onChange={(e) => setFormData({...formData, inStock: e.target.checked})}
                                  />
                                  <div className="w-6 h-6 rounded-lg border-2 border-gray-100 bg-gray-50 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                     <CheckCircle className="w-4 h-4 text-primary-foreground scale-0 peer-checked:scale-100 transition-transform" />
                                  </div>
                               </div>
                               <span className="text-xs font-bold text-black/40 group-hover:text-black">In Stock</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                               <div className="relative w-6 h-6">
                                  <input 
                                    type="checkbox" 
                                    className="peer hidden"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                                  />
                                  <div className="w-6 h-6 rounded-lg border-2 border-gray-100 bg-gray-50 peer-checked:bg-yellow-400 peer-checked:border-yellow-400 transition-all flex items-center justify-center">
                                     <Star className="w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform fill-current" />
                                  </div>
                               </div>
                               <span className="text-xs font-bold text-black/40 group-hover:text-black hover:text-yellow-600">Featured</span>
                            </label>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-black/50 px-1">Image URL</label>
                      <div className="relative group">
                         <input 
                           type="text" 
                           required
                           value={formData.image}
                           onChange={(e) => setFormData({...formData, image: e.target.value})}
                           className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white p-4 rounded-2xl outline-none text-xs transition-all shadow-inner"
                           placeholder="High fidelity Unsplash or static URL"
                         />
                         <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                      </div>
                      <p className="text-[11px] text-black/50 italic font-medium px-1 flex items-center gap-1.5 mt-1">
                         <Info className="w-3 h-3" /> Images must be public URLs
                      </p>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-black/50 px-1">Description</label>
                      <textarea 
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-gray-50 border border-transparent focus:border-black/10 focus:bg-white p-6 rounded-[32px] outline-none text-sm transition-all shadow-inner resize-none scrollbar-hide"
                        placeholder="Add product specifications and details..."
                      />
                   </div>

                   <div className="pt-6 flex gap-4">
                      <button 
                         type="button" 
                         onClick={() => setIsModalOpen(false)}
                         className="flex-1 px-8 py-5 rounded-[24px] border border-gray-100 text-xs font-bold hover:bg-gray-50 transition-all"
                      >
                         Cancel
                      </button>
                      <button 
                         type="submit"
                         className="flex-[2] bg-primary text-primary-foreground px-8 py-5 rounded-[24px] text-xs font-bold shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         Save Product
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminProducts;
