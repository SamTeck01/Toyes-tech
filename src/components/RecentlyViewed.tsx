import { useMemo } from "react";
import { useProducts } from "@/context/ProductContext";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import ProductRow from "@/components/ProductRow";

/** Shows products this visitor opened before. Hidden until they've viewed something. */
const RecentlyViewed = () => {
  const { products } = useProducts();
  const items = useMemo(() => {
    const ids = getRecentlyViewed();
    return ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products;
  }, [products]);
  return <ProductRow id="recent" title="Recently viewed" subtitle="Pick up where you left off" products={items} />;
};

export default RecentlyViewed;
