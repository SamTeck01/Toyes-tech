import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, products as initialProducts } from "@/data/products";

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  /** Add (positive) or remove (negative) units; keeps inStock in sync. */
  adjustStock: (id: string, delta: number) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
}

const STORAGE_KEY = "toyes_products_v4";

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bump STORAGE_KEY whenever the built-in catalogue changes so visitors get the new range.
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  // Save to localStorage
  useEffect(() => {
    if (products.length > 0) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); } catch { /* storage unavailable */ }
    }
  }, [products]);

  const addProduct = (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: `p-${Math.random().toString(36).substring(2, 7)}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const adjustStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const stock = Math.max(0, (p.stock ?? 0) + delta);
        return { ...p, stock, inStock: stock > 0 };
      }),
    );
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getProductById = (id: string) => products.find((p) => p.id === id);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, adjustStock, deleteProduct, getProductById }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within ProductProvider");
  return context;
};
