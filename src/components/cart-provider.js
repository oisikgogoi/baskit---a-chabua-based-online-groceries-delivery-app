"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { products } from "../lib/products";

const CartContext = createContext(null);
const cartStorageKey = "quickbite-cart";
const productIds = new Set(products.map((product) => String(product.id)));

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const savedCart = window.localStorage.getItem(cartStorageKey);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (!parsedCart || typeof parsedCart !== "object" || Array.isArray(parsedCart)) {
            throw new TypeError("Saved cart must be an object.");
          }

          const validCart = Object.fromEntries(
            Object.entries(parsedCart).filter(([id, quantity]) =>
              productIds.has(id) && Number.isSafeInteger(quantity) && quantity > 0
            )
          );
          setCart(validCart);
        }
      } catch (error) {
        console.error("Unable to load the saved cart.", error);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.error("Unable to save the cart.", error);
    }
  }, [cart, isLoaded]);

  const changeQuantity = useCallback((productId, amount) => {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[productId] || 0) + amount;
      const nextCart = { ...currentCart };
      if (nextQuantity <= 0) delete nextCart[productId];
      else nextCart[productId] = nextQuantity;
      return nextCart;
    });
  }, []);

  const value = useMemo(() => ({ cart, changeQuantity, isLoaded }), [cart, changeQuantity, isLoaded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider.");
  return context;
}
