"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./cart-provider";

export default function ProductActions({ product }) {
  const router = useRouter();
  const { cart, changeQuantity, isLoaded } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");

  let cartStatus = "In stock";
  if (!isLoaded) cartStatus = <span className="loading-skeleton product-status-skeleton" />;
  else if (cart[product.id] > 0) cartStatus = `${cart[product.id]} in your cart`;

  function addToCart() {
    changeQuantity(product.id, quantity);
    setFeedback(`${quantity} ${quantity === 1 ? "item" : "items"} added to cart.`);
  }

  function buyNow() {
    changeQuantity(product.id, quantity);
    router.push("/#products");
  }

  return (
    <>
      <div className="product-cart-status" aria-live="polite" aria-busy={!isLoaded}>
        {cartStatus}
      </div>
      <div className="product-purchase-row">
        <div className="product-quantity-control" aria-label="Choose quantity">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            aria-label="Decrease quantity"
            disabled={quantity === 1}
          >
            −
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button className="product-add-button" type="button" onClick={addToCart}>
          Add to cart
        </button>
      </div>
      <button className="product-buy-button" type="button" onClick={buyNow}>
        Buy now
      </button>
      <p className="product-action-feedback" role="status">{feedback}</p>
    </>
  );
}
