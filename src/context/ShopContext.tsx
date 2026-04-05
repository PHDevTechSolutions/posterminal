"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MenuItem } from "@/types";
import { getMenuItems } from "@/lib/firestore-service";
import { toast } from "sonner";

export interface CartItem extends MenuItem {
  quantity: number;
}

interface ShopContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  menuItems: MenuItem[];
  loading: boolean;
  appliedPromo: { code: string; discount: number; type: 'percentage' | 'fixed' } | null;
  applyPromo: (code: string) => void;
  removePromo: () => void;
  discountedTotal: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);

  useEffect(() => {
    loadMenuItems();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("shop-cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("shop-cart", JSON.stringify(cart));
  }, [cart]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getMenuItems();
      setMenuItems(items.filter(item => item.stock > 0));
    } catch (error) {
      console.error("Error loading menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast.error("Out of stock!");
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.error(`Only ${item.stock} items available`);
          return prev;
        }
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    const itemInMenu = menuItems.find(i => i.id === id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (itemInMenu && newQty > itemInMenu.stock) {
          toast.error(`Max: ${itemInMenu.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const applyPromo = (code: string) => {
    const promos: Record<string, { discount: number; type: 'percentage' | 'fixed' }> = {
      "SAVE10": { discount: 10, type: "percentage" },
      "SAVE20": { discount: 20, type: "percentage" },
      "WELCOME50": { discount: 50, type: "fixed" },
    };

    const promo = promos[code.toUpperCase()];
    if (promo) {
      setAppliedPromo({ code: code.toUpperCase(), ...promo });
      toast.success(`Promo ${code.toUpperCase()} applied!`);
    } else {
      toast.error("Invalid promo code");
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    toast.info("Promo removed");
  };

  const discountedTotal = appliedPromo 
    ? appliedPromo.type === 'percentage' 
      ? cartTotal * (1 - appliedPromo.discount / 100)
      : Math.max(0, cartTotal - appliedPromo.discount)
    : cartTotal;

  return (
    <ShopContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      menuItems,
      loading,
      appliedPromo,
      applyPromo,
      removePromo,
      discountedTotal
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
