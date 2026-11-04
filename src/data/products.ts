export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number; // Base price
  originalPrice?: number;
  image: string;
  images?: string[];
  inStock: boolean;
  stock: number;
  category: string;
  condition?: "New" | "UK Used" | "Used";
  
  // Variants
  colors?: { name: string; hex: string }[];
  storageOptions?: { capacity: string; priceModifier: number }[];
  ramOptions?: { capacity: string; priceModifier: number }[];
  
  description?: string;
  featured?: boolean;
  badge?: string;
  specs?: { label: string; value: string }[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  image: string;
}

export const products: Product[] = [
  // PHONES --------------------------------------------
  {
    id: "p1",
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    price: 1550000,
    originalPrice: 1750000,
    image: "/images/products/p1.jpg",
    images: ["/images/products/p1.jpg", "/images/products/p1-b.jpg", "/images/products/p1-c.jpg"],
    inStock: true,
    stock: 10,
    category: "Phones",
    condition: "New",
    featured: true,
    badge: "Bestseller",
    description: "The ultimate smartphone experience with forged titanium design and A17 Pro chip.",
    colors: [
      { name: "Natural Titanium", hex: "#b4b1a8" },
      { name: "Black Titanium", hex: "#434344" },
      { name: "White Titanium", hex: "#f3f2ee" }
    ],
    storageOptions: [
      { capacity: "256GB", priceModifier: 0 },
      { capacity: "512GB", priceModifier: 200000 },
      { capacity: "1TB", priceModifier: 450000 }
    ],
    specs: [
      { label: "Screen", value: "6.7\" Super Retina XDR" },
      { label: "Chip", value: "A17 Pro" },
      { label: "Camera", value: "48MP Main | 5x Telephoto" }
    ]
  },
  {
    id: "p2",
    name: "iPhone 13 Pro",
    brand: "Apple",
    price: 780000,
    image: "/images/products/p2.jpg",
    images: ["/images/products/p2.jpg", "/images/products/p2-b.jpg"],
    inStock: true,
    stock: 10,
    category: "Phones",
    condition: "UK Used",
    featured: true,
    description: "Pristine UK Used condition. 120Hz ProMotion display and incredible battery life.",
    colors: [
      { name: "Sierra Blue", hex: "#a7c1d9" },
      { name: "Graphite", hex: "#5c5b57" }
    ],
    storageOptions: [
      { capacity: "128GB", priceModifier: 0 },
      { capacity: "256GB", priceModifier: 85000 }
    ],
    specs: [
      { label: "Battery Health", value: "85% - 100%" },
      { label: "Screen", value: "6.1\" Super Retina XDR" },
      { label: "Warranty", value: "30 Days Store Guarantee" }
    ]
  },
  {
    id: "p3",
    name: "Galaxy S24 Ultra",
    brand: "Samsung",
    price: 1850000,
    image: "/images/products/p3.jpg",
    inStock: true,
    stock: 10,
    category: "Phones",
    condition: "New",
    description: "Built-in S Pen, Titanium exterior, and revolutionary Galaxy AI.",
    storageOptions: [
      { capacity: "256GB", priceModifier: 0 },
      { capacity: "512GB", priceModifier: 150000 }
    ]
  },
  {
    id: "p4",
    name: "Pixel 7 Pro",
    brand: "Google",
    price: 480000,
    image: "/images/products/p4.jpg",
    inStock: true,
    stock: 10,
    category: "Phones",
    condition: "UK Used",
    description: "Spotless UK Used condition. Best-in-class computational photography.",
    storageOptions: [
      { capacity: "128GB", priceModifier: 0 },
      { capacity: "256GB", priceModifier: 50000 }
    ]
  },
  {
    id: "p5",
    name: "iPhone 11",
    brand: "Apple",
    price: 285000,
    image: "/images/products/p5.jpg",
    inStock: true,
    stock: 10,
    category: "Phones",
    condition: "Used",
    description: "Direct Nigerian Used. Clean state, fully functional, minor signs of wear.",
    colors: [
      { name: "Black", hex: "#1f2020" },
      { name: "White", hex: "#f9f6ef" }
    ],
    storageOptions: [
      { capacity: "64GB", priceModifier: 0 },
      { capacity: "128GB", priceModifier: 45000 }
    ]
  },

  // LAPTOPS --------------------------------------------
  {
    id: "l1",
    name: "MacBook Pro 14\" M3",
    brand: "Apple",
    price: 2850000,
    image: "/images/products/l1.jpg",
    inStock: true,
    stock: 10,
    category: "Laptops",
    condition: "New",
    featured: true,
    badge: "New Arrival",
    ramOptions: [
      { capacity: "8GB", priceModifier: 0 },
      { capacity: "16GB", priceModifier: 250000 }
    ],
    storageOptions: [
      { capacity: "512GB SSD", priceModifier: 0 },
      { capacity: "1TB SSD", priceModifier: 250000 }
    ]
  },
  {
    id: "l2",
    name: "MacBook Air M1",
    brand: "Apple",
    price: 680000,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800",
    inStock: true,
    stock: 10,
    category: "Laptops",
    condition: "UK Used",
    description: "Grade A condition UK Used. Perfect for students and professionals.",
    ramOptions: [
      { capacity: "8GB", priceModifier: 0 }
    ],
    storageOptions: [
      { capacity: "256GB SSD", priceModifier: 0 },
      { capacity: "512GB SSD", priceModifier: 120000 }
    ]
  },
  {
    id: "l3",
    name: "Dell XPS 15",
    brand: "Dell",
    price: 2100000,
    image: "/images/products/l3.jpg",
    inStock: true,
    stock: 10,
    category: "Laptops",
    condition: "New"
  },
  {
    id: "l4",
    name: "HP Spectre x360",
    brand: "HP",
    price: 1350000,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800",
    inStock: true,
    stock: 10,
    category: "Laptops",
    condition: "UK Used"
  },

  // WATCHES --------------------------------------------
  {
    id: "w1",
    name: "Apple Watch Series 9",
    brand: "Apple",
    price: 550000,
    image: "/images/products/w1.jpg",
    images: ["/images/products/w1.jpg", "/images/products/w1-b.jpg"],
    inStock: true,
    stock: 10,
    category: "Watches",
    condition: "New"
  },
  {
    id: "w2",
    name: "Apple Watch SE (2nd Gen)",
    brand: "Apple",
    price: 240000,
    image: "/images/products/w2.jpg",
    images: ["/images/products/w2.jpg", "/images/products/w2-b.jpg"],
    inStock: true,
    stock: 10,
    category: "Watches",
    condition: "UK Used",
    description: "Flawless condition UK Used Apple Watch SE. Essential fitness tracking."
  },

  // ACCESSORIES ----------------------------------------
  {
    id: "a1",
    name: "Anker 313 Power Bank",
    brand: "Anker",
    price: 45000,
    image: "/images/products/a1.jpg",
    images: ["/images/products/a1.jpg", "/images/products/a1-b.jpg"],
    inStock: true,
    stock: 10,
    category: "Accessories",
    condition: "New",
    description: "10000mAh Portable Charger. Essential daily power carrying."
  },
  {
    id: "a2",
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    price: 120000,
    image: "/images/products/a2.jpg",
    inStock: true,
    stock: 10,
    category: "Accessories",
    condition: "New"
  },
  {
    id: "a3",
    name: "20W USB-C Power Adapter",
    brand: "Apple",
    price: 25000,
    image: "/images/charger.jpg",
    inStock: true,
    stock: 10,
    category: "Accessories",
    condition: "New"
  },

  // AUDIO ----------------------------------------------
  {
    id: "au1",
    name: "AirPods Pro (2nd Gen)",
    brand: "Apple",
    price: 295000,
    image: "/images/products/au1.jpg",
    inStock: true,
    stock: 10,
    category: "Audio",
    condition: "New"
  },
  {
    id: "au2",
    name: "AirPods (3rd Gen)",
    brand: "Apple",
    price: 120000,
    image: "/images/products/au2.jpg",
    inStock: true,
    stock: 10,
    category: "Audio",
    condition: "UK Used",
    description: "Clean, sterilized UK used AirPods with full battery capacity."
  },
  {
    id: "au3",
    name: "Sony WH-1000XM5",
    brand: "Sony",
    price: 480000,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
    inStock: true,
    stock: 10,
    category: "Audio",
    condition: "New",
    description: "Industry leading noise cancellation."
  }
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "James Wilson",
    role: "Tech Reviewer",
    text: "The minimalist design of this store reflects the premium quality of the products they sell. Excellent service.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
  },
  {
    id: "t2",
    name: "Sarah Chen",
    role: "UX Designer",
    text: "Finally, a tech store that doesn't feel cluttered. The shopping experience is fluid and the motion design is top-notch.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
  },
  {
    id: "t3",
    name: "David Miller",
    role: "Professional Photographer",
    text: "High-quality products with a warranty I can trust. Their phone selection is curated for professionals.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
  },
];

export const categories = ["All", "Phones", "Laptops", "Watches", "Accessories", "Audio"];
export const brandFilters = ["All", "Apple", "Samsung", "Google", "Dell", "Logitech", "Nothing", "ASUS"];
