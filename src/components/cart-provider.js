
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);
const cartStorageKey = "quickbite-cart";

function validateCart(savedCart) {
  if (
    !savedCart ||
    typeof savedCart !== "object" ||
    Array.isArray(savedCart)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(savedCart).filter(
      ([id, quantity]) =>
        typeof id === "string" &&
        id.length > 0 &&
        Number.isSafeInteger(quantity) &&
        quantity > 0
    )
  );
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the customer's saved cart from localStorage.
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const savedCart = window.localStorage.getItem(cartStorageKey);

        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(validateCart(parsedCart));
        }
      } catch (error) {
        console.error("Unable to load the saved cart.", error);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  // Keep the cart saved between visits and page refreshes.
  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(
        cartStorageKey,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("Unable to save the cart.", error);
    }
  }, [cart, isLoaded]);

  // Add or remove product quantities.
  const changeQuantity = useCallback((productId, amount) => {
    const id = String(productId);

    if (!id || !Number.isSafeInteger(amount) || amount === 0) {
      return;
    }

    setCart((currentCart) => {
      const nextQuantity = (currentCart[id] || 0) + amount;
      const nextCart = { ...currentCart };

      if (nextQuantity <= 0) {
        delete nextCart[id];
      } else {
        nextCart[id] = nextQuantity;
      }

      return nextCart;
    });
  }, []);

  // Clear the cart after a successful order.
  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const value = useMemo(
    () => ({
      cart,
      changeQuantity,
      clearCart,
      isLoaded,
    }),
    [cart, changeQuantity, clearCart, isLoaded]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
