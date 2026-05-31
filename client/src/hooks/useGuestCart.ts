import { useState, useEffect, useCallback } from "react";

export interface GuestCartItem {
  productId: number;
  quantity: number;
  variantId?: number;
  variantLabel?: string;
  product: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
    discountActive: boolean;
    discountPercent: string | null;
    variantId?: number;
    variantLabel?: string;
  };
}

const GUEST_CART_KEY = "rvr_guest_cart";

function getStoredCart(): GuestCartItem[] {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>(getStoredCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product: GuestCartItem["product"], quantity = 1) => {
    setItems(prev => {
      // Match on productId + variantId combination
      const existing = prev.find(i => i.productId === product.id && i.variantId === product.variantId);
      if (existing) {
        return prev.map(i => (i.productId === product.id && i.variantId === product.variantId) ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { productId: product.id, quantity, variantId: product.variantId, variantLabel: product.variantLabel, product }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, variantId?: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
    } else {
      setItems(prev => prev.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity } : i));
    }
  }, []);

  const removeItem = useCallback((productId: number, variantId?: number) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, addItem, updateQuantity, removeItem, clearCart, itemCount };
}
