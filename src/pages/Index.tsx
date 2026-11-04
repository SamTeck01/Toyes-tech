import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryCircles from "@/components/CategoryCircles";
import ProductRow from "@/components/ProductRow";
import BudgetTiles from "@/components/BudgetTiles";
import DealsGrid from "@/components/DealsGrid";
import InspectionSteps from "@/components/InspectionSteps";
import RecentlyViewed from "@/components/RecentlyViewed";
import HomeFAQ from "@/components/HomeFAQ";
import StoreStrip from "@/components/StoreStrip";
import BrandStrip from "@/components/BrandStrip";
import SocialBar from "@/components/SocialBar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { useProducts } from "@/context/ProductContext";
import type { Product } from "@/data/products";

const Index = () => {
  const { products } = useProducts();

  const byCategory = useMemo(() => {
    const pick = (c: string) => products.filter((p) => p.category === c);
    // Round-robin gadgets by type so the row shows variety (speaker, watch, controller...), not five of one kind.
    const gadgets = pick("Gadgets");
    const groups = [...new Set(gadgets.map((g) => g.subcategory ?? ""))].map((t) => gadgets.filter((g) => (g.subcategory ?? "") === t));
    const mixed: Product[] = [];
    for (let i = 0; mixed.length < gadgets.length; i++) groups.forEach((g) => g[i] && mixed.push(g[i]));
    return { Gadgets: mixed, Phones: pick("Phones"), Laptops: pick("Laptops") };
  }, [products]);

  // Interleave the three departments so none dominates: gadget, phone, laptop, gadget...
  const popular = useMemo(() => {
    const list: Product[] = [];
    const lists = [byCategory.Gadgets.filter((p) => p.badge || p.originalPrice), byCategory.Phones, byCategory.Laptops];
    for (let i = 0; i < 4; i++) lists.forEach((l) => l[i] && list.push(l[i]));
    return list;
  }, [byCategory]);

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Helmet><title>Toyes Tech | Gadgets, Phones & Laptops</title></Helmet>
      <Navbar />
      <main>
        <HeroSection />
        <CategoryCircles />
        <ProductRow id="popular" title="Popular right now" to="/shop" products={popular} />
        <BudgetTiles />
        <DealsGrid />

        {/* One row per department, so gadgets, phones and laptops each get equal room. */}
        <ProductRow id="gadgets" tone="tinted" title="Gadgets" subtitle="Audio, smartwatches, gaming, chargers and more" to="/shop?category=Gadgets" linkLabel="All gadgets" products={byCategory.Gadgets} />
        <ProductRow id="phones" title="Phones" subtitle="New and UK-used iPhone, Samsung and Google" to="/shop?category=Phones" linkLabel="All phones" products={byCategory.Phones} />
        <ProductRow id="laptops" tone="tinted" title="Laptops" subtitle="For lectures, projects, work and play" to="/shop?category=Laptops" linkLabel="All laptops" products={byCategory.Laptops} />

        <InspectionSteps />
        <RecentlyViewed />
        <HomeFAQ />
        <StoreStrip />
        <BrandStrip />
      </main>
      <SocialBar />
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
