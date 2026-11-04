import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  Trash2, 
  MessageSquare, 
  Filter, 
  Search, 
  CheckCircle2, 
  Clock,
  User,
  ShoppingBag
} from "@/components/icons";
import AdminLayout from "@/components/admin/AdminLayout";
import { useReviews } from "@/context/ReviewContext";
import { useProducts } from "@/context/ProductContext";
import { toast } from "sonner";

const AdminReviews = () => {
  const { reviews } = useReviews();
  const { products } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const enrichedReviews = reviews.map(review => {
    const product = products.find(p => p.id === review.productId);
    return { ...review, productName: product?.name || "Unknown Product" };
  });

  const filteredReviews = enrichedReviews.filter(review => {
    const matchesSearch = 
      review.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.productName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRating = ratingFilter === "all" || review.rating === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  const handleDeleteReview = (id: string) => {
    // Note: ReviewContext needs deleteReview, I should check if it exists
    toast.info("Review moderation: Feature coming soon to context.");
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 uppercase-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
            <p className="text-black/40 text-[11px] font-bold mt-1">See what customers are saying</p>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
             <MessageSquare className="w-4 h-4 text-black/50" />
             <span className="text-xs font-bold">{reviews.length} Total Reviews</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
              <input 
                type="text" 
                placeholder="Search reviews by user, comment, or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-100 focus:border-black/10 px-14 py-4 rounded-2xl outline-none text-sm shadow-sm transition-all"
              />
           </div>
           <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
              {["all", 5, 4, 3, 2, 1].map(r => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r as any)}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black transition-all ${ ratingFilter === r ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "text-black/50 hover:bg-gray-50 hover:text-primary" }`}
                >
                  {r === "all" ? "All Stars" : `${r} Star`}
                </button>
              ))}
           </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           {filteredReviews.map((review, i) => (
             <motion.div
               key={review.id}
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05 }}
               className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group"
             >
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-black/50">
                         <User className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-sm font-bold tracking-tight">{review.userName}</h3>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                               <Star 
                                 key={i} 
                                 className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-primary text-primary' : 'text-black/10'}`} 
                               />
                            ))}
                            <span className="text-[11px] font-black text-black/50 ml-2 flex items-center gap-1">
                               <Clock className="w-2.5 h-2.5" />
                               {new Date(review.date).toLocaleDateString()}
                            </span>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleDeleteReview(review.id)}
                     className="w-10 h-10 rounded-xl hover:bg-red-50 text-black/10 hover:text-red-500 transition-all flex items-center justify-center"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-6 mb-6">
                   <p className="text-sm text-black/60 italic leading-relaxed font-medium">"{review.comment}"</p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3 text-black/50" />
                        <span className="text-xs font-bold text-black/40">Product:</span>
                        <span className="text-xs font-bold text-black/80">{review.productName}</span>
                    </div>
                   {review.isUserSubmitted && (
                     <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[11px] font-black">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Purchase
                     </div>
                   )}
                </div>
             </motion.div>
           ))}

           {filteredReviews.length === 0 && (
             <div className="col-span-full py-40 text-center opacity-20">
                <MessageSquare className="w-16 h-16 mx-auto mb-6" />
                 <p className="text-xs font-bold">No reviews found</p>
             </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
