import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

export type OrderStatus = "packing" | "transporting" | "reached" | "completed";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedStorage?: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    address: string;
  };
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "date" | "status">) => string;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem("toyes_orders");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("toyes_orders", JSON.stringify(orders));
  }, [orders]);

  const simulateEmail = (email: string, subject: string, body: string) => {
    // Premium toast for email simulation
    toast.info(`Email Sent to ${email}`, {
      description: subject,
      duration: 5000,
    });
    console.log(`[Email Mock] To: ${email} | Subject: ${subject}\nBody: ${body}`);
  };

  const addOrder = (orderData: Omit<Order, "id" | "date" | "status">) => {
    const newId = `LOGO-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    const newOrder: Order = {
      ...orderData,
      id: newId,
      date: new Date().toISOString(),
      status: "packing",
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Initial Confirmation Email
    simulateEmail(
      newOrder.customer.email,
      `Order Confirmed: ${newOrder.id}`,
      `Hi ${newOrder.customer.name}, your order for ${formatPrice(newOrder.total)} is being packed.`
    );

    return newId;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const statusMessages: Record<OrderStatus, string> = {
            packing: "is being packed",
            transporting: "is now on its way!",
            reached: "has reached your city!",
            completed: "is officially complete. Thank you!",
          };

          simulateEmail(
            o.customer.email,
            `Update for Order ${o.id}: Status changed to ${status.toUpperCase()}`,
            `Hi ${o.customer.name}, your order ${statusMessages[status]}.`
          );
          return { ...o, status };
        }
        return o;
      })
    );
  };

  const getOrderById = (id: string) => orders.find((o) => o.id === id);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrderById }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within OrderProvider");
  return context;
};
