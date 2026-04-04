import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { CartItem } from '../types';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getCartQuantity: (variantId: string | null, productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  const raw = localStorage.getItem('cart');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('cart', JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const cartKey = (item: { variantId: string | null; productId: string }) =>
    item.variantId ?? `product:${item.productId}`;

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const key = cartKey(item);
      const existing = prev.find((i) => cartKey(i) === key);
      let next: CartItem[];
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, item.stock);
        next = prev.map((i) =>
          cartKey(i) === key ? { ...i, quantity: newQty } : i,
        );
      } else {
        next = [...prev, { ...item, quantity: 1 }];
      }
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => cartKey(i) !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        const next = prev.filter((i) => cartKey(i) !== id);
        saveCart(next);
        return next;
      }
      const next = prev.map((i) =>
        cartKey(i) === id
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i,
      );
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  const getCartQuantity = useCallback(
    (variantId: string | null, productId: string) => {
      const key = variantId ?? `product:${productId}`;
      const found = items.find((i) => cartKey(i) === key);
      return found ? found.quantity : 0;
    },
    [items],
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, getCartQuantity }),
    [items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, getCartQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
