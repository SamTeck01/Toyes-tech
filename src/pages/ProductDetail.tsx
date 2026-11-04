import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Minus, Plus, Share2, Heart, Check, Info, Star, Upload, Package, Truck, ShieldCheck } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useReviews } from "@/context/ReviewContext";
import { toast } from "sonner";
import { addRecentlyViewed } from "@/lib/recentlyViewed";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/lib/format";
import { Helmet } from "react-helmet-async";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const ProductDetail = () => {
  const { id } = useParams();
  const { products } = useProducts();
  const product = useMemo(() => products.find((p) => p.id === id), [id, products]);

  useEffect(() => {
    if (product) addRecentlyViewed(product.id);
  }, [product]);
  
  const [quantity, setQuantity] = useState(1);
  

  // Variant States
  const [selectedStorage, setSelectedStorage] = useState(product?.storageOptions?.[0] || null);
  const [selectedRam, setSelectedRam] = useState(product?.ramOptions?.[0] || null);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || null);

  // Observer Refs & State
  const addToCartRef = useRef<HTMLDivElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [activeCartItemId, setActiveCartItemId] = useState("");

  const { items, addToCart, updateQuantity: updateCartQuantity, setCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getReviewsByProduct, addReview } = useReviews();
  
  const wishlisted = product ? isInWishlist(product.id) : false;
  const productReviews = product ? getReviewsByProduct(product.id) : [];

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, products]);

  // Re-sync states when product or variants change
  useEffect(() => {
    // If it's just product change, reset variants to default.
    // If variants change, reset "added" state.
    setIsAdded(false);
    setQuantity(1);
  }, [selectedStorage, selectedRam, selectedColor, product]);

  // Observer Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Sticky is visible if the target is currently intersecting OR it has scrolled out the top of the viewport
        setIsStickyVisible(entry.isIntersecting || entry.boundingClientRect.top < 0);
      },
      { rootMargin: "0px", threshold: 0 }
    );
    if (addToCartRef.current) {
      observer.observe(addToCartRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-32 text-center text-black/50 font-medium">Product not found.</div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : [product.image]; 


  const unitPrice = product.price + (selectedStorage?.priceModifier || 0) + (selectedRam?.priceModifier || 0);

  const handleAddToCart = () => {
    const variantDetails = [];
    if (selectedStorage) variantDetails.push(selectedStorage.capacity);
    if (selectedRam) variantDetails.push(selectedRam.capacity);
    if (selectedColor) variantDetails.push(selectedColor.name);
    const variantTag = variantDetails.length > 0 ? ` (${variantDetails.join(', ')})` : '';

    const colorVal = selectedColor?.name;
    const storageVal = selectedStorage?.capacity;
    const ramVal = selectedRam?.capacity;
    const conditionVal = product.condition;
    
    // Explicitly calculate the ID identical to CartContext to track it locally
    const cartItemId = `${product.id}-${conditionVal || 'na'}-${colorVal || 'na'}-${storageVal || 'na'}-${ramVal || 'na'}`;

    addToCart(
      { ...product, price: unitPrice }, 
      quantity, 
      unitPrice, 
      conditionVal, 
      colorVal, 
      storageVal, 
      ramVal
    );
    
    setIsAdded(true);
    setActiveCartItemId(cartItemId);
    setCartOpen(true);
  };

  const handleUpdateCartQuantity = (delta: number) => {
    const activeItem = items.find(i => i.cartItemId === activeCartItemId);
    const currentQ = activeItem ? activeItem.quantity : quantity;
    const newQ = Math.max(0, currentQ + delta);
    
    if (newQ === 0) {
      setIsAdded(false);
    }
    
    if (activeItem) {
      updateCartQuantity(activeCartItemId, newQ);
    } else {
      setQuantity(newQ);
    }
  };

  const handleReviewSubmit = () => {
    if (!reviewName || !reviewContent) {
      toast.error("Please fill in all fields.");
      return;
    }
    
    addReview({
      productId: product.id,
      userName: reviewName,
      rating: reviewRating,
      comment: reviewContent
    });
    
    setReviewName("");
    setReviewEmail("");
    setReviewContent("");
    setReviewRating(5);
    setIsDialogOpen(false);
    toast.success("Review submitted! Thank you for your feedback.");
  };
  
  const currentDisplayedQuantity = isAdded 
    ? (items.find(i => i.cartItemId === activeCartItemId)?.quantity || quantity)
    : quantity;

  // SEO Schema
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.image,
    "description": product.description || `Buy ${product.name} at Toyes Tech. Premium performance and design.`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Logo"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "NGN",
      "price": unitPrice,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": product.condition === "New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": productReviews.length + 3
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Helmet>
        <title>{product.name} | Toyes Tech</title>
        <meta name="description" content={product.description || `Buy ${product.name} at Toyes Tech.`} />
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>
      <Navbar />

      <main className="container pt-10 pb-16">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-black/50 mb-8 px-2">
          <Link to="/" className="hover:text-black">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black/60">{product.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black truncate max-w-[120px] sm:max-w-none">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
          
          {/* Left Column: Swiper Gallery */}
          <div className="lg:col-span-7 h-auto">
            <div className="w-full aspect-[4/5] bg-gray-50 flex items-center justify-center relative overflow-hidden rounded-md">
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                loop={true}
                className="w-full h-full"
                style={{
                  "--swiper-theme-color": "hsl(var(--primary))",
                  "--swiper-pagination-bullet-inactive-color": "hsl(var(--primary))",
                  "--swiper-pagination-bullet-inactive-opacity": "0.1",
                  "--swiper-pagination-bullet-size": "6px",
                  "--swiper-pagination-bottom": "20px"
                } as React.CSSProperties}
              >
                {allImages.map((img, i) => (
                  <SwiperSlide key={i} className="flex items-center justify-center h-full">
                    <img 
                      src={img} 
                      alt={`${product.name} View ${i + 1}`} 
                      className="w-full h-full object-cover select-none cursor-grab active:cursor-grabbing"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              {product.badge && (
                <span className="absolute top-6 left-6 md:top-8 md:left-8 z-10 rounded-full bg-white text-black shadow-sm text-xs font-bold px-3 py-1.5">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="border-b border-gray-100 pb-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-black/40">
                  {product.brand}
                </span>
                {product.condition && (
                  <span className="text-xs font-bold px-3 py-1 border border-black/10 rounded-sm bg-gray-50 text-black/80">
                    {product.condition}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{product.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-3xl md:text-4xl font-bold tracking-tight">{formatPrice(unitPrice)}</p>
                {product.originalPrice && (
                  <span className="text-base text-black/50 line-through">{formatPrice(product.originalPrice)}</span>
                )}
              </div>
            </div>

            <div className="space-y-8 pb-10 border-b border-gray-100 mb-10">
              <p className="text-black/60 text-sm leading-relaxed">
                {product.description || "High-performance device designed for modern efficiency. Experience the next generation of technology with premium build quality and cutting-edge features."}
              </p>

              {/* Dynamic Variants */}
              {(product.colors || product.ramOptions || product.storageOptions) && (
                <div className="space-y-6">
                  
                  {product.colors && (
                    <div>
                      <p className="text-xs font-bold text-black/40 mb-3">Color: <span className="text-black ml-1">{selectedColor?.name}</span></p>
                      <div className="flex gap-3">
                        {product.colors.map(color => (
                          <button 
                            key={color.name}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor?.name === color.name ? 'border-black' : 'border-black/5 hover:border-black/30'}`}
                            style={{ backgroundColor: color.hex }}
                            aria-label={color.name}
                          >
                             {selectedColor?.name === color.name && (
                               <Check className={`w-4 h-4 ${['#f9f6ef', '#f3f2ee', '#ffffff', '#b4b1a8'].includes(color.hex.toLowerCase()) ? 'text-black' : 'text-white'}`} />
                             )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.ramOptions && (
                    <div>
                      <p className="text-xs font-bold text-black/40 mb-3">Memory (RAM)</p>
                      <div className="flex flex-wrap gap-2">
                        {product.ramOptions.map(ram => (
                          <button
                            key={ram.capacity}
                            onClick={() => setSelectedRam(ram)}
                            className={`px-6 py-3 text-xs font-bold border rounded-full transition-all ${ selectedRam?.capacity === ram.capacity ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-200 text-black/60 hover:border-primary hover:text-primary' }`}
                          >
                            {ram.capacity}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.storageOptions && (
                    <div>
                      <p className="text-xs font-bold text-black/40 mb-3">Storage Capacity</p>
                      <div className="flex flex-wrap gap-2">
                        {product.storageOptions.map(storage => (
                          <button
                            key={storage.capacity}
                            onClick={() => setSelectedStorage(storage)}
                            className={`px-6 py-3 text-xs font-bold border rounded-full transition-all ${ selectedStorage?.capacity === storage.capacity ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-200 text-black/60 hover:border-primary hover:text-primary' }`}
                          >
                            {storage.capacity}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Action - Observed via Ref */}
              <div ref={addToCartRef} className="pt-4 space-y-4">
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.div 
                      key="added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4"
                    >
                      <div className="flex items-center border border-gray-200">
                        <button 
                          onClick={() => handleUpdateCartQuantity(-1)}
                          className="px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-bold">{currentDisplayedQuantity}</span>
                        <button 
                          onClick={() => handleUpdateCartQuantity(1)}
                          className="px-5 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <Link 
                        to="/checkout"
                        className="flex-1 rounded-full bg-primary text-primary-foreground py-4 px-2 text-[11px] sm:text-xs font-bold hover:opacity-90 transition-all text-center"
                      >
                        Checkout Now
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="not-added"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4"
                    >
                      <button 
                        onClick={handleAddToCart}
                        className="w-full rounded-full bg-primary text-primary-foreground py-4 px-2 text-[11px] sm:text-xs font-bold hover:opacity-90 transition-all whitespace-nowrap"
                      >
                        Add to cart · {formatPrice(unitPrice)}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="flex-1 rounded-full border border-gray-200 py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <Heart className={`w-3 h-3 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-black'}`} />
                    {wishlisted ? 'Wishlisted' : 'Wishlist'}
                  </button>
                  <button onClick={async () => {
                    const url = window.location.href;
                    try {
                      if (navigator.share) await navigator.share({ title: product.name, url });
                      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
                    } catch { /* share cancelled */ }
                  }} className="flex-1 rounded-full border border-gray-200 py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery, warranty and stock: answers the questions people have right before buying. */}
            <div className="mb-8 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-[#FAFAFA]">
              <div className="flex items-start gap-3 p-4">
                <Package className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold">
                    {!product.inStock || product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock, ready to ship"}
                  </p>
                  <p className="text-xs text-black/55">Pick up at a Toyes Tech store or get it delivered.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold">Nationwide delivery</p>
                  <p className="text-xs text-black/55">Delivery fee and date are shown at checkout before you pay.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold">{product.condition === "New" ? "Manufacturer warranty" : "Toyes Tech warranty"}</p>
                  <p className="text-xs text-black/55">Plus 7 days to return it if it isn't right.</p>
                </div>
              </div>
            </div>

            {/* Specifications Brief */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-black/40" />
                <h3 className="text-xs font-bold">Specifications & Details</h3>
              </div>
              <div className="space-y-3">
                {(product.specs || [
                  { label: "Availability", value: product.inStock ? "In Stock & Ready to Ship" : "Out of Stock" },
                  { label: "Category", value: product.subcategory ? `${product.category} · ${product.subcategory}` : product.category },
                  { label: "Brand Origin", value: "Verified Authentic" },
                ]).map((spec, i) => (
                  <div key={i} className="flex justify-between items-center text-xs font-medium border-b border-gray-50 pb-3">
                    <span className="text-black/50">{spec.label}</span>
                    <span className="text-black text-right max-w-[60%]">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description and Reviews */}
        <div className="mt-20 border-t border-gray-100 pt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 h-auto p-0 mb-8 rounded-none overflow-x-auto">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-xs font-bold text-black/40 data-[state=active]:text-primary transition-colors"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-xs font-bold text-black/40 data-[state=active]:text-primary transition-colors"
              >
                Customer Reviews ({3 + productReviews.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="prose prose-sm max-w-none text-black/70 animate-in fade-in duration-500">
               <div className="space-y-6">
                 <div>
                   <h3 className="text-lg font-bold text-black mb-2">About this {product.category === "Phones" ? "phone" : product.category === "Laptops" ? "laptop" : "gadget"}</h3>
                   <p>{product.description}</p>
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-black mb-2">What's in the box</h3>
                   <p>Every order includes:</p>
                   <ul className="list-disc pl-5 mt-2 space-y-1">
                     <li>The authentic {product.brand} {product.name}</li>
                     <li>A compatible charging cable</li>
                     <li>Toyes Tech quality inspection report</li>
                   </ul>
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-black mb-2">Condition and warranty</h3>
                   <p>{product.condition === "New"
                     ? "Brand new and sealed, with the full manufacturer warranty."
                     : "UK-used devices are tested before listing: screen, cameras, speakers, biometrics, ports, network and battery health. Devices with battery health below 80% are not sold."}{" "}
                     Every order is covered by a Toyes Tech warranty and can be returned within 7 days.</p>
                 </div>
               </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="animate-in fade-in duration-500">
               <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                 
                 {/* Left: Feed */}
                 <div className="flex-1 space-y-8">
                   {/* Dynamic User Reviews */}
                   {productReviews.slice().reverse().map((review) => (
                     <div key={review.id} className="border-b border-gray-50 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="flex space-x-0.5">
                           {[1, 2, 3, 4, 5].map(i => (
                             <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-black text-black' : 'text-gray-200'}`} />
                           ))}
                         </div>
                         <span className="text-xs font-bold text-black/40">
                            {new Date(review.date).toLocaleDateString()}
                         </span>
                       </div>
                       <h4 className="text-sm font-bold text-black mb-1">Verified Acquisition</h4>
                       <p className="text-sm text-black/70 mb-2">{review.comment}</p>
                       <p className="text-xs font-bold text-black/40">- {review.userName}</p>
                     </div>
                   ))}

                   <div className="border-b border-gray-50 pb-6">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="flex space-x-0.5">
                         {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-black text-black"/>)}
                       </div>
                       <span className="text-xs font-bold text-black/40">2 days ago</span>
                     </div>
                     <h4 className="text-sm font-bold text-black mb-1">Excellent Condition!</h4>
                     <p className="text-sm text-black/70 mb-2">Got the UK Used version and it looks completely brand new. Battery health was at 98%. The delivery was prompt and unboxing experience was very premium.</p>
                     <p className="text-xs font-bold text-black/40">- Sarah Jenkins</p>
                   </div>
                   
                   <div className="border-b border-gray-50 pb-6">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="flex space-x-0.5">
                         {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i<5 ? 'fill-black text-black' : 'text-gray-300'}`}/>)}
                       </div>
                       <span className="text-xs font-bold text-black/40">1 week ago</span>
                     </div>
                     <h4 className="text-sm font-bold text-black mb-1">Works flawlessly, minor scratch</h4>
                     <p className="text-sm text-black/70 mb-2">Upgraded the RAM on this and it flies through tasks. There was a tiny scratch on the bezel (since it was listed as Used) but functionally it is an absolute beast.</p>
                     <p className="text-xs font-bold text-black/40">- Michael T.</p>
                   </div>

                   <div className="border-b border-gray-50 pb-6">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="flex space-x-0.5">
                         {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-black text-black"/>)}
                       </div>
                       <span className="text-xs font-bold text-black/40">3 weeks ago</span>
                     </div>
                       <h4 className="text-sm font-bold text-black mb-1">Authentic and Verified</h4>
                       <p className="text-sm text-black/70 mb-2">Verified the serial number online and everything checks out. Good price for the storage capacity. Would heavily recommend this store for tech gadgets.</p>
                       <p className="text-xs font-bold text-black/40">- O. Emmanuel</p>
                   </div>
                 </div>
                 
                 {/* Right: Submit Review UI */}
                 <div className="w-full lg:max-w-xs shrink-0 bg-gray-50 p-6 md:p-8 rounded-md h-fit border border-gray-100">
                   <h3 className="text-lg font-bold mb-2">Share your thoughts</h3>
                   <p className="text-xs text-black/60 mb-6 leading-relaxed">If you’ve used this product, share your thoughts with other customers to help them make an informed decision.</p>
                   
                   <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                     <DialogTrigger asChild>
                       <button className="w-full bg-primary text-primary-foreground px-6 py-4 text-xs font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/10 rounded-full">
                         Write a Review
                       </button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-[425px]">
                       <DialogHeader>
                         <DialogTitle className="text-xl font-bold tracking-tight">Write a Review</DialogTitle>
                         <DialogDescription className="text-xs text-black/60 mt-1">
                           Share your experience with the {product.name}.
                         </DialogDescription>
                       </DialogHeader>
                       <div className="grid gap-5 py-4 mt-2">
                          <div className="grid gap-2">
                            <label className="text-xs font-bold text-black/60">Overall Rating</label>
                            <div className="flex gap-2">
                              {[1,2,3,4,5].map(star => (
                                <Star 
                                 key={star} 
                                 onClick={() => setReviewRating(star)}
                                 className={`w-6 h-6 cursor-pointer transition-colors ${star <= reviewRating ? 'text-black fill-black' : 'text-gray-200 hover:text-black'}`} 
                                />
                              ))}
                            </div>
                          </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="grid gap-2">
                             <label className="text-xs font-bold text-black/60">Name</label>
                             <input 
                               type="text" 
                               value={reviewName}
                               onChange={(e) => setReviewName(e.target.value)}
                               placeholder="John Doe" 
                               className="border border-gray-200 p-3 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-colors rounded-xl" 
                             />
                           </div>
                           <div className="grid gap-2">
                             <label className="text-xs font-bold text-black/60">Email</label>
                             <input 
                               type="email" 
                               value={reviewEmail}
                               onChange={(e) => setReviewEmail(e.target.value)}
                               placeholder="john@example.com" 
                               className="border border-gray-200 p-3 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-colors rounded-xl" 
                             />
                           </div>
                         </div>
                         <div className="grid gap-2">
                           <label className="text-xs font-bold text-black/60">Your Review</label>
                           <textarea 
                             placeholder="What did you like or dislike?" 
                             rows={4} 
                             value={reviewContent}
                             onChange={(e) => setReviewContent(e.target.value)}
                             className="border border-gray-200 p-3 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-primary resize-none transition-colors rounded-xl" 
                           />
                         </div>
                         <div className="grid gap-2">
                           <label className="text-xs font-bold text-black/60">Add Photo (Optional)</label>
                           <div className="border border-dashed border-gray-300 bg-gray-50 p-6 flex flex-col items-center justify-center text-black/40 cursor-pointer hover:border-black/50 hover:bg-gray-100 transition-colors">
                             <Upload className="w-4 h-4 mb-2" />
                             <span className="text-xs font-bold">Upload Image</span>
                           </div>
                         </div>
                       </div>
                       <DialogFooter>
                         <button 
                           onClick={handleReviewSubmit}
                           className="w-full bg-primary text-primary-foreground px-6 py-4 text-xs font-bold hover:opacity-90 transition-all rounded-full"
                         >
                           Submit Review
                         </button>
                       </DialogFooter>
                     </DialogContent>
                   </Dialog>
                 </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Similar Selection */}
        <section className="mt-24 md:mt-32">
          <div className="flex items-end justify-between mb-10 md:mb-16 px-2">
            <div>
               
               <h2 className="text-2xl md:text-3xl font-extrabold">You may also like</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-10 gap-y-10 sm:gap-y-16">
             {related.map((p, i) => (
               <ProductCard key={p.id} product={p} index={i} />
             ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* Mobile Sticky Add To Cart Bar - Driven by IntersectionObserver */}
      <AnimatePresence>
        {isStickyVisible && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6 z-50 flex items-center justify-between shadow-[0_-15px_30px_rgba(0,0,0,0.08)] pb-safe"
          >
            <div>
              <p className="text-xs font-bold text-black/40 mb-0.5">Total Price</p>
              <p className="text-lg font-bold">{formatPrice(unitPrice * quantity)}</p>
            </div>
            <button 
              onClick={handleAddToCart}
              className="bg-primary text-primary-foreground px-8 py-3.5 text-xs font-bold active:scale-95 transition-all shadow-lg shadow-black/10 rounded-full"
            >
              Add to Cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hide Bottom Nav when Sticky Bar is overlapping */}
      {!isStickyVisible && <BottomNav />}
    </div>
  );
};

export default ProductDetail;
