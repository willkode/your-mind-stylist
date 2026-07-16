import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("yms_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("yms_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + (i.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}