import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  bookId: string;
  title: string;
  author: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (bookId: string) => boolean;
  getQuantity: (bookId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bookstore_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(newItem: Omit<CartItem, 'quantity'>) {
    setItems(prev => {
      const existing = prev.find(i => i.bookId === newItem.bookId);
      if (existing) {
        return prev.map(i =>
          i.bookId === newItem.bookId
            ? { ...i, quantity: Math.min(i.stock, i.quantity + 1) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }

  function removeItem(bookId: string) {
    setItems(prev => prev.filter(i => i.bookId !== bookId));
  }

  function updateQuantity(bookId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(bookId);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.bookId === bookId ? { ...i, quantity: Math.min(i.stock, quantity) } : i
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  function isInCart(bookId: string) {
    return items.some(i => i.bookId === bookId);
  }

  function getQuantity(bookId: string) {
    return items.find(i => i.bookId === bookId)?.quantity ?? 0;
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart, isInCart, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
